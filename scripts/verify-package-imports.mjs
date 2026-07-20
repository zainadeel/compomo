#!/usr/bin/env node
/** Install the packed tarball and load every supported public runtime surface. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pkg = JSON.parse(execFileSync('node', ['-e', "process.stdout.write(require('fs').readFileSync('package.json'))"], {
  cwd: repoRoot,
  encoding: 'utf8',
}));
const packDir = mkdtempSync(join(tmpdir(), 'ds-mo-pack-'));
const smokeDir = mkdtempSync(join(tmpdir(), 'ds-mo-consumer-'));
const npmEnv = { ...process.env, npm_config_cache: join(tmpdir(), 'ds-mo-npm-cache') };

async function verifyPackagedMcp(consumerDir) {
  const command = join(consumerDir, 'node_modules', '.bin', 'compomo-mcp');
  const transport = new StdioClientTransport({ command, cwd: consumerDir, stderr: 'pipe' });
  const client = new Client({ name: 'ds-mo-package-smoke', version: '1.0.0' });
  let stderr = '';
  transport.stderr?.on('data', chunk => {
    stderr += chunk.toString();
  });

  try {
    await client.connect(transport);
    const tools = await client.listTools();
    const toolNames = new Set(tools.tools.map(tool => tool.name));
    for (const name of ['list_components', 'get_component', 'list_patterns', 'get_pattern']) {
      if (!toolNames.has(name)) throw new Error(`Missing packaged MCP tool: ${name}`);
    }

    const result = await client.callTool({
      name: 'get_pattern',
      arguments: { name: 'menu-trigger', framework: 'react' },
    });
    const text = result.content
      ?.filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n') ?? '';
    if (result.isError || !text.includes('pattern:menu-trigger') || !text.includes('ViewMenu.tsx')) {
      throw new Error('Packaged MCP did not return the executable React menu-trigger recipe.');
    }
  } catch (error) {
    if (stderr) error.message += `\nMCP stderr:\n${stderr}`;
    throw error;
  } finally {
    await client.close();
  }
}

try {
  const packOutput = execFileSync('npm', ['pack', '--pack-destination', packDir, '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: npmEnv,
  });
  const [{ filename }] = JSON.parse(packOutput);
  const tarballPath = join(packDir, filename);
  writeFileSync(join(smokeDir, 'package.json'), JSON.stringify({
    name: 'ds-mo-package-smoke',
    private: true,
    type: 'module',
    dependencies: {
      '@angular/compiler': pkg.devDependencies['@angular/compiler'],
      '@angular/core': pkg.devDependencies['@angular/core'],
      '@angular/forms': pkg.devDependencies['@angular/forms'],
      '@ds-mo/icons': pkg.devDependencies['@ds-mo/icons'],
      '@ds-mo/tokens': pkg.devDependencies['@ds-mo/tokens'],
      '@ds-mo/ui': `file:${tarballPath}`,
      react: pkg.devDependencies.react,
      'react-dom': pkg.devDependencies['react-dom'],
    },
  }, null, 2));
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], {
    cwd: smokeDir,
    stdio: 'inherit',
    env: npmEnv,
  });

  const smokeSource = `
    globalThis.HTMLElement = class HTMLElement {};
    globalThis.customElements = { get() {}, define() {} };
    await import('@angular/compiler');
    const native = await import('@ds-mo/ui/components/ds-button-filled.js');
    const angular = await import('@ds-mo/ui/angular');
    const angularComponent = await import('@ds-mo/ui/angular/ds-button-filled');
    const react = await import('@ds-mo/ui/react');
    const shell = await import('@ds-mo/ui/shell');
    const toast = await import('@ds-mo/ui/toast');
    const utils = await import('@ds-mo/ui/utils');
    const agent = await import('@ds-mo/ui/agent', { with: { type: 'json' } });
    const patterns = await import('@ds-mo/ui/agent/patterns', { with: { type: 'json' } });
    for (const [surface, value] of [
      ['native', native.DsButtonFilled],
      ['angular', angular.DsButtonFilled],
      ['angular component subpath', angularComponent.DsButtonFilled],
      ['angular forms', angular.TextValueAccessor],
      ['react', react.DsButtonFilled],
      ['shell', shell.normalizeShellGradientPreset],
      ['shell swatch presets', shell.shellGradientPickerSections?.().flatMap(section => section.options).length],
      ['toast manager', toast.toastManager?.add],
      ['toast manager factory', toast.createToastManager],
      ['utils', utils.resolveCssLengthPx],
      ['agent manifest', agent.default?.entries?.length],
      ['agent pattern manifest', patterns.default?.entries?.length],
    ]) {
      if (value == null) throw new Error('Missing ' + surface + ' export');
    }
  `;
  execFileSync('node', ['--input-type=module', '--eval', smokeSource], {
    cwd: smokeDir,
    stdio: 'inherit',
  });
  await verifyPackagedMcp(smokeDir);
  console.log('✅ Packed native, Angular, React, shell, toast, utils, agent, and MCP entry points load successfully.');
} finally {
  rmSync(packDir, { recursive: true, force: true });
  rmSync(smokeDir, { recursive: true, force: true });
}
