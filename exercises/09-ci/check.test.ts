import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

/**
 * Exercise 09 · the rules your workflow must meet. Don't edit this file; edit workflow.yml.
 * `pnpm exercise 09-ci` checks yours; `--solution` checks the reference.
 */
const file = new URL(process.env.SOLUTION ? './solution/workflow.yml' : './workflow.yml', import.meta.url);
const text = readFileSync(file, 'utf8');
type Step = { uses?: string; run?: string; if?: string; env?: Record<string, string>; with?: Record<string, unknown> };
type Job = { needs?: string | string[]; 'timeout-minutes'?: number; strategy?: { matrix?: Record<string, unknown[]> }; steps: Step[] };
const wf = parse(text) as { on: Record<string, unknown> | string[]; jobs: Record<string, Job> };
const jobs = Object.values(wf.jobs ?? {});
const steps = jobs.flatMap((j) => j.steps ?? []);
const runs = steps.map((s) => s.run ?? '').join('\n');

describe('triggers', () => {
  it('runs on every pull request, before merge', () => {
    const on = Array.isArray(wf.on) ? Object.fromEntries(wf.on.map((k) => [k, null])) : wf.on;
    expect(Object.keys(on)).toContain('pull_request');
  });
});

describe('installs reproducibly', () => {
  it('uses the lockfile exactly (pnpm install --frozen-lockfile)', () => {
    expect(runs).toMatch(/pnpm install --frozen-lockfile/);
  });
  it('never sleeps to "wait for things"', () => {
    expect(runs).not.toMatch(/\bsleep\b/);
  });
});

describe('fast feedback first', () => {
  it('runs unit/API tests in a job the UI job waits for (needs)', () => {
    expect(jobs.some((j) => j.needs)).toBe(true);
  });
  it('every job has a timeout', () => {
    for (const j of jobs) expect(j['timeout-minutes'], 'timeout-minutes').toBeGreaterThan(0);
  });
});

describe('parallel', () => {
  it('splits the UI tests into shards with a matrix', () => {
    expect(jobs.some((j) => j.strategy?.matrix && Object.values(j.strategy.matrix).some((v) => Array.isArray(v) && v.length >= 2))).toBe(true);
    expect(runs).toMatch(/--shard=/);
  });
});

describe('evidence', () => {
  it('uploads the Playwright report and traces even when tests fail', () => {
    const upload = steps.find((s) => s.uses?.startsWith('actions/upload-artifact'));
    expect(upload, 'an upload-artifact step').toBeDefined();
    expect(upload!.if ?? '').toMatch(/always\(\)|failure\(\)|!cancelled\(\)/);
    expect(String(upload!.with?.path ?? '')).toMatch(/playwright-report|test-results/);
  });
});

describe('secrets', () => {
  it('reads passwords from secrets, never plain text', () => {
    const envValues = steps.flatMap((s) => Object.entries(s.env ?? {}));
    for (const [k, v] of envValues) if (/PASSWORD|TOKEN|KEY|SECRET/i.test(k)) expect(String(v), k).toMatch(/\$\{\{\s*secrets\./);
    expect(text).not.toMatch(/kudi-[a-z]+-pass/);
  });
});
