'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const startedAt = Date.now();

const result = spawnSync(
  'npx vite build --config vite.config.chrome.ts --mode development',
  {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  },
);

const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);

if (result.status === 0) {
  process.stdout.write('\n');
  process.stdout.write('========================================\n');
  process.stdout.write(`[OK] Build complete (${elapsedSec}s) -> dist_chrome\n`);
  process.stdout.write('     >>> Reload extension at chrome://extensions <<<\n');
  process.stdout.write('     Then refresh Gemini page\n');
  process.stdout.write('========================================\n');
  process.stdout.write('\n');
} else {
  process.stderr.write('\n');
  process.stderr.write('========================================\n');
  process.stderr.write('[FAIL] Build failed. See errors above.\n');
  process.stderr.write('========================================\n');
  process.stderr.write('\n');
}

process.exit(result.status ?? 1);
