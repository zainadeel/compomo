import { spawn } from 'node:child_process';
import { cleanFileProviderCollisions } from './clean-framework-proxies.mjs';
import { writePackageVersion, writeStorybookStamp } from './write-build-stamp.mjs';

writePackageVersion();

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const storybookWatchEnv =
  process.platform === 'darwin' && process.env.WATCHPACK_POLLING === undefined
    ? { WATCHPACK_POLLING: '1000' }
    : {};

const children = new Set();
let storybookStarted = false;
let shuttingDown = false;

const stopChild = (child, signal = 'SIGTERM') => {
  if (!child.pid || child.exitCode !== null) return;

  try {
    if (process.platform === 'win32') child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error;
  }
};

const cleanCollisions = () => {
  const collisions = cleanFileProviderCollisions();
  if (collisions.length) {
    process.stdout.write(
      `[storybook-dev] Cleaned ${collisions.length} File Provider collision artifact${collisions.length === 1 ? '' : 's'}\n`,
    );
  }
};

// File Provider can materialize collision copies several seconds after a
// generator finishes. Sweep while the dev process is alive instead of only at
// the exact Stencil completion boundary.
const collisionSweep = setInterval(cleanCollisions, 2000);
collisionSweep.unref();

const prefixAndPipe = (child, prefix, onLine) => {
  let stdoutBuffer = '';
  let stderrBuffer = '';

  const flush = (buffer, printer, reset) => {
    const lines = buffer.split(/\r?\n/);
    reset(lines.pop() ?? '');
    for (const line of lines) {
      if (!line) continue;
      printer(`[${prefix}] ${line}\n`);
      onLine?.(line);
    }
  };

  child.stdout?.setEncoding('utf8');
  child.stdout?.on('data', chunk => {
    stdoutBuffer += chunk;
    flush(stdoutBuffer, process.stdout.write.bind(process.stdout), next => {
      stdoutBuffer = next;
    });
  });

  child.stderr?.setEncoding('utf8');
  child.stderr?.on('data', chunk => {
    stderrBuffer += chunk;
    flush(stderrBuffer, process.stderr.write.bind(process.stderr), next => {
      stderrBuffer = next;
    });
  });

  child.on('close', () => {
    if (stdoutBuffer.trim()) process.stdout.write(`[${prefix}] ${stdoutBuffer}\n`);
    if (stderrBuffer.trim()) process.stderr.write(`[${prefix}] ${stderrBuffer}\n`);
  });
};

const spawnScript = (scriptName, prefix, onLine, extraEnv = {}) => {
  const child = spawn(npmCmd, ['run', scriptName], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, ...extraEnv },
    detached: process.platform !== 'win32',
  });

  children.add(child);
  prefixAndPipe(child, prefix, onLine);

  child.on('exit', code => {
    children.delete(child);

    if (shuttingDown) return;

    if (code !== 0) {
      shuttingDown = true;
      for (const other of children) stopChild(other);
      process.exit(code ?? 1);
    }
  });

  return child;
};

const startStorybook = () => {
  if (storybookStarted) return;
  storybookStarted = true;
  spawnScript('storybook:ui', 'storybook', undefined, {
    DS_STENCIL_WATCH: '1',
    ...storybookWatchEnv,
  });
};

const watcher = spawnScript('dev:components', 'stencil', line => {
  if (line.includes('build finished, watching for changes')) {
    cleanCollisions();
    writeStorybookStamp();
    if (!storybookStarted) {
      startStorybook();
    } else {
      process.stdout.write(
        '[storybook-dev] Component rebuild finished — Storybook reloads from dist/.storybook-ready\n',
      );
    }
  }
});

const shutdown = signal => {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(collisionSweep);

  for (const child of children) {
    stopChild(child, signal);
  }

  // Give children a moment to exit before we leave.
  setTimeout(() => process.exit(0), 250).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGHUP', () => shutdown('SIGHUP'));

watcher.on('spawn', () => {
  process.stdout.write('[storybook-dev] Waiting for initial Stencil watch build before starting Storybook...\n');
});
