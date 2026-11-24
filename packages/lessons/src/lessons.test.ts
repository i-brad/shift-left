import { describe, expect, it } from 'vitest';
import { course, evaluateStep, lessonCount, lessons, partitionsBoundaries as L } from './index';

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

describe('Partitions and boundaries', () => {
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
