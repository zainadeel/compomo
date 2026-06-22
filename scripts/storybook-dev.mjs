import { spawn } from 'node:child_process';
import { writeBuildStamp } from './write-build-stamp.mjs';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const children = new Set();
let storybookStarted = false;
let shuttingDown = false;

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
  });

  children.add(child);
  prefixAndPipe(child, prefix, onLine);

  child.on('exit', code => {
    children.delete(child);

    if (shuttingDown) return;

    if (code !== 0) {
      shuttingDown = true;
      for (const other of children) other.kill('SIGTERM');
      process.exit(code ?? 1);
    }
  });

  return child;
};

const startStorybook = () => {
  if (storybookStarted) return;
  storybookStarted = true;
  spawnScript('storybook:ui', 'storybook', undefined, { DS_STENCIL_WATCH: '1' });
};

const watcher = spawnScript('dev', 'stencil', line => {
  if (line.includes('build finished, watching for changes')) {
    writeBuildStamp();
    if (!storybookStarted) {
      startStorybook();
    } else {
      process.stdout.write(
        '[storybook-dev] Stencil rebuild finished — Storybook reloads when dist/.build-stamp updates\n',
      );
    }
  }
});

const shutdown = signal => {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    child.kill(signal);
  }

  // Give children a moment to exit before we leave.
  setTimeout(() => process.exit(0), 250).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

watcher.on('spawn', () => {
  process.stdout.write('[storybook-dev] Waiting for initial Stencil watch build before starting Storybook...\n');
});
