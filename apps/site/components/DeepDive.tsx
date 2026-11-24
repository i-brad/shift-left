'use client';

import { BlockRow, IsoBox, IsoScene, IsoText, Label, Pipe, Pyramid } from '@shift-left/iso';
import type { DeepBlock, DiagramKey } from '@shift-left/lessons';
import { forwardRef } from 'react';
import { RichText } from './RichText';

function Triage() {
  const suspects = [
    { t: 'Product', s: 'the code', tone: 'sky' as const, x: 0, y: 0, guilty: true },
    { t: 'Test', s: 'the check', tone: 'lavender' as const, x: 6, y: 0 },
    { t: 'Environment', s: 'config, versions', tone: 'butter' as const, x: 0, y: 6 },
    { t: 'Data', s: 'accounts, balances', tone: 'pink' as const, x: 6, y: 6 },
  ];
  return (
    <IsoScene bounds={[[0, 0, 3.6], [10, 10, 0], [10, 0, 0], [0, 10, 0]]} pad={[16, 60, 40, 60]} scale={0.7} label="Four suspects: product, test, environment, data">
      {suspects.map((s) => (
        <g key={s.t}>
          <IsoBox x={s.x} y={s.y} w={4} d={4} h={s.guilty ? 2.6 : 1.2} tone={s.tone} />
          {s.guilty && <Label at={[s.x + 2, s.y + 2, 2.6]} lift={6} tone="bad" text="guilty" />}
          <IsoText at={[s.x + 4, s.y + 4, 0]} dy={17} size={12}>{s.t}</IsoText>
          <IsoText at={[s.x + 4, s.y + 4, 0]} dy={31} size={10.5} weight={500} muted>{s.s}</IsoText>
        </g>
      ))}
    </IsoScene>
  );
}

function ComboCube() {
  const S = 2, G = 0.3;
  const cells = [0, 1].flatMap((t) => [0, 1].flatMap((b) => [0, 1].map((e) => ({ t, b, e }))))
    .sort((a, c) => a.t + a.b - (c.t + c.b) || a.e - c.e);
  return (
    <IsoScene bounds={[[0, 0, 2 * S + 3], [2 * S + G, 2 * S + G, 0], [2 * S + G, 0, 0], [0, 2 * S + G, 0]]} pad={[16, 120, 40, 120]} scale={0.8} label="Eight combinations as a 2 by 2 by 2 cube; the Plus and express slice is red">
      {cells.map((c) => (
        <IsoBox key={`${c.t}${c.b}${c.e}`} x={c.t * (S + G)} y={c.b * (S + G)} z={c.e * (S + G)} w={S} d={S} h={S} tone={c.t === 1 && c.e === 1 ? 'rose' : 'sage'} />
      ))}
      <Label at={[S + G + S / 2, S / 2, 2 * S + G]} lift={6} tone="bad" text="Plus + express" />
      <IsoText at={[S, 2 * S + G, 0]} dy={18} size={11} weight={600} muted>Basic → Plus</IsoText>
      <IsoText at={[0, S, 0]} dx={-8} dy={4} size={11} weight={600} muted anchor="end">amount ≤ / &gt; ₦5k</IsoText>
    </IsoScene>
  );
}

function StateMap() {
  const tiles = [
    { name: 'Active', x: 0, y: 0, tone: 'sky' as const },
    { name: 'Frozen', x: 7, y: 0, tone: 'lavender' as const },
    { name: 'Blocked', x: 3.5, y: 6, tone: 'pink' as const },
  ];
  return (
    <IsoScene bounds={[[0, 0, 2], [10, 0, 0], [0, 3, 0], [6.5, 9, 0]]} pad={[30, 80, 40, 80]} scale={0.8} label="Card states: active and frozen move both ways; both can be blocked; blocked has no way out">
      {tiles.map((t) => (
        <g key={t.name}>
          <IsoBox x={t.x} y={t.y} w={3} d={3} h={0.5} tone={t.tone} />
          <IsoText at={[t.x + 3, t.y + 3, 0]} dy={18} size={12}>{t.name}</IsoText>
        </g>
      ))}
      <Pipe from={[3.1, 1, 0.8]} to={[6.9, 1, 0.8]} dots={0} />
      <Pipe from={[6.9, 2.2, 0.8]} to={[3.1, 2.2, 0.8]} dots={0} />
      <Pipe from={[2, 3.1, 0.8]} to={[4.2, 5.9, 0.8]} dots={0} />
      <Pipe from={[8, 3.1, 0.8]} to={[6, 5.9, 0.8]} dots={0} />
      <Label at={[5, 1, 0.8]} lift={2} text="freeze" />
      <Label at={[5, 2.2, 0.8]} lift={-24} text="unfreeze" />
      <Label at={[5, 7.5, 0.5]} lift={8} tone="bad" text="no way out" />
    </IsoScene>
  );
}

const diagrams: Record<DiagramKey, () => React.ReactNode> = {
  'combo-cube': ComboCube,
  collapse: () => (
    <BlockRow label="Two cells merge into one rule" gap={4.4} items={[
      { title: 'Basic · ≤₦5k · express', sub: '₦100', tone: 'rose', height: 1.4 },
      { title: 'Basic · >₦5k · express', sub: '₦100', tone: 'rose', height: 1.4 },
      { title: 'R5: Basic · express', sub: 'amount doesn\'t matter', tone: 'lavender', height: 2.2, chip: '1 test', chipTone: 'you' },
    ]} />
  ),
  'state-map': StateMap,
  'transition-coverage': () => (
    <BlockRow label="Coverage levels for the card: 3 states, 4 valid transitions, 9 state-action pairs" gap={4.4} items={[
      { title: 'All states', sub: '3 tests', tone: 'sky', height: 1.2 },
      { title: 'Valid transitions', sub: '4 tests', tone: 'lavender', height: 1.8 },
      { title: 'All transitions', sub: '9 tests', tone: 'sage', height: 3.2, chip: 'finds the bug', chipTone: 'good' },
    ]} />
  ),
  oracle: () => (
    <BlockRow label="Spec, app and verdict" gap={4.6} items={[
      { title: 'Spec', sub: 'the oracle', tone: 'butter', height: 1.6, chip: '₦100–₦500,000', chipTone: 'hint' },
      { title: 'Kudi', sub: 'the app', tone: 'sky', height: 2.2, chip: 'accepts ₦5,000' },
      { title: 'Verdict', sub: 'compare', tone: 'sage', height: 1, chip: 'PASS', chipTone: 'good' },
    ]} />
  ),
  'random-cost': () => (
    <BlockRow label="Random tests versus one designed test" gap={4.6} items={[
      { title: '50 random', sub: '0.01% chance', tone: 'sage', height: 3.2 },
      { title: '346,000 random', sub: '50% chance', tone: 'sage', height: 4.6 },
      { title: '1 at the edge', sub: '100%', tone: 'lavender', height: 0.6, chip: 'certain', chipTone: 'you' },
    ]} />
  ),
  partitions: () => (
    <BlockRow label="Three partitions with one probe each" items={[
      { title: '< ₦100', sub: 'invalid', tone: 'pink', height: 1.2, chip: '₦50' },
      { title: '₦100–₦500k', sub: 'valid', tone: 'sky', height: 2.4, chip: '₦5,000' },
      { title: '> ₦500k', sub: 'invalid', tone: 'pink', height: 1.2, chip: '₦900,000' },
    ]} />
  ),
  'three-value': () => (
    <BlockRow label="Three-value boundary analysis at the maximum" gap={3.6} items={[
      { title: '₦499,999', sub: 'inside', tone: 'sky', height: 1.8, chip: 'accept ✓', chipTone: 'good' },
      { title: '₦500,000', sub: 'on the edge', tone: 'rose', height: 2.4, chip: 'reject ✕', chipTone: 'bad' },
      { title: '₦500,001', sub: 'outside', tone: 'pink', height: 1.8, chip: 'reject ✓', chipTone: 'good' },
    ]} />
  ),
  triage: Triage,
  pyramid: () => (
    <Pyramid label="Test pyramid" layers={[
      { title: 'Unit · validateAmount(), 7 cases', tone: 'sage' },
      { title: 'API · POST /api/transfers, 7 cases', tone: 'sky' },
      { title: 'UI · 1 test: the message shows', tone: 'lavender' },
    ]} />
  ),
  recap: () => (
    <BlockRow label="Partitions, boundaries, automated" items={[
      { title: 'Partitions', sub: '3 tests', tone: 'sky', height: 1.4, chip: '✓', chipTone: 'good' },
      { title: 'Boundaries', sub: '+4 tests', tone: 'lavender', height: 2, chip: '✓', chipTone: 'good' },
      { title: 'Automated', sub: '1 file', tone: 'sage', height: 2.6, chip: '✓', chipTone: 'good' },
    ]} />
  ),
};

export const DeepDive = forwardRef<HTMLDetailsElement, { title: string; blocks: DeepBlock[]; open: boolean; onToggle: (open: boolean) => void }>(
  function DeepDive({ title, blocks, open, onToggle }, ref) {
    return (
      <details ref={ref} className="deep" open={open} onToggle={(e) => onToggle((e.target as HTMLDetailsElement).open)}>
        <summary>
          <b>{title}</b>
          <span>Go deeper ↓</span>
        </summary>
        <div className="dbody">
          {blocks.map((b, i) => {
            switch (b.type) {
              case 'h':
                return <h3 key={i}>{b.text}</h3>;
              case 'p':
                return <p key={i}><RichText text={b.text} /></p>;
              case 'code':
                return (
                  <div key={i}>
                    <pre>{b.code}</pre>
                    {b.note && <p className="note">{b.note}</p>}
                  </div>
                );
              case 'table':
                return (
                  <div key={i} className="tw">
                    <table>
                      <thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>{b.rows.map((r) => <tr key={r.join('|')}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                );
              case 'diagram':
                return (
                  <figure key={i} className="dfig">
                    <div className="dfig-svg">{diagrams[b.key]()}</div>
                    <figcaption>{b.caption}</figcaption>
                  </figure>
                );
            }
          })}
        </div>
      </details>
    );
  },
);
