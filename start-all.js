/**
 * ScrubSafe Application Launcher
 * Starts both Express Backend (port 5000) and Vite React Frontend (port 3000) in development
 * Starts only Express Backend in production (serves built frontend from frontend/dist)
 */

const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('========================================================');
console.log('  Starting ScrubSafe Full-Stack Healthcare Platform');
console.log('  Detect • Report • Alert • Protect');
console.log('========================================================\n');

// 1. Start Backend Server (always needed)
const backend = spawn(npmCmd, ['start'], {
  cwd: path.resolve(__dirname, 'backend'),
  shell: true,
  stdio: 'pipe'
});

backend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach((line) => {
    if (line.trim()) console.log(`\x1b[36m[Backend]\x1b[0m ${line}`);
  });
});

backend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach((line) => {
    if (line.trim()) console.error(`\x1b[31m[Backend Error]\x1b[0m ${line}`);
  });
});

// 2. Start Frontend Dev Server (only in development)
if (process.env.NODE_ENV !== 'production') {
  const frontend = spawn(npmCmd, ['run', 'dev', '--', '--port', '3000'], {
    cwd: path.resolve(__dirname, 'frontend'),
    shell: true,
    stdio: 'pipe'
  });

  frontend.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) console.log(`\x1b[32m[Frontend]\x1b[0m ${line}`);
    });
  });

  frontend.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) console.error(`\x1b[33m[Frontend Warn]\x1b[0m ${line}`);
    });
  });
} else {
  console.log('\x1b[32m[Frontend]\x1b[0m Skipping frontend dev server (production mode - serving built assets)');
}

function shutdown() {
  console.log('\nShutting down ScrubSafe servers...');
  backend.kill();
  // Only kill frontend if it was started
  if (typeof frontend !== 'undefined') {
    frontend.kill();
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);