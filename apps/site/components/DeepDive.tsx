'use client';

import { BlockRow, Pyramid, IsoScene, IsoBox, IsoText, Label } from '@shift-left/iso';
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

const diagrams: Record<DiagramKey, () => React.ReactNode> = {
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
