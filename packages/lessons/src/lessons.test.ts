import { describe, expect, it } from 'vitest';
import { course, evaluateStep, glossary, lessonCount, lessons, partitionsBoundaries as L } from './index';

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
    const e = evaluateStep(step('boundaries'), { operator: '<', probe: null });
    const failing = e.run.results.filter((r) => !r.passed).map((r) => String(r.amount));
    expect(failing).toEqual([step('boundaries').predict!.answer]);
  });

  it('the partition prediction is right: three partitions find nothing', () => {
    const e = evaluateStep(step('partitions'), { operator: '<', probe: null });
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
    const e = evaluateStep(step('partitions'), { operator: '<', probe: null });
    expect(e.run.metrics).toMatchObject({ groupsCovered: 3, failing: 0 });
  });

  it('the production goal is met only by reproducing ₦500,000', () => {
    const s = step('production');
    expect(evaluateStep(s, { operator: '<', probe: null }).goalMet).toBe(false);
    expect(evaluateStep(s, { operator: '<', probe: 5000 }).goalMet).toBe(false);
    expect(evaluateStep(s, { operator: '<', probe: 500_000 }).goalMet).toBe(true);
  });

  it('boundary values catch exactly one failure', () => {
    const e = evaluateStep(step('boundaries'), { operator: '<=', probe: null });
    expect(e.run.metrics.failing).toBe(1);
    expect(e.escapedBugs).toBe(1);
  });

  it('the root-cause goal needs the learner to flip the operator', () => {
    const s = step('root-cause');
    expect(evaluateStep(s, { operator: '<', probe: null }).goalMet).toBe(false);
    const fixed = evaluateStep(s, { operator: '<=', probe: null });
    expect(fixed.goalMet).toBe(true);
    expect(fixed.escapedBugs).toBe(0);
  });

  it('every step after the fix is green', () => {
    for (const id of ['automate', 'recap']) {
      expect(evaluateStep(step(id), { operator: '<', probe: null }).run.metrics.failing).toBe(0);
    }
  });
});
