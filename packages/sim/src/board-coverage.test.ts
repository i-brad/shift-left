import { describe, expect, it } from 'vitest';
import { runBoard, type BoardDef } from './board';
import { runCoverage } from './coverage';

const sel: BoardDef = {
  title: 't',
  mode: 'select',
  items: [
    { id: 'a', label: 'A', short: 'A', answer: 'yes' },
    { id: 'b', label: 'B', short: 'B', answer: 'no' },
    { id: 'c', label: 'C', short: 'C', answer: 'yes' },
  ],
};

describe('board', () => {
  it('select: counts right, wrong and missed', () => {
    expect(runBoard(sel, { a: 'yes', b: 'yes' }).metrics).toMatchObject({ right: 1, wrong: 1, missed: 1, complete: false });
    expect(runBoard(sel, { a: 'yes', c: 'yes' }).metrics).toMatchObject({ complete: true, score: 100 });
  });

  it('classify: every item needs the right zone', () => {
    const def: BoardDef = { title: 't', mode: 'classify', zones: [{ id: 'x', label: 'X', tone: 'sky' }, { id: 'y', label: 'Y', tone: 'pink' }], items: [{ id: 'a', label: 'A', short: 'A', answer: 'x' }, { id: 'b', label: 'B', short: 'B', answer: 'y' }] };
    expect(runBoard(def, { a: 'x' }).metrics).toMatchObject({ right: 1, missed: 1, complete: false });
    expect(runBoard(def, { a: 'x', b: 'x' }).metrics).toMatchObject({ wrong: 1 });
    expect(runBoard(def, { a: 'x', b: 'y' }).metrics.complete).toBe(true);
  });
});

describe('coverage', () => {
  it('one Plus test over ₦100,000 runs every statement but half the branches, and passes', () => {
    const r = runCoverage([{ tier: 'plus', amount: 200_000 }], false);
    expect(r.metrics).toMatchObject({ statementPct: 100, branchPct: 50, failing: 0 });
  });

  it('a Basic test takes the false branch and exposes NaN', () => {
    const r = runCoverage([{ tier: 'plus', amount: 200_000 }, { tier: 'basic', amount: 5000 }], false);
    expect(r.metrics).toMatchObject({ branchPct: 100, failing: 1 });
    expect(r.results[1]!.actual).toBeNaN();
  });

  it('initialising rate fixes it', () => {
    const r = runCoverage([{ tier: 'basic', amount: 5000 }, { tier: 'basic', amount: 200_000 }, { tier: 'plus', amount: 5000 }, { tier: 'plus', amount: 200_000 }], true);
    expect(r.metrics).toMatchObject({ failing: 0, branchPct: 100 });
    expect(r.results.map((x) => x.actual)).toEqual([0, 0, 50, 4000]);
  });
});

import { runPipeline, type PipelineDef } from './pipeline';

const P: PipelineDef = {
  title: 't',
  end: 'prod',
  stages: [
    { id: 'unit', label: 'Unit', cost: 1, seconds: 1 },
    { id: 'ui', label: 'UI', cost: 10, seconds: 60 },
    { id: 'prod', label: 'Production', cost: 1000, seconds: 0 },
  ],
  defects: [
    { id: 'a', label: 'A', origin: 'unit', caughtBy: ['unit', 'ui'] },
    { id: 'b', label: 'B', origin: 'unit', caughtBy: ['ui'] },
  ],
};

describe('pipeline', () => {
  it('everything escapes with no checks', () => {
    expect(runPipeline(P, []).metrics).toMatchObject({ escaped: 2, cost: 2000, seconds: 0 });
  });
  it('the earliest enabled stage that can detect a defect catches it', () => {
    const r = runPipeline(P, ['unit', 'ui']);
    expect(r.results.map((x) => x.caughtAt)).toEqual(['unit', 'ui']);
    expect(r.metrics).toMatchObject({ escaped: 0, cost: 11, seconds: 61 });
  });
  it('the end stage cannot be switched on as a check', () => {
    expect(runPipeline(P, ['prod']).metrics.escaped).toBe(2);
  });
});

import { bugShown, exchange, failingAssertions } from './request';

describe('request', () => {
  const none = new Set<never>();
  it('matches the spec when there are no bugs', () => {
    expect(exchange({ method: 'POST', path: '/api/transfers', auth: 'ada', body: 'valid' }, none)).toMatchObject({ matches: true, actual: { status: 201 } });
    expect(exchange({ method: 'GET', path: '/api/me', auth: 'none', body: 'none' }, none).actual.status).toBe(401);
  });
  it('history-amount-string passes a status check but fails shape and values', () => {
    const x = exchange({ method: 'GET', path: '/api/transfers', auth: 'ada', body: 'none' }, new Set(['history-amount-string']));
    expect(failingAssertions(x)).toEqual(['shape', 'values']);
    expect(bugShown(x)).toBe('history-amount-string');
  });
  it('transfer-idor lets Ada read transfer 9', () => {
    const x = exchange({ method: 'GET', path: '/api/transfers/9', auth: 'ada', body: 'none' }, new Set(['transfer-idor']));
    expect(x.expected.status).toBe(404);
    expect(x.actual.status).toBe(200);
    expect(bugShown(x)).toBe('transfer-idor');
  });
  it('bad-json-500 crashes on broken JSON', () => {
    const x = exchange({ method: 'POST', path: '/api/transfers', auth: 'ada', body: 'malformed' }, new Set(['bad-json-500']));
    expect(x).toMatchObject({ expected: { status: 400 }, actual: { status: 500 } });
    expect(bugShown(x)).toBe('bad-json-500');
  });
});
