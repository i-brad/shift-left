#!/usr/bin/env node
// pnpm exercise <name> [--fixed] [--solution]
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const [name, ...flags] = process.argv.slice(2);
const dirs = readdirSync(new URL('../exercises', import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(new URL(`../exercises/${d.name}/exercise.json`, import.meta.url)))
  .map((d) => d.name);

if (!name || !dirs.includes(name)) {
  console.log(`Usage: pnpm exercise <name> [--fixed] [--solution]\n\nExercises:\n${dirs.map((d) => `  ${d}`).join('\n')}`);
  process.exit(name ? 1 : 0);
}

const meta = JSON.parse(readFileSync(new URL(`../exercises/${name}/exercise.json`, import.meta.url), 'utf8'));
const fixed = flags.includes('--fixed');
const solution = flags.includes('--solution');
console.log(`\n▶ ${meta.title}`);
console.log(fixed ? '  Planted bug: OFF (--fixed). Your tests should all pass.\n' : `  Planted bug: ON (${meta.bug})${meta.env ? `, plus ${Object.entries(meta.env).map(([k, v]) => `${k}=${v}`).join(' ')}` : ''}. A good test suite has at least one failure.\n`);

const env = { ...process.env, EXERCISE: name, ...(fixed ? { FIXED: '1' } : {}), ...(solution ? { SOLUTION: '1' } : {}) };
const extra = flags.filter((f) => !['--fixed', '--solution'].includes(f));
const runner = meta.runner === 'vitest' ? ['vitest', 'run', ...extra] : ['playwright', 'test', ...extra];
// The Playwright runner starts Kudi with the bug; the Vitest runner passes it to the code under test.
const r = spawnSync('pnpm', ['--filter', 'exercises', 'exec', ...runner], { stdio: 'inherit', env: { ...env, KUDI_BUGS: fixed ? '' : meta.bug }, shell: process.platform === 'win32' });
if (!fixed && r.status !== 0)
  console.log(meta.runner === 'vitest'
    ? `\nRed. Check why above: a failing test means you found the bug; a coverage threshold means a branch is still untested.\nWhen a test fails for the right reason, run: pnpm exercise ${name} --fixed`
    : `\n✓ Red with the bug on is what you want. Now run: pnpm exercise ${name} --fixed`);
if (!fixed && r.status === 0) console.log(`\n✗ All green with the bug on: your tests missed it. Check HINTS.md.`);
process.exit(r.status ?? 1);
