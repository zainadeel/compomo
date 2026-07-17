#!/usr/bin/env node

/**
 * CompoMo MCP Server
 *
 * A Model Context Protocol server that exposes the @ds-mo/ui component library
 * to AI coding tools (Claude Code, Cursor, Windsurf, VS Code).
 *
 * Unlike the shadcn MCP server (which copies source files), this server guides
 * AI tools to use the library via npm — proper imports, peer dependencies, CSS
 * setup, and prop references.
 *
 * Transport: stdio (spawned as child process by the AI tool)
 *
 * Tools:
 *   list_components     — Browse all available components
 *   get_component       — Detailed component info (props, usage, source)
 *   get_setup_guide     — Project setup instructions for @ds-mo/ui
 *   get_component_source — Full source code for AI reference
 *   list_patterns       — Browse supported multi-component compositions
 *   get_pattern         — Retrieve executable framework recipes for a composition
 *
 * In a source checkout, registry data is re-read on every call so the server
 * reflects the latest registry:build output without a restart. The published
 * executable reads the generated snapshot bundled into dist/.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatComponentDetail,
  formatComponentList,
  formatComponentSourceHeader,
  formatPatternDetail,
  formatPatternList,
} from './registry-formatters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_ROOT = path.resolve(__dirname, '..');
const IS_SOURCE_CHECKOUT = fs.existsSync(path.join(SOURCE_ROOT, 'scripts', 'build-registry.mjs'));
const REGISTRY_DIR = IS_SOURCE_CHECKOUT
  ? path.resolve(SOURCE_ROOT, 'public', 'r')
  : path.resolve(__dirname, '..', 'mcp-data', 'registry');
const PATTERN_DIR = path.resolve(SOURCE_ROOT, 'agent', 'patterns');
const PATTERN_MANIFEST = path.resolve(__dirname, '..', 'agent-patterns.json');

// ─── Load registry (fresh read every call) ──────────────────────────────────────

function ensureRegistry() {
  const registryPath = path.join(REGISTRY_DIR, 'registry.json');
  if (!fs.existsSync(registryPath)) {
    if (!IS_SOURCE_CHECKOUT) {
      throw new Error('The published @ds-mo/ui MCP registry snapshot is missing. Reinstall the package.');
    }

    // Auto-build if missing in a source checkout.
    try {
      execSync('node scripts/build-registry.mjs', { cwd: SOURCE_ROOT, stdio: 'pipe' });
    } catch {
      throw new Error(
        `Registry not found and auto-build failed. Run "npm run registry:build" manually.`
      );
    }
  }
}

function loadRegistry() {
  ensureRegistry();
  return JSON.parse(fs.readFileSync(path.join(REGISTRY_DIR, 'registry.json'), 'utf-8'));
}

function loadComponent(name) {
  ensureRegistry();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) return null;
  const filePath = path.join(REGISTRY_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function patternPaths(directory = PATTERN_DIR) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) return patternPaths(child);
    return entry.name.endsWith('.agent.json') ? [child] : [];
  }).sort();
}

function loadPatterns() {
  if (IS_SOURCE_CHECKOUT) {
    return patternPaths().map(patternPath => JSON.parse(fs.readFileSync(patternPath, 'utf8')));
  }
  if (!fs.existsSync(PATTERN_MANIFEST)) {
    throw new Error('The published @ds-mo/ui MCP pattern snapshot is missing. Reinstall the package.');
  }
  return JSON.parse(fs.readFileSync(PATTERN_MANIFEST, 'utf8')).entries;
}

function loadPattern(name) {
  const normalized = name.replace(/^pattern:/, '').toLowerCase();
  return loadPatterns().find(pattern => pattern.id === `pattern:${normalized}`) ?? null;
}

function formatSetupGuide() {
  const m = loadRegistry().meta;
  return `# @ds-mo/ui — Project Setup Guide

## 1. Install packages

\`\`\`bash
${m.install}
\`\`\`

## 2. Import CSS at your app entry point

\`\`\`tsx
// main.tsx or App.tsx — import BEFORE your app code
${m.cssSetup}
\`\`\`

## 3. Register custom elements

\`\`\`tsx
${m.register}
\`\`\`

## 4. Theme support

${m.themeSetup}

\`\`\`tsx
// Example: toggle dark mode
document.documentElement.setAttribute('data-theme', 'dark');
\`\`\`

## 5. Use components

**React wrappers** (Stencil-generated):

\`\`\`tsx
import { DsButtonFilled, DsText } from '@ds-mo/ui/react';
import '@ds-mo/tokens';

function MyPage() {
  return <DsButtonFilled label="Continue" />;
}
\`\`\`

**Custom elements** (any framework):

\`\`\`html
<ds-button-filled icon="Check" intent="brand" aria-label="Continue"></ds-button-filled>
\`\`\`

## 6. Peer dependencies

**Required:**
${m.peerDependencies.required.map(d => `- \`${d}\``).join('\n')}

${m.peerDependencies.optional?.length ? `**Optional:**\n${m.peerDependencies.optional.map(d => `- \`${d}\``).join('\n')}` : ''}

## 7. Design token architecture

Components use CSS custom properties from \`@ds-mo/tokens\`:
- \`var(--color-*)\` — colors (foreground, background, border, interaction)
- \`var(--dimension-*)\` — spacing, sizing, radius
- \`var(--effect-*)\` — shadows, transitions, blur
- \`var(--typography-*)\` — font sizes, weights, line heights

Never hardcode these values. The tokens support light/dark theming automatically.

## 8. Important

- Source of truth is Stencil \`<ds-*>\` custom elements in \`dist/components/\`
- Angular: \`@ds-mo/ui/angular\` proxies; React: \`@ds-mo/ui/react\` wrappers
- No \`@ds-mo/ui/loader\` or global \`@ds-mo/ui/css\` — import per-component JS modules
- Icons: \`@ds-mo/icons\` is a required peer; \`<ds-icon name="Bell" />\` uses IcoMo export keys
`;
}

// ─── MCP Server ─────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'compomo',
  version: '1.0.0',
});

// Tool 1: List components
server.registerTool(
  'list_components',
  {
    title: 'List Components',
    description: 'List all available components in the @ds-mo/ui design system library. Returns component names, descriptions, and required packages.',
    inputSchema: {
      search: z.string().optional().describe('Optional text to filter components by name or description.'),
    },
  },
  async ({ search }) => {
    let items = loadRegistry().items;

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(item =>
        item.name.includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }

    if (items.length === 0) {
      return {
        content: [{ type: 'text', text: `No components found${search ? ` matching "${search}"` : ''}.` }],
      };
    }

    const text = `# @ds-mo/ui — ${items.length} component${items.length === 1 ? '' : 's'}${search ? ` matching "${search}"` : ''}\n\n${formatComponentList(items)}`;

    return { content: [{ type: 'text', text }] };
  }
);

// Tool 2: Get component detail
server.registerTool(
  'get_component',
  {
    title: 'Get Component',
    description: 'Get detailed information about a specific @ds-mo/ui component including props API, import statements, setup instructions, peer dependencies, and full source code for reference.',
    inputSchema: {
      name: z.string().describe('Component name in kebab-case (e.g., "button", "tab-group", "toggle-button") or PascalCase (e.g., "Button", "TabGroup").'),
    },
  },
  async ({ name }) => {
    // Normalize to kebab-case
    const kebab = name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
      .toLowerCase();

    const comp = loadComponent(kebab);

    if (!comp) {
      // Suggest close matches
      const allNames = loadRegistry().items.map(i => i.name);
      const suggestions = allNames.filter(n => n.includes(kebab) || kebab.includes(n));
      const hint = suggestions.length
        ? `\n\nDid you mean: ${suggestions.map(s => `\`${s}\``).join(', ')}?`
        : `\n\nAvailable: ${allNames.join(', ')}`;

      return {
        content: [{ type: 'text', text: `Component "${name}" not found.${hint}` }],
        isError: true,
      };
    }

    return { content: [{ type: 'text', text: formatComponentDetail(comp) }] };
  }
);

// Tool 3: Setup guide
server.registerTool(
  'get_setup_guide',
  {
    title: 'Get Setup Guide',
    description: 'Get the full project setup guide for @ds-mo/ui — install commands, CSS imports, theme configuration, and design token architecture.',
  },
  async () => {
    return { content: [{ type: 'text', text: formatSetupGuide() }] };
  }
);

// Tool 4: Get component source
server.registerTool(
  'get_component_source',
  {
    title: 'Get Component Source',
    description: 'Get the full source code of a @ds-mo/ui component for reference. Use this to understand implementation patterns, not to copy the code into a project.',
    inputSchema: {
      name: z.string().describe('Component name in kebab-case (e.g., "button", "modal").'),
    },
  },
  async ({ name }) => {
    const kebab = name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
      .toLowerCase();

    const comp = loadComponent(kebab);
    if (!comp) {
      return {
        content: [{ type: 'text', text: `Component "${name}" not found.` }],
        isError: true,
      };
    }

    const sections = comp.files.map(f => {
      const lang = f.path.endsWith('.css') ? 'css' : 'tsx';
      return `### ${f.path}\n\n\`\`\`${lang}\n${f.content}\n\`\`\``;
    });

    const header = formatComponentSourceHeader(comp);

    return { content: [{ type: 'text', text: `${header}\n\n${sections.join('\n\n')}` }] };
  }
);

// Tool 5: List composition patterns
server.registerTool(
  'list_patterns',
  {
    title: 'List Patterns',
    description: 'List supported @ds-mo/ui multi-component composition patterns with executable framework recipes.',
    inputSchema: {
      search: z.string().optional().describe('Optional text to filter patterns by id, summary, or use case.'),
    },
  },
  async ({ search }) => {
    let patterns = loadPatterns();
    if (search) {
      const query = search.toLowerCase();
      patterns = patterns.filter(pattern => [
        pattern.id,
        pattern.summary,
        ...(pattern.useWhen ?? []),
        ...(pattern.avoidWhen ?? []),
      ].some(value => value.toLowerCase().includes(query)));
    }
    if (!patterns.length) {
      return {
        content: [{ type: 'text', text: `No composition patterns found${search ? ` matching "${search}"` : ''}.` }],
      };
    }
    return {
      content: [{ type: 'text', text: `# @ds-mo/ui — ${patterns.length} composition pattern${patterns.length === 1 ? '' : 's'}\n\n${formatPatternList(patterns)}` }],
    };
  }
);

// Tool 6: Get an executable composition pattern
server.registerTool(
  'get_pattern',
  {
    title: 'Get Pattern',
    description: 'Get design intent, state ownership, accessibility requirements, and executable Custom Elements, React, or Angular recipes for an @ds-mo/ui composition.',
    inputSchema: {
      name: z.string().describe('Pattern id or name, for example "menu-trigger" or "pattern:menu-trigger".'),
      framework: z.enum(['customElements', 'react', 'angular']).optional().describe('Return recipes only for this framework. Omit to return every implementation.'),
    },
  },
  async ({ name, framework }) => {
    const pattern = loadPattern(name);
    if (!pattern) {
      const available = loadPatterns().map(item => item.id).join(', ');
      return {
        content: [{ type: 'text', text: `Pattern "${name}" not found. Available: ${available}` }],
        isError: true,
      };
    }
    return { content: [{ type: 'text', text: formatPatternDetail(pattern, framework) }] };
  }
);

// ─── Start ──────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
