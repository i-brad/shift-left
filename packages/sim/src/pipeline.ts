/**
 * Pipeline simulation: defects travel down a line of stages; an enabled stage that can detect a defect catches it.
 * Used for: why we test (cost of late detection), test levels, confirmation vs regression, CI.
 */

export type Stage = { id: string; label: string; /** cost to fix a defect caught here, ₦ */ cost: number; /** time this check adds to a run, s */ seconds: number };
export type Defect = { id: string; label: string; /** first stage where it exists */ origin: string; /** stages able to detect it */ caughtBy: string[] };
export type PipelineDef = { title: string; stages: Stage[]; defects: Defect[]; /** the stage nothing can be switched off at: where customers find what's left */ end: string };

export type DefectResult = { id: string; caughtAt: string; escaped: boolean; cost: number };

export function runPipeline(def: PipelineDef, enabled: readonly string[]) {
  const on = new Set(enabled);
  const order = def.stages.map((s) => s.id);
  const endStage = def.stages.find((s) => s.id === def.end)!;
  const results: DefectResult[] = def.defects.map((d) => {
    const from = order.indexOf(d.origin);
    const catcher = def.stages.find((s, i) => i >= from && s.id !== def.end && on.has(s.id) && d.caughtBy.includes(s.id));
    return catcher ? { id: d.id, caughtAt: catcher.id, escaped: false, cost: catcher.cost } : { id: d.id, caughtAt: def.end, escaped: true, cost: endStage.cost };
  });
  return {
    results,
    metrics: {
      defects: def.defects.length,
      caught: results.filter((r) => !r.escaped).length,
      escaped: results.filter((r) => r.escaped).length,
      cost: results.reduce((n, r) => n + r.cost, 0),
      seconds: def.stages.filter((s) => on.has(s.id) && s.id !== def.end).reduce((n, s) => n + s.seconds, 0),
      checks: def.stages.filter((s) => on.has(s.id) && s.id !== def.end).length,
    },
  };
}
export type PipelineRun = ReturnType<typeof runPipeline>;
