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
console.log(fixed ? '  Planted bug: OFF (--fixed). Your tests should all pass.\n' : `  Planted bug: ON (${meta.bug}). A good test suite has at least one failure.\n`);

const env = { ...process.env, EXERCISE: name, ...(fixed ? { FIXED: '1' } : {}), ...(solution ? { SOLUTION: '1' } : {}) };
const r = spawnSync('pnpm', ['--filter', 'exercises', 'exec', 'playwright', 'test', ...flags.filter((f) => !['--fixed', '--solution'].includes(f))], { stdio: 'inherit', env, shell: process.platform === 'win32' });
if (!fixed && r.status !== 0) console.log(`\n✓ Red with the bug on is what you want. Now run: pnpm exercise ${name} --fixed`);
if (!fixed && r.status === 0) console.log(`\n✗ All green with the bug on: your tests missed it. Check HINTS.md.`);
process.exit(r.status ?? 1);
