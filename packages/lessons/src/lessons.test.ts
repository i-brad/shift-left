import { describe, expect, it } from 'vitest';
import { acceptanceCriteria, attemptCard, coverage, course, defectReports, exploratory, decisionTables, evaluateStep, glossary, initialLearner, lessonCount, lessons, partitionsBoundaries as L, stateTransitions, type BoardEval, type BoundaryEval, type CardEval, type CoverageEval, type FeeEval, type Learner, type Lesson } from './index';

const learner = (o: Partial<Learner> = {}): Learner => ({ ...initialLearner(), ...o });
const stepOf = (lesson: Lesson, id: string) => {
  const s = lesson.steps.find((x) => x.id === id);
  if (!s) throw new Error(`no step ${id}`);
  return s;
};

const step = (id: string) => {
  const s = L.steps.find((x) => x.id === id);
  if (!s) throw new Error(`no step ${id}`);
  return s;
};

describe('course outline', () => {
  it('has the 29 core lessons plus branches and capstone', () => {
    const core = course.filter((m) => m.n <= 6).reduce((n, m) => n + m.lessons.length, 0);
    expect(core).toBe(29);
    expect(lessonCount).toBe(34);
  });

  it('every built lesson has a lesson file', () => {
    for (const l of course.flatMap((m) => m.lessons).filter((l) => l.built)) {
      expect(lessons[l.id], l.id).toBeDefined();
    }
  });

  it('covers all six CTFL chapters', () => {
    const chapters = new Set(course.flatMap((m) => m.lessons.flatMap((l) => l.ctfl ?? [])).map((t) => t.split('.')[0]));
    expect([...chapters].sort()).toEqual(['FL-1', 'FL-2', 'FL-3', 'FL-4', 'FL-5', 'FL-6']);
  });
});

describe('glossary links', () => {
  it('every [[term]] in lesson text exists in the glossary', () => {
    const text = JSON.stringify(Object.values(lessons));
    const keys = [...text.matchAll(/\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]/g)].map((m) => m[1]!);
    expect(keys.length).toBeGreaterThan(5);
    for (const k of keys) expect(glossary[k], k).toBeDefined();
  });
});

describe('Partitions and boundaries', () => {
  it('predictions have their answer among the options', () => {
    for (const s of L.steps.filter((s) => s.predict)) {
      expect(s.predict!.options.map((o) => o.id)).toContain(s.predict!.answer);
    }
  });

  it('the boundary prediction matches what the simulation says fails', () => {
    const e = (evaluateStep(step('boundaries'), learner({ operator: '<', probe: null })) as BoundaryEval);
    const failing = e.run.results.filter((r) => !r.passed).map((r) => String(r.amount));
    expect(failing).toEqual([step('boundaries').predict!.answer]);
  });

  it('the partition prediction is right: three partitions find nothing', () => {
    const e = (evaluateStep(step('partitions'), learner({ operator: '<', probe: null })) as BoundaryEval);
    expect(e.run.metrics.failing === 0 ? 'no' : 'yes').toBe(step('partitions').predict!.answer);
  });

  it('check answers point at real options', () => {
    for (const q of L.check) expect(q.options[q.answer]).toBeDefined();
  });

  it('has unique step ids and rail labels', () => {
    expect(new Set(L.steps.map((s) => s.id)).size).toBe(L.steps.length);
    expect(new Set(L.steps.map((s) => s.rail)).size).toBe(L.steps.length);
  });

  it('learn items point at real steps', () => {
    for (const l of L.learn) expect(L.steps[l.afterStep]).toBeDefined();
  });

  it('three partitions miss the bug', () => {
    const e = (evaluateStep(step('partitions'), learner({ operator: '<', probe: null })) as BoundaryEval);
    expect(e.run.metrics).toMatchObject({ groupsCovered: 3, failing: 0 });
  });

  it('the production goal is met only by reproducing ₦500,000', () => {
    const s = step('production');
    expect((evaluateStep(s, learner({ operator: '<', probe: null })) as BoundaryEval).goalMet).toBe(false);
    expect((evaluateStep(s, learner({ operator: '<', probe: 5000 })) as BoundaryEval).goalMet).toBe(false);
    expect((evaluateStep(s, learner({ operator: '<', probe: 500_000 })) as BoundaryEval).goalMet).toBe(true);
  });

  it('boundary values catch exactly one failure', () => {
    const e = (evaluateStep(step('boundaries'), learner({ operator: '<=', probe: null })) as BoundaryEval);
    expect(e.run.metrics.failing).toBe(1);
    expect(e.escapedBugs).toBe(1);
  });

  it('the root-cause goal needs the learner to flip the operator', () => {
    const s = step('root-cause');
    expect((evaluateStep(s, learner({ operator: '<', probe: null })) as BoundaryEval).goalMet).toBe(false);
    const fixed = (evaluateStep(s, learner({ operator: '<=', probe: null })) as BoundaryEval);
    expect(fixed.goalMet).toBe(true);
    expect(fixed.escapedBugs).toBe(0);
  });

  it('every step after the fix is green', () => {
    for (const id of ['automate', 'recap']) {
      expect((evaluateStep(step(id), learner()) as BoundaryEval).run.metrics.failing).toBe(0);
    }
  });
});

describe('every built lesson', () => {
  for (const lesson of Object.values(lessons)) {
    describe(lesson.title, () => {
      it('has consistent steps, predictions, learn items and check', () => {
        expect(new Set(lesson.steps.map((s) => s.id)).size).toBe(lesson.steps.length);
        expect(new Set(lesson.steps.map((s) => s.rail)).size).toBe(lesson.steps.length);
        // A lesson's main scene is its first; later steps may switch to another (e.g. request → board).
        expect(lesson.steps[0]!.scene.kind).toBe(lesson.scene);
        for (const s of lesson.steps) {
          if (s.scene.kind === 'board') expect(lesson.boards?.[s.scene.board], s.scene.board).toBeDefined();
          if (s.scene.kind === 'pipeline') expect(lesson.pipelines?.[s.scene.pipeline], s.scene.pipeline).toBeDefined();
          if (s.predict) expect(s.predict.options.map((o) => o.id)).toContain(s.predict.answer);
        }
        for (const l of lesson.learn) expect(lesson.steps[l.afterStep]).toBeDefined();
        for (const q of lesson.check) expect(q.options[q.answer]).toBeDefined();
        expect(lesson.atWork.length).toBeGreaterThanOrEqual(3);
      });
    });
  }
});

describe('Decision tables', () => {
  const D = decisionTables;
  const fee = (id: string, o: Partial<Learner> = {}) => evaluateStep(stepOf(D, id), learner(o)) as FeeEval;

  it('one-at-a-time covers 4 of 8 and finds nothing', () => {
    expect(fee('one-at-a-time').run.metrics).toMatchObject({ combosCovered: 4, failing: 0 });
  });

  it('the incident goal needs Plus + express', () => {
    expect(fee('incident').goalMet).toBe(false);
    expect(fee('incident', { fee: { tier: 'plus', amount: 3000, express: true } }).goalMet).toBe(true);
  });

  it('the full table fails exactly the Plus + express slice, as predicted', () => {
    const r = fee('fill-gaps').run;
    expect(r.results.filter((x) => !x.passed).map((x) => x.id).sort()).toEqual(['plus-high-express', 'plus-low-express']);
    expect(stepOf(D, 'fill-gaps').predict!.answer).toBe('plus-express');
  });

  it('one test per rule still catches the bug', () => {
    expect(fee('collapse').run.metrics).toMatchObject({ tests: 5, rulesCovered: 5, failing: 1 });
  });

  it('the root-cause goal needs the learner to reorder the rules', () => {
    expect(fee('root-cause').goalMet).toBe(false);
    expect(fee('root-cause', { feeOrder: 'tier-first' }).goalMet).toBe(true);
  });
});

describe('State transitions', () => {
  const S = stateTransitions;
  const card = (id: string, o: Partial<Learner> = {}) => evaluateStep(stepOf(S, id), learner(o)) as CardEval;

  it('valid-only coverage finds nothing', () => {
    expect(card('happy-paths').run.metrics).toMatchObject({ validCovered: 4, invalidCovered: 0, failing: 0 });
  });

  it('the incident goal is met by blocking then unfreezing', () => {
    let l = learner();
    l = attemptCard(l, 'block', true);
    expect(evaluateStep(stepOf(S, 'incident'), l).goalMet).toBe(false);
    l = attemptCard(l, 'unfreeze', true);
    expect(l.card.state).toBe('active');
    expect(evaluateStep(stepOf(S, 'incident'), l).goalMet).toBe(true);
  });

  it('testing refusals fails exactly what the prediction says', () => {
    const r = card('refusals').run;
    expect(r.results.filter((x) => !x.passed).map((x) => x.id)).toEqual([stepOf(S, 'refusals').predict!.answer]);
  });

  it('the root-cause goal needs the learner to fix the check', () => {
    expect(card('root-cause').goalMet).toBe(false);
    expect(card('root-cause', { cardFixed: true }).goalMet).toBe(true);
  });
});

describe('board lessons', () => {
  for (const lesson of Object.values(lessons).filter((l) => l.scene === 'board')) {
    it(`${lesson.title}: every board goal is reachable with the right answers and not with none`, () => {
      for (const s of lesson.steps.filter((x) => x.goal?.check.kind === 'board-complete')) {
        const id = (s.goal!.check as { board: string }).board;
        const def = lesson.boards![id]!;
        const right = Object.fromEntries(def.items.filter((i) => def.mode === 'classify' || i.answer === 'yes').map((i) => [i.id, def.mode === 'select' ? 'yes' : i.answer]));
        expect(evaluateStep(s, learner(), lesson).goalMet).toBe(false);
        expect(evaluateStep(s, learner({ board: { [id]: right } }), lesson).goalMet, 'needs Check').toBe(false);
        expect(evaluateStep(s, learner({ board: { [id]: right }, boardChecked: { [id]: true } }), lesson).goalMet).toBe(true);
      }
    });
  }

  it('board evals expose the board', () => {
    const e = evaluateStep(exploratory.steps[0]!, learner(), exploratory) as BoardEval;
    expect(e.def.items.length).toBeGreaterThan(5);
  });
});

describe('Statement and branch coverage', () => {
  const C = coverage;
  const cov = (id: string, o: Partial<Learner> = {}) => evaluateStep(stepOf(C, id), learner(o)) as CoverageEval;

  it('one test: 100% statements, 50% branches, passing', () => {
    expect(cov('hundred').run.metrics).toMatchObject({ statementPct: 100, branchPct: 50, failing: 0 });
  });

  it('the incident goal needs a learner test on the Basic path', () => {
    expect(cov('incident').goalMet).toBe(false);
    expect(cov('incident', { covTests: [{ tier: 'plus', amount: 5000 }] }).goalMet).toBe(false);
    expect(cov('incident', { covTests: [{ tier: 'basic', amount: 5000 }] }).goalMet).toBe(true);
  });

  it('all four combinations: 2 fail', () => {
    expect(cov('all-branches').run.metrics).toMatchObject({ branchPct: 100, failing: 2 });
  });

  it('root cause needs the learner fix', () => {
    expect(cov('root-cause').goalMet).toBe(false);
    expect(cov('root-cause', { covFixed: true }).goalMet).toBe(true);
  });
});

describe('pipeline lessons', () => {
  for (const lesson of Object.values(lessons).filter((l) => l.scene === 'pipeline')) {
    it(`${lesson.title}: learner goals are reachable by switching everything on, not with nothing`, () => {
      for (const s of lesson.steps.filter((x) => x.goal?.check.kind === 'pipeline-target')) {
        const id = (s.goal!.check as { pipeline: string }).pipeline;
        const all = lesson.pipelines![id]!.stages.map((st) => st.id);
        expect(evaluateStep(s, learner({ pipes: { [id]: [] } }), lesson).goalMet).toBe(false);
        // Time budgets can make "everything on" too slow; those goals are tested per lesson.
        if ((s.goal!.check as { maxSeconds?: number }).maxSeconds === undefined) expect(evaluateStep(s, learner({ pipes: { [id]: all } }), lesson).goalMet).toBe(true);
      }
    });
  }
});

describe('Module 3 · API lessons', () => {
  const R = (method: string, path: string, auth: string, body: string) => ({ method, path, auth, body }) as never;

  it('HTTP: four statuses need four different requests', () => {
    const s = stepOf(lessons['http-for-testers']!, 'collect');
    expect(evaluateStep(s, learner({ sent: [R('POST', '/api/transfers', 'ada', 'valid')] })).goalMet).toBe(false);
    const sent = [R('POST', '/api/transfers', 'ada', 'valid'), R('GET', '/api/me', 'none', 'none'), R('GET', '/api/nope', 'ada', 'none'), R('POST', '/api/transfers', 'ada', 'string-amount')];
    expect(evaluateStep(s, learner({ sent })).goalMet).toBe(true);
  });

  it('Asserting: status alone misses the string amount; shape catches it', () => {
    const s = stepOf(lessons['asserting-responses']!, 'assert-shape');
    expect(evaluateStep(s, learner({ assertions: ['status'] })).goalMet).toBe(false);
    expect(evaluateStep(s, learner({ assertions: ['status', 'shape'] })).goalMet).toBe(true);
  });

  it('Authz: the IDOR only shows as Ada on a transfer that is not hers', () => {
    const s = stepOf(lessons['authn-authz']!, 'idor');
    expect(evaluateStep(s, learner({ sent: [R('GET', '/api/transfers/7', 'ada', 'none')] })).goalMet).toBe(false);
    expect(evaluateStep(s, learner({ sent: [R('GET', '/api/transfers/9', 'tunde', 'none')] })).goalMet).toBe(false);
    expect(evaluateStep(s, learner({ sent: [R('GET', '/api/transfers/9', 'ada', 'none')] })).goalMet).toBe(true);
  });

  it('Negative: broken JSON is the 500', () => {
    const s = stepOf(lessons['negative-tests']!, 'crash');
    expect(evaluateStep(s, learner({ sent: [R('POST', '/api/transfers', 'ada', 'huge'), R('POST', '/api/transfers', 'ada', 'string-amount')] })).goalMet).toBe(false);
    expect(evaluateStep(s, learner({ sent: [R('POST', '/api/transfers', 'ada', 'malformed')] })).goalMet).toBe(true);
  });
});

describe('Module 4 · Web automation', () => {
  const ev = (lessonId: string, stepId: string, o: Partial<Learner> = {}) => {
    const lesson = lessons[lessonId]!;
    return evaluateStep(stepOf(lesson, stepId), learner(o), lesson);
  };

  it('locators: only user-facing choices meet the goal', () => {
    expect(ev('locators', 'choose', { locators: { recipient: 'xpath', amount: 'label', send: 'role', balance: 'testid' } }).goalMet).toBe(false);
    expect(ev('locators', 'choose', { locators: { recipient: 'label', amount: 'label', send: 'role', balance: 'text' } }).goalMet).toBe(false);
    expect(ev('locators', 'choose', { locators: { recipient: 'label', amount: 'role', send: 'testid', balance: 'testid' } }).goalMet).toBe(true);
  });

  it('waiting: 6 of 10 pass with a 1 s sleep', () => {
    const e = ev('waiting', 'sleep');
    expect(e.kind === 'timing' && e.result.metrics.passed).toBe(6);
  });

  it('waiting: only auto-wait meets the goal at 800 ms', () => {
    expect(ev('waiting', 'auto', { timing: { latency: 800, strategy: 'sleep', sleepMs: 3000 } }).goalMet).toBe(false);
    expect(ev('waiting', 'auto', { timing: { latency: 100, strategy: 'sleep', sleepMs: 300 } }).goalMet).toBe(false);
    expect(ev('waiting', 'auto', { timing: { latency: 800, strategy: 'auto', sleepMs: 0 } }).goalMet).toBe(true);
  });

  it('fixtures: written order is green, reversed fails three', () => {
    const g = ev('fixtures', 'green');
    const r = ev('fixtures', 'order');
    expect(g.kind === 'suite' && g.result.metrics.failing).toBe(0);
    expect(r.kind === 'suite' && r.result.metrics.falseFailures).toBe(3);
  });

  it('fixtures: reset fixes serial; only fresh data fixes parallel', () => {
    const s = (data: 'shared' | 'reset' | 'fresh') => ({ suites: { web: { data } } });
    expect(ev('fixtures', 'reset', s('shared')).goalMet).toBe(false);
    expect(ev('fixtures', 'reset', s('reset')).goalMet).toBe(true);
    expect(ev('fixtures', 'parallel', s('shared')).goalMet).toBe(false);
    expect(ev('fixtures', 'parallel', s('reset')).goalMet).toBe(false);
    expect(ev('fixtures', 'parallel', s('fresh')).goalMet).toBe(true);
  });

  it('traces: the culprit is the refresh frame', () => {
    expect(ev('traces', 'scrub', { traceFrame: 'send' }).goalMet).toBe(false);
    expect(ev('traces', 'scrub', { traceFrame: 'refresh' }).goalMet).toBe(true);
  });
});

describe('Module 5 · Framework', () => {
  const ev = (lessonId: string, stepId: string, o: Partial<Learner> = {}) => {
    const lesson = lessons[lessonId]!;
    return evaluateStep(stepOf(lesson, stepId), learner(o), lesson);
  };
  const places = (e: ReturnType<typeof ev>) => (e.kind === 'page' && e.mode === 'locators' ? e.structure?.places : undefined);

  it('structure: 36 edits, 3 with a page object, 0 with good locators', () => {
    expect(places(ev('structure', 'copies'))).toBe(0);
    expect(places(ev('structure', 'redesign'))).toBe(36);
    expect(ev('structure', 'page-object').goalMet).toBe(false);
    expect(ev('structure', 'page-object', { pageObject: true }).goalMet).toBe(true);
    expect(ev('structure', 'both').goalMet).toBe(false);
    expect(ev('structure', 'both', { locators: { recipient: 'label', amount: 'label', send: 'role' } }).goalMet).toBe(true);
  });

  it('test data: seed setup takes 26 s and misses the ₦0 bug', () => {
    const e = ev('test-data', 'seed');
    expect(e.kind === 'suite' && e.result.metrics).toMatchObject({ seconds: 26, failing: 0, realBugCaught: false });
  });

  it('test data: only fresh data with workers meets the goal', () => {
    const s = (data: 'shared' | 'reset' | 'fresh', workers: number) => ({ suites: { api: { data, workers } } });
    expect(ev('test-data', 'factory', s('fresh', 1)).goalMet).toBe(false);
    expect(ev('test-data', 'factory', s('reset', 4)).goalMet).toBe(false);
    expect(ev('test-data', 'factory', s('shared', 4)).goalMet).toBe(false);
    expect(ev('test-data', 'factory', s('fresh', 4)).goalMet).toBe(true);
  });

  it('flaky: shared + sleeps is flaky; retries hide; fixing causes meets the goal', () => {
    const a = ev('flaky', 'ten-nights');
    expect(a.kind === 'suite' && a.result.metrics.flaky).toBeGreaterThan(0);
    const b = ev('flaky', 'retries');
    expect(b.kind === 'suite' && b.result.metrics.hiddenFlaky).toBeGreaterThan(0);
    const f = (data: 'shared' | 'fresh', waits: 'sleep' | 'auto', retries: number) => ev('flaky', 'fix', { suites: { nightly: { data, waits, retries } } }).goalMet;
    expect(f('shared', 'sleep', 2)).toBe(false);
    expect(f('fresh', 'sleep', 2)).toBe(false);
    expect(f('shared', 'auto', 0)).toBe(false);
    expect(f('fresh', 'auto', 0)).toBe(true);
    expect(f('fresh', 'auto', 2)).toBe(true);
  });
});

describe('Module 6 · CI/CD', () => {
  const ev = (lessonId: string, stepId: string, o: Partial<Learner> = {}) => {
    const lesson = lessons[lessonId]!;
    return evaluateStep(stepOf(lesson, stepId), learner(o), lesson);
  };
  it('PR checks: the full suite blows the budget; nightly gets everything', () => {
    expect(ev('pr-checks', 'budget', { pipes: { pr: ['lint', 'unit', 'api', 'smoke', 'full'] } }).goalMet).toBe(false);
    expect(ev('pr-checks', 'budget', { pipes: { pr: ['lint', 'unit', 'smoke'] } }).goalMet).toBe(false);
    expect(ev('pr-checks', 'budget', { pipes: { pr: ['unit', 'api', 'smoke'] } }).goalMet).toBe(true);
    expect(ev('pr-checks', 'nightly', { pipes: { twoTier: ['lint', 'unit', 'api', 'smoke'] } }).goalMet).toBe(false);
    expect(ev('pr-checks', 'nightly', { pipes: { twoTier: ['lint', 'unit', 'api', 'smoke', 'nightly'] } }).goalMet).toBe(true);
  });
  it('parallel: 54 s serial; fresh data on 4 workers is under 20 s; shared data is not clean', () => {
    const s = ev('parallel', 'serial');
    expect(s.kind === 'suite' && s.result.metrics.seconds).toBe(54);
    const p = (data: 'shared' | 'reset' | 'fresh', workers: number) => ev('parallel', 'more', { suites: { big: { data, workers } } }).goalMet;
    expect(p('fresh', 1)).toBe(false);
    expect(p('reset', 4)).toBe(false);
    expect(p('shared', 4)).toBe(false);
    expect(p('fresh', 4)).toBe(true);
  });
});

describe('Module 7 · Branches', () => {
  const ev = (lessonId: string, stepId: string, o: Partial<Learner> = {}) => {
    const lesson = lessons[lessonId]!;
    return evaluateStep(stepOf(lesson, stepId), learner(o), lesson);
  };
  it('k6: 200 users break one server; the limit is 100; two servers are enough', () => {
    const d = ev('k6', 'double');
    expect(d.kind === 'load' && d.current).toMatchObject({ p95: 1080, passed: false, errorPct: 0 });
    expect(ev('k6', 'limit', { load: { users: 200, servers: 1, marked: 200 } }).goalMet).toBe(false);
    expect(ev('k6', 'limit', { load: { users: 100, servers: 1, marked: 100 } }).goalMet).toBe(true);
    expect(ev('k6', 'scale', { load: { users: 10, servers: 1, marked: null } }).goalMet).toBe(false);
    expect(ev('k6', 'scale', { load: { users: 10, servers: 4, marked: null } }).goalMet).toBe(false);
    expect(ev('k6', 'scale', { load: { users: 10, servers: 2, marked: null } }).goalMet).toBe(true);
  });
  it('pact: only the contract check is fast enough and catches everything with unit tests', () => {
    expect(ev('pact', 'contract', { pipes: { contracts: ['unit', 'e2e'] } }).goalMet).toBe(false);
    expect(ev('pact', 'contract', { pipes: { contracts: ['contract'] } }).goalMet).toBe(false);
    expect(ev('pact', 'contract', { pipes: { contracts: ['unit', 'contract'] } }).goalMet).toBe(true);
  });
});
