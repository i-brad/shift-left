'use client';

import { feeAmountFor, attemptCard, type Learner, type SceneState, type StepEval } from '@shift-left/lessons';
import { Button, Chip, Toggle, type Tone } from '@shift-left/ui';
import { useState, type FormEvent } from 'react';
import { BoundaryScene } from './BoundaryScene';
import { CardScene } from './CardScene';
import { FeeScene } from './FeeScene';

const naira = (v: number) => `${v < 0 ? '-' : ''}₦${Math.abs(v).toLocaleString('en-NG')}`;

export type MetricSpec = { label: string; value: string | number; tone: Tone };
export type LegendItem = { label: string; color: string; round?: boolean };

/** Picks the 3D view for the step's scene kind. */
export function SceneView({ ev, scene, reducedMotion, hideResults }: { ev: StepEval; scene: SceneState; reducedMotion: boolean; hideResults: boolean }) {
  if (ev.kind === 'boundaries' && scene.kind === 'boundaries') return <BoundaryScene evalState={ev} scene={scene} reducedMotion={reducedMotion} hideResults={hideResults} />;
  if (ev.kind === 'fees' && scene.kind === 'fees') return <FeeScene evalState={ev} scene={scene} reducedMotion={reducedMotion} hideResults={hideResults} />;
  if (ev.kind === 'card' && scene.kind === 'card') return <CardScene evalState={ev} scene={scene} reducedMotion={reducedMotion} hideResults={hideResults} />;
  return null;
}

export function metricsFor(ev: StepEval, predicted: boolean): MetricSpec[] {
  const failTone = (n: number): Tone => (n > 0 && predicted ? 'bad' : 'neutral');
  const escaped = { label: 'Escaped bugs', value: ev.escapedBugs, tone: (ev.escapedBugs > 0 ? 'bad' : 'neutral') as Tone };
  switch (ev.kind) {
    case 'boundaries': {
      const m = ev.run.metrics;
      return [
        { label: 'Tests', value: m.tests, tone: failTone(m.failing) },
        { label: 'Suite time', value: `${m.suiteSeconds} s`, tone: 'neutral' },
        { label: 'Groups covered', value: `${m.groupsCovered} / 3`, tone: m.groupsCovered === 3 ? 'good' : 'neutral' },
        { label: 'Edges covered', value: `${m.edgesCovered} / 4`, tone: m.edgesCovered === 4 ? 'good' : 'neutral' },
        escaped,
      ];
    }
    case 'fees': {
      const m = ev.run.metrics;
      return [
        { label: 'Tests', value: m.tests, tone: failTone(m.failing) },
        { label: 'Combinations', value: `${m.combosCovered} / 8`, tone: m.combosCovered === 8 ? 'good' : 'neutral' },
        { label: 'Rules covered', value: `${m.rulesCovered} / 5`, tone: m.rulesCovered === 5 ? 'good' : 'neutral' },
        { label: 'Failing', value: predicted ? m.failing : '?', tone: failTone(m.failing) },
        escaped,
      ];
    }
    case 'card': {
      const m = ev.run.metrics;
      return [
        { label: 'Tests', value: m.tests, tone: failTone(m.failing) },
        { label: 'Allowed moves', value: `${m.validCovered} / 4`, tone: m.validCovered === 4 ? 'good' : 'neutral' },
        { label: 'Refusals', value: `${m.invalidCovered} / 5`, tone: m.invalidCovered === 5 ? 'good' : 'neutral' },
        { label: 'Failing', value: predicted ? m.failing : '?', tone: failTone(m.failing) },
        escaped,
      ];
    }
  }
}

export function legendFor(kind: StepEval['kind']): LegendItem[] {
  const base = [
    { label: 'test passed', color: 'var(--sl-sage)' },
    { label: 'test failed', color: 'var(--sl-rose)' },
    { label: 'yours', color: 'var(--sl-lavender)' },
  ];
  if (kind === 'boundaries')
    return [...base, { label: 'should be rejected', color: 'var(--sl-pink)' }, { label: 'should be accepted', color: 'var(--sl-sky)' }, { label: 'request', color: 'var(--sl-request)', round: true }];
  if (kind === 'fees') return [...base, { label: 'not tested yet', color: '#fffaf1' }, { label: 'fee charged', color: 'var(--sl-butter)' }];
  return [...base, { label: 'untested', color: '#fffdf8' }, { label: 'your card', color: 'var(--sl-butter)' }];
}

type ControlsProps = { ev: StepEval; scene: SceneState; learner: Learner; setLearner: (f: (l: Learner) => Learner) => void };

/** The scene's controls, docked under it. */
export function SceneControls(props: ControlsProps) {
  switch (props.ev.kind) {
    case 'boundaries':
      return <BoundaryControls {...props} />;
    case 'fees':
      return <FeeControls {...props} />;
    case 'card':
      return <CardControls {...props} />;
  }
}

function BoundaryControls({ ev, scene, learner, setLearner }: ControlsProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  if (ev.kind !== 'boundaries' || scene.kind !== 'boundaries') return null;
  const run = (e: FormEvent) => {
    e.preventDefault();
    const raw = amount.trim().replace(/[₦,\s]/g, '');
    const n = Number(raw);
    if (!raw || !Number.isFinite(n)) return setError('Enter an amount in naira, like 250000.');
    setError(null);
    setLearner((l) => ({ ...l, probe: Math.round(n) }));
  };
  return (
    <>
      <form className="console" onSubmit={run}>
        <label htmlFor="amount">Try an amount</label>
        <div className="amt">
          <span aria-hidden="true">₦</span>
          <input id="amount" inputMode="numeric" autoComplete="off" placeholder="500000" value={amount} onChange={(e) => setAmount(e.target.value)} aria-describedby="probe-result" />
        </div>
        <Button type="submit" variant="primary">Run test</Button>
      </form>
      {scene.operator === 'learner' && (
        <div className="switch">
          <span>Validator: amount</span>
          <Toggle label="Validator comparison at the maximum" options={['<', '<='] as const} value={learner.operator} onChange={(v) => setLearner((l) => ({ ...l, operator: v }))} />
          <span>500,000</span>
        </div>
      )}
      <div id="probe-result" className="result" aria-live="polite">
        {error ??
          (ev.you ? (
            <>
              Spec: <b>{ev.you.expected ? 'accept' : 'reject'}</b> · Kudi: <b>{ev.you.actual ? 'accept' : 'reject'}</b> · <Chip tone={ev.you.passed ? 'good' : 'bad'}>{ev.you.passed ? 'PASS' : 'FAIL'}</Chip>{' '}
              {ev.you.passed ? 'Kudi matches the spec.' : `You found a bug at ${naira(ev.you.amount)}.`}
            </>
          ) : (
            'Run any amount through Kudi. It lands on the ruler as a lavender post.'
          ))}
      </div>
    </>
  );
}

function FeeControls({ ev, scene, learner, setLearner }: ControlsProps) {
  if (ev.kind !== 'fees' || scene.kind !== 'fees') return null;
  const f = learner.fee;
  const set = (patch: Partial<Learner['fee']>) => setLearner((l) => ({ ...l, fee: { ...l.fee, ...patch } }));
  return (
    <>
      <div className="switches" role="group" aria-label="Transfer conditions">
        <Toggle label="Tier" options={['Basic', 'Plus'] as const} value={f.tier === 'plus' ? 'Plus' : 'Basic'} onChange={(v) => set({ tier: v === 'Plus' ? 'plus' : 'basic' })} />
        <Toggle label="Amount" options={['≤ ₦5,000', '> ₦5,000'] as const} value={f.amount > 5000 ? '> ₦5,000' : '≤ ₦5,000'} onChange={(v) => set({ amount: feeAmountFor(v === '> ₦5,000' ? 'high' : 'low') })} />
        <Toggle label="Delivery" options={['Standard', 'Express'] as const} value={f.express ? 'Express' : 'Standard'} onChange={(v) => set({ express: v === 'Express' })} />
      </div>
      {scene.order === 'learner' && (
        <div className="switch">
          <span>Fee engine checks</span>
          <Toggle label="Fee rule order" options={['express first', 'tier first'] as const} value={learner.feeOrder === 'tier-first' ? 'tier first' : 'express first'} onChange={(v) => setLearner((l) => ({ ...l, feeOrder: v === 'tier first' ? 'tier-first' : 'express-first' }))} />
        </div>
      )}
      <div id="probe-result" className="result" aria-live="polite">
        Spec: <b>{naira(ev.you.expected)}</b> · Kudi: <b>{naira(ev.you.actual)}</b> · <Chip tone={ev.you.passed ? 'good' : 'bad'}>{ev.you.passed ? 'PASS' : 'FAIL'}</Chip>{' '}
        {ev.you.passed ? 'Kudi charges what the spec says.' : 'Kudi charges the wrong fee for this combination.'}
      </div>
    </>
  );
}

function CardControls({ ev, scene, learner, setLearner }: ControlsProps) {
  if (ev.kind !== 'card' || scene.kind !== 'card') return null;
  const last = ev.tried.at(-1);
  const press = (action: 'freeze' | 'unfreeze' | 'block') => setLearner((l) => attemptCard(l, action, ev.bug));
  return (
    <>
      <div className="card-buttons" role="group" aria-label="Card actions">
        <span>
          Your card: <b data-testid="card-state">{ev.state}</b>
        </span>
        <Button onClick={() => press('freeze')}>Freeze</Button>
        <Button onClick={() => press('unfreeze')}>Unfreeze</Button>
        <Button onClick={() => press('block')}>Block</Button>
        <Button onClick={() => setLearner((l) => ({ ...l, card: { state: 'active', tried: [] } }))}>Reset card</Button>
      </div>
      {scene.bug === 'learner' && (
        <div className="switch">
          <span>Unfreeze allowed from</span>
          <Toggle label="Unfreeze allowed from" options={['not active', 'frozen only'] as const} value={learner.cardFixed ? 'frozen only' : 'not active'} onChange={(v) => setLearner((l) => ({ ...l, cardFixed: v === 'frozen only' }))} />
        </div>
      )}
      <div id="probe-result" className="result" aria-live="polite">
        {last ? (
          <>
            {last.action} from {last.from}: spec <b>{last.expected ?? 'refuse'}</b> · Kudi <b>{last.actual ?? 'refused'}</b> · <Chip tone={last.passed ? 'good' : 'bad'}>{last.passed ? 'PASS' : 'FAIL'}</Chip>
          </>
        ) : (
          'Press the buttons to move your card. Try moves that should be refused, too.'
        )}
      </div>
    </>
  );
}
