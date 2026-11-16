/**
 * Inisio Capital Advisory - Concurrent Development Runner
 * Starts Backend API (port 5000) and Frontend Vite App (port 5173) together.
 * Usage:
 *   node Scripts/dev.js       (from repo root)
 *   npm run dev               (from repo root)
 */

'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const backendDir = fs.existsSync(path.join(root, 'Backend'))
  ? path.join(root, 'Backend')
  : path.join(root, 'backend');
const frontendDir = fs.existsSync(path.join(root, 'Frontend'))
  ? path.join(root, 'Frontend')
  : path.join(root, 'frontend');

const isWin = process.platform === 'win32';

function startProcess(label, cmd, args, cwd, color) {
  const C = {
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m',
  };
  const c = C[color] || C.reset;

  // On Windows, running npm requires shell
  const useShell = isWin && cmd !== process.execPath;

  const proc = spawn(cmd, args, {
    cwd,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: useShell,
    env: { ...process.env },
    windowsHide: true,
  });

  proc.stdout.on('data', (d) => {
    d.toString()
      .trimEnd()
      .split('\n')
      .forEach((l) => console.log(`${c}[${label}]${C.reset} ${l}`));
  });

  proc.stderr.on('data', (d) => {
    d.toString()
      .trimEnd()
      .split('\n')
      .forEach((l) => console.error(`${c}[${label}]${C.reset} ${l}`));
  });

  proc.on('exit', (code) => {
    console.log(`${c}[${label}]${C.reset} process exited (${code})`);
  });

  proc.on('error', (err) => {
    console.error(`${C.red}[${label} Error]${C.reset} ${err.message}`);
  });

  return proc;
}

// Kill any stale process on port 5000 first (Windows & Unix)
function killPort5000(cb) {
  if (!isWin) {
    const lsof = spawn('sh', ['-c', 'fuser -k 5000/tcp || lsof -ti :5000 | xargs -r kill -9'], {
      stdio: 'ignore',
      shell: false,
    });
    lsof.on('exit', () => cb());
    lsof.on('error', () => cb());
    return;
  }

  const killer = spawn(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      `$ids = (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess | Sort-Object -Unique; foreach ($id in $ids) { if ($id -and $id -ne 0) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue } }`,
    ],
    { stdio: 'ignore', shell: false, windowsHide: true }
  );
  killer.on('exit', () => cb());
  killer.on('error', () => cb());
}

console.log('\x1b[1m\x1b[34m====================================================\x1b[0m');
console.log('\x1b[1m\x1b[34m🚀 Inisio Capital Advisory - Concurrent Dev Runner\x1b[0m');
console.log('\x1b[1m\x1b[34m====================================================\x1b[0m');
console.log('  \x1b[32m●\x1b[0m Backend API  → http://localhost:5000');
console.log('  \x1b[36m●\x1b[0m Frontend App → http://localhost:5173\n');

killPort5000(() => {
  // Backend: Node native --watch on server.js (instant live reload)
  const backend = startProcess(
    'Backend ',
    process.execPath,
    ['--watch', 'server.js'],
    backendDir,
    'green'
  );

  // Frontend: Vite dev server
  const frontend = startProcess(
    'Frontend',
    'npm',
    ['run', 'dev'],
    frontendDir,
    'cyan'
  );

  let isShuttingDown = false;
  function shutdown() {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('\n\x1b[33mShutting down Inisio dev servers...\x1b[0m');
    try {
      backend.kill('SIGTERM');
    } catch {}
    try {
      frontend.kill('SIGTERM');
    } catch {}

    setTimeout(() => {
      try {
        backend.kill('SIGKILL');
      } catch {}
      try {
        frontend.kill('SIGKILL');
      } catch {}
      process.exit(0);
    }, 1200);
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
});
