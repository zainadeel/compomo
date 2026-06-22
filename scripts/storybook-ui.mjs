#!/usr/bin/env node
/**
 * Storybook UI only — must be started via `npm run storybook` so Stencil watch
 * rebuilds dist/ and the Vite dist-reload plugin can refresh the canvas.
 */
import { spawn } from 'node:child_process';

if (!process.env.DS_STENCIL_WATCH) {
  process.stderr.write(
    '\n⚠️  Run `npm run storybook` (not `storybook:ui`) for live Stencil → Storybook reloads.\n' +
      '   Starting UI anyway — canvas will stay stale until you rebuild dist/.\n\n',
  );
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const child = spawn(npmCmd, ['exec', '--', 'storybook', 'dev', '-p', '6006', '--no-open'], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', code => process.exit(code ?? 0));
