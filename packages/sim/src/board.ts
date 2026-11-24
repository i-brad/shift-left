/**
 * Board simulation: a generic "pick" or "sort" activity.
 * select: the learner picks the items that belong (answer 'yes').
 * classify: the learner puts every item in a zone; each has one right zone.
 */

export type BoardMode = 'select' | 'classify';
export type BoardItem = { id: string; label: string; short: string; answer: string; why?: string };
export type BoardDef = {
  title: string;
  mode: BoardMode;
  /** For classify boards. */
  zones?: { id: string; label: string; tone: 'sky' | 'lavender' | 'pink' | 'sage' | 'butter' | 'rose' | 'cream' }[];
  items: BoardItem[];
};

/** itemId → zone id ('yes' when picked on a select board). Missing = not picked / not placed. */
export type BoardPicks = Record<string, string>;

export type BoardItemResult = { id: string; picked: string | undefined; answer: string; status: 'right' | 'wrong' | 'missed' | 'ignored' };

export function runBoard(def: BoardDef, picks: BoardPicks) {
  const results: BoardItemResult[] = def.items.map((it) => {
    const picked = picks[it.id];
    if (def.mode === 'select') {
      const target = it.answer === 'yes';
      const on = picked === 'yes';
      const status = on && target ? 'right' : on && !target ? 'wrong' : !on && target ? 'missed' : 'ignored';
      return { id: it.id, picked, answer: it.answer, status };
    }
    const status = picked === undefined ? 'missed' : picked === it.answer ? 'right' : 'wrong';
    return { id: it.id, picked, answer: it.answer, status };
  });
  const targets = def.mode === 'select' ? def.items.filter((i) => i.answer === 'yes').length : def.items.length;
  const right = results.filter((r) => r.status === 'right').length;
  const wrong = results.filter((r) => r.status === 'wrong').length;
  const missed = results.filter((r) => r.status === 'missed').length;
  return {
    results,
    metrics: { targets, right, wrong, missed, complete: missed === 0 && wrong === 0, score: Math.round((right / Math.max(1, targets)) * 100) },
  };
}
export type BoardRun = ReturnType<typeof runBoard>;
