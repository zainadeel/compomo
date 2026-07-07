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
 *
 * Registry data is re-read from disk on every call so the MCP server always
 * reflects the latest registry:build output without needing a restart.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGISTRY_DIR = path.resolve(ROOT, 'public', 'r');

// ─── Load registry (fresh read every call) ──────────────────────────────────────

function ensureRegistry() {
  const registryPath = path.join(REGISTRY_DIR, 'registry.json');
  if (!fs.existsSync(registryPath)) {
    // Auto-build if missing
    try {
      execSync('node scripts/build-registry.mjs', { cwd: ROOT, stdio: 'pipe' });
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
  const filePath = path.join(REGISTRY_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// ─── Formatting helpers ─────────────────────────────────────────────────────────

function formatComponentList(items) {
  const lines = items.map(item => {
    const deps = item.dependencies?.filter(d => d !== '@ds-mo/ui') ?? [];
    const depsNote = deps.length ? ` (also needs ${deps.join(', ')})` : '';
    return `- **${item.title}** (\`${item.name}\`)${depsNote}\n  ${item.description}`;
  });
  return lines.join('\n\n');
}

function formatComponentDetail(comp) {
  const m = comp.meta;
  const c = m.consumption;
  const sections = [];

  // Header
  sections.push(`# ${m.exports.join(', ')}\n\n${comp.description}`);

  // Quick start
  sections.push(`## Setup\n\n\`\`\`bash\n${c.install}\n\`\`\``);

  sections.push(`## Imports\n\n\`\`\`tsx\n// CSS (once at app entry point)\n${c.cssImport}\n${c.cssSetup ? `\n// Design tokens\n${c.cssSetup.split('\n')[0]}` : ''}\n\n// Component\n${c.import}\n${c.typeImport ? `\n// Types (optional)\n${c.typeImport}` : ''}${c.iconImport ? `\n\n// Icons (if using icon props)\n${c.iconImport}` : ''}\n\`\`\``);

  // Props
  if (m.props && Object.keys(m.props).length > 0) {
    const propLines = Object.entries(m.props).map(([name, def]) => {
      const req = def.required ? ' **(required)**' : '';
      const dflt = def.default ? ` — default: \`${def.default}\`` : '';
      const desc = def.description ? ` — ${def.description}` : '';
      return `| \`${name}\` | \`${def.type}\` | ${req}${dflt}${desc} |`;
    });
    sections.push(`## Props\n\n| Prop | Type | Notes |\n|------|------|-------|\n${propLines.join('\n')}`);
  }

  // Internal deps
  if (c.internalDependencies?.length) {
    const depList = c.internalDependencies.map(d => `- ${d.component}: ${d.note}`).join('\n');
    sections.push(`## Internal Dependencies\n\n${depList}`);
  }

  // Peer deps
  if (c.peerDependencies) {
    const reqs = c.peerDependencies.required.map(d => `- ${d} (required)`).join('\n');
    const opts = (c.peerDependencies.optional ?? []).map(d => `- ${d} (optional)`).join('\n');
    sections.push(`## Peer Dependencies\n\n${reqs}${opts ? `\n${opts}` : ''}`);
  }

  // Usage notes
  if (c.notes) {
    sections.push(`## Notes\n\n${c.notes}`);
  }

  // Storybook link
  if (m.storybook) {
    sections.push(`## Storybook\n\n${m.storybook}`);
  }

  return sections.join('\n\n---\n\n');
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
import { DsButton, DsText } from '@ds-mo/ui/react';
import '@ds-mo/tokens';

function MyPage() {
  return <DsButton>Continue</DsButton>;
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

    const header = `# ${comp.meta.exports.join(', ')} — Source Reference\n\n> This is reference code. Import from \`@ds-mo/ui\` instead of copying.\n> \`${comp.meta.consumption.import}\``;

    return { content: [{ type: 'text', text: `${header}\n\n${sections.join('\n\n')}` }] };
  }
);

// ─── Start ──────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
