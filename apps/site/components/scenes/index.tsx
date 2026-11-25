'use client';

import { feeAmountFor, attemptCard, type Learner, type SceneState, type StepEval } from '@shift-left/lessons';
import { Button, Chip, Toggle, type Tone } from '@shift-left/ui';
import { useState, type FormEvent } from 'react';
import { BoundaryScene } from './BoundaryScene';
import { CardScene } from './CardScene';
import { FeeScene } from './FeeScene';
import { BoardScene } from './BoardScene';
import { CoverageScene } from './CoverageScene';
import { PipelineScene } from './PipelineScene';
import { RequestScene, statusLine, statusTone } from './RequestScene';
import { LOAD_STEPS, ASSERTIONS, BODIES, DATA_STRATEGIES, LOCATOR_KINDS, PAGE_CHANGES, PAGE_ELEMENTS, PATHS, WAIT_STRATEGIES, type ApiRequest, type Assertion, type LocatorKind, type SuiteOptions, type WaitStrategy } from '@shift-left/sim';
import { PageScene } from './PageScene';
import { LoadScene } from './LoadScene';
import { SuiteScene } from './SuiteScene';
import { TimingScene } from './TimingScene';

const naira = (v: number) => `${v < 0 ? '-' : ''}₦${Math.abs(v).toLocaleString('en-NG')}`;

export type MetricSpec = { label: string; value: string | number; tone: Tone };
export type LegendItem = { label: string; color: string; round?: boolean };

/** Picks the 3D view for the step's scene kind. */
export function SceneView({ ev, scene, reducedMotion, hideResults }: { ev: StepEval; scene: SceneState; reducedMotion: boolean; hideResults: boolean }) {
  if (ev.kind === 'boundaries' && scene.kind === 'boundaries') return <BoundaryScene evalState={ev} scene={scene} reducedMotion={reducedMotion} hideResults={hideResults} />;
  if (ev.kind === 'fees' && scene.kind === 'fees') return <FeeScene evalState={ev} scene={scene} reducedMotion={reducedMotion} hideResults={hideResults} />;
  if (ev.kind === 'card' && scene.kind === 'card') return <CardScene evalState={ev} scene={scene} reducedMotion={reducedMotion} hideResults={hideResults} />;
  if (ev.kind === 'pipeline') return <PipelineScene evalState={ev} reducedMotion={reducedMotion} />;
  if (ev.kind === 'request' && scene.kind === 'request') return <RequestScene evalState={ev} rooms={!!scene.rooms} reducedMotion={reducedMotion} hideResults={hideResults} />;
  if (ev.kind === 'load') return <LoadScene evalState={ev} reducedMotion={reducedMotion} hideResults={hideResults} />;
  if (ev.kind === 'page') return <PageScene evalState={ev} reducedMotion={reducedMotion} />;
  if (ev.kind === 'timing') return <TimingScene evalState={ev} reducedMotion={reducedMotion} hideResults={hideResults} />;
  if (ev.kind === 'suite') return <SuiteScene evalState={ev} reducedMotion={reducedMotion} hideResults={hideResults} />;
  if (ev.kind === 'board') return <BoardScene evalState={ev} reducedMotion={reducedMotion} />;
  if (ev.kind === 'coverage' && scene.kind === 'coverage') return <CoverageScene evalState={ev} scene={scene} reducedMotion={reducedMotion} />;
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
    case 'board': {
      const m = ev.run.metrics;
      return [
        { label: 'Right', value: ev.checked ? `${m.right} / ${m.targets}` : '?', tone: ev.checked && m.complete ? 'good' : 'neutral' },
        { label: 'Wrong', value: ev.checked ? m.wrong : '?', tone: ev.checked && m.wrong > 0 ? 'bad' : 'neutral' },
        { label: 'Missed', value: ev.checked ? m.missed : '?', tone: ev.checked && m.missed > 0 ? 'bad' : 'neutral' },
        { label: 'Score', value: ev.checked ? `${m.score}%` : '?', tone: ev.checked && m.complete ? 'good' : 'neutral' },
      ];
    }
    case 'pipeline': {
      const m = ev.run.metrics;
      return [
        { label: 'Caught', value: `${m.caught} / ${m.defects}`, tone: m.escaped === 0 ? 'good' : 'neutral' },
        { label: 'Reached customers', value: m.escaped, tone: m.escaped > 0 ? 'bad' : 'good' },
        { label: 'Cost to fix', value: naira(m.cost), tone: 'neutral' },
        { label: 'Run time', value: `${m.seconds} s`, tone: 'neutral' },
      ];
    }
    case 'request': {
      const seen = [...new Set(ev.history.map((h) => h.actual.status))].sort();
      const off = ev.history.filter((h) => !h.matches).length;
      const shown = predicted && ev.history.length > 0 && JSON.stringify(ev.history.at(-1)!.req) === JSON.stringify(ev.req);
      return [
        { label: 'Status', value: shown ? ev.current.actual.status : '?', tone: shown && statusTone(ev.current.actual.status) === 'bad' ? 'bad' : 'neutral' },
        { label: 'Matches spec', value: shown ? (ev.current.matches ? 'yes' : 'no') : '?', tone: shown ? (ev.current.matches ? 'good' : 'bad') : 'neutral' },
        { label: 'Requests sent', value: ev.history.length, tone: 'neutral' },
        { label: 'Codes seen', value: seen.length ? seen.join(' ') : '—', tone: 'neutral' },
        { label: 'Off-spec answers', value: predicted ? off : '?', tone: predicted && off > 0 ? 'bad' : 'neutral' },
      ];
    }
    case 'load': {
      const c = ev.current;
      return [
        { label: 'Users', value: ev.users, tone: 'neutral' },
        { label: 'Servers', value: ev.servers, tone: 'neutral' },
        { label: 'p95', value: predicted ? `${c.p95} ms` : '?', tone: predicted ? (c.p95 <= ev.thresholdMs ? 'good' : 'bad') : 'neutral' },
        { label: 'Errors', value: predicted ? `${c.errorPct}%` : '?', tone: predicted && c.errorPct ? 'bad' : 'neutral' },
        { label: 'Threshold', value: predicted ? (c.passed ? 'met' : 'missed') : '?', tone: predicted ? (c.passed ? 'good' : 'bad') : 'neutral' },
      ];
    }
    case 'page': {
      if (ev.mode === 'trace') {
        const i = ev.frames.findIndex((f) => f.id === ev.frame);
        return [
          { label: 'Frames', value: ev.frames.length, tone: 'neutral' },
          { label: 'Selected', value: i >= 0 ? i + 1 : '—', tone: 'neutral' },
          { label: 'Failed at', value: ev.frames.findIndex((f) => f.failed) + 1, tone: 'bad' },
        ];
      }
      const m = ev.run.metrics;
      return [
        { label: 'Found', value: `${m.holding} / ${m.elements}`, tone: m.holding === m.elements ? 'good' : 'neutral' },
        { label: 'Snapped', value: m.broken, tone: m.broken > 0 ? 'bad' : 'neutral' },
        { label: 'Changes', value: ev.changes.length ? ev.changes.join(' + ') : 'none', tone: 'neutral' },
        ...(ev.structure ? [{ label: 'Places to fix', value: ev.structure.places, tone: (ev.structure.places > 3 ? 'bad' : 'neutral') as Tone }] : []),
      ];
    }
    case 'timing': {
      const m = ev.result.metrics;
      return [
        { label: 'Runs passed', value: predicted ? `${m.passed} / ${m.runs}` : '?', tone: predicted ? (m.passed === m.runs ? 'good' : 'bad') : 'neutral' },
        { label: 'Flaky', value: predicted ? (m.flaky ? 'yes' : 'no') : '?', tone: predicted && m.flaky ? 'bad' : 'neutral' },
        { label: 'Time waited', value: `${m.waitedSeconds} s`, tone: 'neutral' },
        { label: 'Time wasted', value: `${m.wastedSeconds} s`, tone: m.wastedSeconds > 5 ? 'bad' : 'neutral' },
      ];
    }
    case 'suite': {
      const m = ev.result.metrics;
      const multi = ev.options.runs > 1;
      return [
        { label: 'Failing', value: predicted ? `${m.failing} / ${m.tests}` : '?', tone: predicted && m.failing ? 'bad' : 'neutral' },
        { label: 'False failures', value: predicted ? m.falseFailures : '?', tone: predicted ? (m.falseFailures ? 'bad' : 'good') : 'neutral' },
        ...(multi ? [{ label: 'Flaky', value: predicted ? m.flaky : '?', tone: (predicted && m.flaky ? 'bad' : 'neutral') as Tone }, { label: 'Hidden by retries', value: predicted ? m.hiddenFlaky : '?', tone: (predicted && m.hiddenFlaky ? 'bad' : 'neutral') as Tone }] : []),
        { label: 'Suite time', value: `${m.seconds} s`, tone: 'neutral' },
        escaped,
      ];
    }
    case 'coverage': {
      const m = ev.run.metrics;
      return [
        { label: 'Tests', value: m.tests, tone: failTone(m.failing) },
        { label: 'Statements', value: `${m.statements} / 6`, tone: m.statementPct === 100 ? 'good' : 'neutral' },
        { label: 'Branches', value: `${m.branchesCovered} / 4`, tone: m.branchPct === 100 ? 'good' : 'neutral' },
        { label: 'Failing', value: m.failing, tone: failTone(m.failing) },
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
  if (kind === 'pipeline') return [{ label: 'check on', color: 'var(--sl-sky)' }, { label: 'check off', color: '#fffaf1' }, { label: 'defect caught', color: 'var(--sl-sage)' }, { label: 'reached customers', color: 'var(--sl-rose)' }];
  if (kind === 'load') return [{ label: 'meets threshold', color: 'var(--sl-sky)' }, { label: 'misses threshold', color: 'var(--sl-pink)' }, { label: 'threshold', color: 'var(--sl-lavender)' }];
  if (kind === 'page') return [{ label: 'found', color: 'var(--sl-sage)' }, { label: 'locator snapped', color: 'var(--sl-rose)' }, { label: 'no locator yet', color: '#fffaf1' }];
  if (kind === 'timing') return [{ label: 'Kudi responding', color: 'var(--sl-sky)' }, { label: 'test looked: pass', color: 'var(--sl-sage)' }, { label: 'test looked: fail', color: 'var(--sl-rose)' }];
  if (kind === 'suite') return [{ label: 'checks data', color: 'var(--sl-sage)' }, { label: 'changes data', color: 'var(--sl-lavender)' }, { label: 'failed', color: 'var(--sl-rose)' }, { label: 'passed on retry', color: 'var(--sl-butter)' }];
  if (kind === 'request') return [{ label: 'your request', color: 'var(--sl-lavender)' }, { label: '2xx success', color: 'var(--sl-sage)' }, { label: '4xx refused', color: 'var(--sl-butter)' }, { label: '5xx / off-spec', color: 'var(--sl-rose)' }];
  if (kind === 'board') return [{ label: 'picked', color: 'var(--sl-lavender)' }, { label: 'right', color: 'var(--sl-sage)' }, { label: 'wrong', color: 'var(--sl-rose)' }, { label: 'missed', color: 'var(--sl-pink)' }];
  if (kind === 'coverage') return [{ label: 'line ran', color: 'var(--sl-sage)' }, { label: 'decision ran', color: 'var(--sl-butter)' }, { label: 'never ran', color: '#fffaf1' }, { label: 'wrong result', color: 'var(--sl-rose)' }];
  if (kind === 'fees') return [...base, { label: 'not tested yet', color: '#fffaf1' }, { label: 'fee charged', color: 'var(--sl-butter)' }];
  return [...base, { label: 'untested', color: '#fffdf8' }, { label: 'your card', color: 'var(--sl-butter)' }];
}

type ControlsProps = { ev: StepEval; scene: SceneState; learner: Learner; setLearner: (f: (l: Learner) => Learner) => void; hideResults?: boolean };

/** The scene's controls, docked under it. */
export function SceneControls(props: ControlsProps) {
  switch (props.ev.kind) {
    case 'boundaries':
      return <BoundaryControls {...props} />;
    case 'fees':
      return <FeeControls {...props} />;
    case 'card':
      return <CardControls {...props} />;
    case 'board':
      return <BoardControls {...props} />;
    case 'coverage':
      return <CoverageControls {...props} />;
    case 'pipeline':
      return <PipelineControls {...props} />;
    case 'request':
      return <RequestControls {...props} />;
    case 'page':
      return <PageControls {...props} />;
    case 'load':
      return <LoadControls {...props} />;
    case 'timing':
      return <TimingControls {...props} />;
    case 'suite':
      return <SuiteControls {...props} />;
  }
}

function PageControls({ ev, scene, learner, setLearner }: ControlsProps) {
  if (ev.kind !== 'page') return null;
  const choose = scene.kind === 'page' && !!scene.choose;
  if (ev.mode === 'trace') {
    const f = ev.frames.find((x) => x.id === ev.frame);
    return (
      <div className="trace-ctl">
        <div className="switches" role="group" aria-label="Trace frames">
          {ev.frames.map((x, i) => (
            <button key={x.id} type="button" className="opt" aria-pressed={x.id === ev.frame} onClick={() => setLearner((l) => ({ ...l, traceFrame: x.id }))}>
              {i + 1}. {x.action}
            </button>
          ))}
        </div>
        <div id="probe-result" className="req-panes" aria-live="polite">
          {f ? (
            <>
              <div>
                <p className="pane-title">Page after this step</p>
                <pre className="json">{f.page.screen === 'login' ? 'Login screen' : `Balance: ${f.page.balance}${f.page.status ? `\n${f.page.status}` : ''}`}{f.failed ? '\n\n✗ Expected ₦595,000, received ₦600,000' : ''}</pre>
              </div>
              <div>
                <p className="pane-title">Network</p>
                <pre className="json">{f.network.length ? f.network.map((n) => `${n.method} ${n.path} → ${n.status}\n  ${n.body}`).join('\n') : '(no requests)'}</pre>
              </div>
            </>
          ) : (
            <p className="result">Pick a frame to see the page and the network calls at that moment.</p>
          )}
        </div>
      </div>
    );
  }
  const { run, learnerChanges, changes, structure } = ev;
  const res = new Map(run.results.map((r) => [r.id, r]));
  const toggleChange = (c: (typeof PAGE_CHANGES)[number]['id']) =>
    setLearner((l) => ({ ...l, pageChanges: l.pageChanges.includes(c) ? l.pageChanges.filter((x) => x !== c) : [...l.pageChanges, c] }));
  return (
    <div className="loc-ctl">
      {learnerChanges && (
        <div className="switches" role="group" aria-label="Changes">
          {PAGE_CHANGES.map((c) => (
            <button key={c.id} type="button" className="opt" aria-pressed={changes.includes(c.id)} onClick={() => toggleChange(c.id)}>
              {changes.includes(c.id) ? '✓ ' : ''}
              {c.label}
            </button>
          ))}
        </div>
      )}
      {structure?.learnerPO && (
        <div className="switch">
          <span>Locators live in</span>
          <Toggle label="Where locators live" options={['each test', 'a page object'] as const} value={learner.pageObject ? 'a page object' : 'each test'} onChange={(v) => setLearner((l) => ({ ...l, pageObject: v === 'a page object' }))} />
        </div>
      )}
      <ul id="probe-result" className="loc-rows" aria-live="polite">
        {PAGE_ELEMENTS.map((el) => {
          const r = res.get(el.id)!;
          const kinds = LOCATOR_KINDS.filter((k) => el.options[k.id]);
          return (
            <li key={el.id} data-state={!r.code ? 'none' : r.holds ? 'found' : 'lost'}>
              <span className="item-label">{el.label}</span>
              {choose && <Toggle label={`Locator: ${el.label}`} options={kinds.map((k) => k.label)} value={LOCATOR_KINDS.find((k) => k.id === r.kind)?.label ?? ''} onChange={(v) => setLearner((l) => ({ ...l, locators: { ...l.locators, [el.id]: LOCATOR_KINDS.find((k) => k.label === v)!.id as LocatorKind } }))} />}
              {r.code && (
                <span className="loc-code">
                  <code>{`page.${r.code}`}</code> <Chip tone={r.holds ? 'good' : 'bad'}>{r.holds ? 'found' : 'not found'}</Chip>
                  {r.why && <span className="why">{r.why}</span>}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {structure && (
        <p className="result">
          {structure.tests} tests use these locators. After these changes you would edit <b>{structure.places}</b> place{structure.places === 1 ? '' : 's'}.
        </p>
      )}
    </div>
  );
}

function LoadControls({ ev, setLearner, hideResults }: ControlsProps) {
  if (ev.kind !== 'load') return null;
  const set = (patch: Partial<{ users: number; servers: number; marked: number | null }>) => setLearner((l) => ({ ...l, load: { ...l.load, ...patch } }));
  return (
    <div className="timing-ctl">
      <div className="switches" role="group" aria-label="Load">
        {ev.learnerUsers && <Toggle label="Virtual users" options={LOAD_STEPS.map(String)} value={String(ev.users)} onChange={(v) => set({ users: Number(v) })} />}
        {ev.learnerServers && <Toggle label="Servers" options={['1', '2', '4'] as const} value={String(ev.servers) as '1'} onChange={(v) => set({ servers: Number(v) })} />}
        {ev.learnerUsers && (
          <Button variant="primary" onClick={() => set({ marked: ev.users })}>
            Mark {ev.users} users as the limit
          </Button>
        )}
      </div>
      <p id="probe-result" className="result" aria-live="polite">
        {hideResults
          ? 'Make your prediction first.'
          : `${ev.users} users: p95 ${ev.current.p95} ms, ${ev.current.errorPct}% errors. ${ev.current.passed ? 'Meets' : 'Misses'} p95 < ${ev.thresholdMs} ms.`}
        {ev.marked !== null && ev.learnerUsers ? ` You marked ${ev.marked} users as the limit.` : ''}
      </p>
    </div>
  );
}

function TimingControls({ ev, setLearner, hideResults }: ControlsProps) {
  if (ev.kind !== 'timing') return null;
  const set = (patch: Partial<{ latency: number; strategy: WaitStrategy; sleepMs: number }>) => setLearner((l) => ({ ...l, timing: { ...l.timing, ...patch } }));
  const code = WAIT_STRATEGIES.find((w) => w.id === ev.strategy)!.code.replace('SLEEP', String(ev.sleepMs));
  const m = ev.result.metrics;
  return (
    <div className="timing-ctl">
      <div className="switches" role="group" aria-label="Waiting">
        {ev.learnerStrategy && <Toggle label="Strategy" options={WAIT_STRATEGIES.map((w) => w.label)} value={WAIT_STRATEGIES.find((w) => w.id === ev.strategy)!.label} onChange={(v) => set({ strategy: WAIT_STRATEGIES.find((w) => w.label === v)!.id })} />}
        {ev.learnerStrategy && ev.strategy === 'sleep' && <Toggle label="Sleep" options={['0.5 s', '1 s', '2 s', '3 s'] as const} value={`${ev.sleepMs / 1000} s` as '1 s'} onChange={(v) => set({ sleepMs: parseFloat(v) * 1000 })} />}
        {ev.learnerLatency && <Toggle label="Typical latency" options={['200 ms', '800 ms', '1500 ms', '2500 ms'] as const} value={`${ev.latency} ms` as '800 ms'} onChange={(v) => set({ latency: parseInt(v, 10) })} />}
      </div>
      <pre className="json">{code}</pre>
      <p id="probe-result" className="result" aria-live="polite">
        {hideResults ? 'Make your prediction first.' : `${m.passed} of ${m.runs} runs pass${m.flaky ? ' (flaky)' : ''}. Waited ${m.waitedSeconds} s, ${m.wastedSeconds} s of it after Kudi had already answered.`}
      </p>
    </div>
  );
}

const ORDER_LABELS = { written: 'As written', reversed: 'Reversed', shuffled: 'Shuffled' } as const;
const WAITS_LABELS = { sleep: 'Sleeps', auto: 'Auto-wait' } as const;

function SuiteControls({ ev, setLearner, hideResults }: ControlsProps) {
  if (ev.kind !== 'suite') return null;
  const { controls, options, result, suiteId } = ev;
  const set = (patch: Partial<SuiteOptions>) => setLearner((l) => ({ ...l, suites: { ...l.suites, [suiteId]: { ...(l.suites[suiteId] ?? {}), ...patch } } }));
  const has = (k: keyof SuiteOptions) => controls.includes(k);
  const byId = new Map(result.last.outcomes.map((o) => [o.id, o]));
  return (
    <div className="suite-ctl">
      {controls.length > 0 && (
        <div className="switches" role="group" aria-label="Suite settings">
          {has('data') && <Toggle label="Test data" options={DATA_STRATEGIES.map((d) => d.label)} value={DATA_STRATEGIES.find((d) => d.id === options.data)!.label} onChange={(v) => set({ data: DATA_STRATEGIES.find((d) => d.label === v)!.id })} />}
          {has('order') && <Toggle label="Order" options={Object.values(ORDER_LABELS)} value={ORDER_LABELS[options.order]} onChange={(v) => set({ order: (Object.keys(ORDER_LABELS) as (keyof typeof ORDER_LABELS)[]).find((k) => ORDER_LABELS[k] === v)! })} />}
          {has('workers') && <Toggle label="Workers" options={['1', '2', '4'] as const} value={String(options.workers) as '1'} onChange={(v) => set({ workers: Number(v) })} />}
          {has('waits') && <Toggle label="Waits" options={Object.values(WAITS_LABELS)} value={WAITS_LABELS[options.waits]} onChange={(v) => set({ waits: v === 'Sleeps' ? 'sleep' : 'auto' })} />}
          {has('retries') && <Toggle label="Retries" options={['0', '1', '2'] as const} value={String(options.retries) as '0'} onChange={(v) => set({ retries: Number(v) })} />}
        </div>
      )}
      <ul id="probe-result" className="cov-results" aria-live="polite">
        {ev.def.tests.map((t) => {
          const o = byId.get(t.id)!;
          const p = result.perTest.find((x) => x.id === t.id)!;
          return (
            <li key={t.id}>
              {t.label} {t.writes ? <span className="why">(changes data)</span> : null}{' '}
              {hideResults ? (
                <Chip tone="neutral">?</Chip>
              ) : options.runs > 1 ? (
                <Chip tone={p.verdict === 'stable-pass' ? 'good' : p.verdict === 'hidden-flaky' ? 'neutral' : 'bad'}>
                  {p.verdict === 'stable-pass' ? `passed ${options.runs}/${options.runs}` : p.verdict === 'stable-fail' ? `failed ${p.red}/${options.runs}` : p.verdict === 'flaky' ? `flaky: failed ${p.red}/${options.runs}` : `retried ${p.retried}× (hidden)`}
                </Chip>
              ) : (
                <Chip tone={o.status === 'passed' ? 'good' : o.status === 'flaky' ? 'neutral' : 'bad'}>{o.status === 'flaky' ? 'passed on retry' : o.status}</Chip>
              )}
              {!hideResults && o.cause && <span className="why"> {o.cause === 'data' ? 'another test changed its data' : o.cause === 'timing' ? 'slept too short' : 'Kudi is wrong (real bug)'}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const AUTHS = [
  { id: 'none', label: 'Logged out' },
  { id: 'ada', label: 'Ada' },
  { id: 'tunde', label: 'Tunde' },
] as const;
const pretty = (v: unknown) => JSON.stringify(v, null, 2);

function RequestControls({ ev, scene, learner, setLearner, hideResults }: ControlsProps) {
  if (ev.kind !== 'request' || scene.kind !== 'request') return null;
  const { req, current, history } = ev;
  const set = (patch: Partial<ApiRequest>) => setLearner((l) => ({ ...l, req: { ...(l.req ?? req), ...patch } }));
  const send = () => setLearner((l) => ({ ...l, req: l.req ?? req, sent: [...l.sent, l.req ?? req] }));
  const sentThis = !hideResults && history.length > 0 && JSON.stringify(history.at(-1)!.req) === JSON.stringify(req);
  const toggleAssert = (a: Assertion) => setLearner((l) => ({ ...l, assertions: l.assertions.includes(a) ? l.assertions.filter((x) => x !== a) : [...l.assertions, a] }));
  const body = BODIES.find((b) => b.id === req.body)!;
  return (
    <div className="req-ctl">
      <div className="switches" role="group" aria-label="Request">
        <Toggle label="Method" options={['GET', 'POST', 'DELETE'] as const} value={req.method} onChange={(v) => set({ method: v })} />
        <Toggle label="Path" options={PATHS} value={req.path} onChange={(v) => set({ path: v })} />
        <Toggle label="Logged in as" options={AUTHS.map((a) => a.label)} value={AUTHS.find((a) => a.id === req.auth)!.label} onChange={(v) => set({ auth: AUTHS.find((a) => a.label === v)!.id })} />
        {req.method === 'POST' && <Toggle label="Body" options={BODIES.map((b) => b.label)} value={body.label} onChange={(v) => set({ body: BODIES.find((b) => b.label === v)!.id })} />}
        <Button variant="primary" onClick={send}>Send</Button>
      </div>
      <div className="req-panes">
        <div>
          <p className="pane-title">Request</p>
          <pre className="json">{`${req.method} ${req.path}\n${req.auth === 'none' ? '(no session cookie)' : `Cookie: kudi_session=<${req.auth}>`}${req.method === 'POST' ? `\n\n${body.raw || '(empty body)'}` : ''}`}</pre>
        </div>
        <div id="probe-result" aria-live="polite">
          <p className="pane-title">
            Kudi answered {sentThis && <Chip tone={statusTone(current.actual.status) === 'bad' ? 'bad' : statusTone(current.actual.status) === 'good' ? 'good' : 'neutral'}>{statusLine(current.actual.status)}</Chip>}
          </p>
          <pre className="json">{sentThis ? pretty(current.actual.body) : hideResults ? 'Make your prediction first.' : 'Press Send.'}</pre>
        </div>
        <div>
          <p className="pane-title">The spec says {sentThis && <Chip tone="neutral">{statusLine(current.expected.status)}</Chip>}</p>
          <pre className="json">{sentThis ? pretty(current.expected.body) : '…'}</pre>
        </div>
      </div>
      {scene.assertions && (
        <div className="req-asserts" role="group" aria-label="Assertions">
          <span className="pane-title">Your test asserts</span>
          {ASSERTIONS.map((a) => (
            <button key={a.id} type="button" className="opt" aria-pressed={learner.assertions.includes(a.id)} onClick={() => toggleAssert(a.id)}>
              {learner.assertions.includes(a.id) ? '✓ ' : ''}
              {a.label}
            </button>
          ))}
          <span className="result" data-testid="assert-result">
            {learner.assertions.length === 0
              ? 'Pick at least one.'
              : current.matches
                ? 'Response matches the spec: your test passes, correctly.'
                : ev.catching.length > 0
                  ? `Test FAILS on ${ev.catching.join(' + ')}: you caught the bug.`
                  : 'Test passes, but the response is wrong. The bug got past.'}
          </span>
        </div>
      )}
      {history.length > 0 && !hideResults && (
        <ol className="req-history" aria-label="Sent">
          {history.slice(-8).map((h, i) => (
            <li key={i}>
              {h.req.method} {h.req.path} · {AUTHS.find((a) => a.id === h.req.auth)!.label}
              {h.req.method === 'POST' ? ` · ${BODIES.find((b) => b.id === h.req.body)!.label}` : ''} → <b>{h.actual.status}</b>
              {!h.matches && <Chip tone="bad">spec {h.expected.status}</Chip>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function PipelineControls({ ev, setLearner }: ControlsProps) {
  if (ev.kind !== 'pipeline') return null;
  const { def, enabled, learnerControls, run, pipelineId } = ev;
  const on = new Set(enabled);
  const toggle = (id: string) =>
    setLearner((l) => {
      const cur = new Set(l.pipes[pipelineId] ?? enabled);
      if (cur.has(id)) cur.delete(id);
      else cur.add(id);
      return { ...l, pipes: { ...l.pipes, [pipelineId]: [...cur] } };
    });
  const stageLabel = new Map(def.stages.map((s) => [s.id, s.label]));
  return (
    <div className="pipe-ctl">
      <p className="board-title">{def.title}</p>
      {learnerControls && (
        <div className="switches" role="group" aria-label="Checks">
          {def.stages
            .filter((s) => s.id !== def.end)
            .map((s) => (
              <button key={s.id} type="button" className="opt" aria-pressed={on.has(s.id)} onClick={() => toggle(s.id)}>
                {on.has(s.id) ? '✓ ' : ''}
                {s.label}
              </button>
            ))}
        </div>
      )}
      <ul id="probe-result" className="cov-results" aria-live="polite">
        {run.results.map((r) => (
          <li key={r.id}>
            {def.defects.find((d) => d.id === r.id)?.label}: <Chip tone={r.escaped ? 'bad' : 'good'}>{r.escaped ? 'reached customers' : `caught at ${stageLabel.get(r.caughtAt)}`}</Chip>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BoardControls({ ev, learner, setLearner }: ControlsProps) {
  if (ev.kind !== 'board') return null;
  const { def, run, checked, boardId } = ev;
  const picks = learner.board[boardId] ?? {};
  const setPick = (id: string, v: string | undefined) =>
    setLearner((l) => {
      const cur = { ...(l.board[boardId] ?? {}) };
      if (v === undefined) delete cur[id];
      else cur[id] = v;
      return { ...l, board: { ...l.board, [boardId]: cur }, boardChecked: { ...l.boardChecked, [boardId]: false } };
    });
  const status = new Map(run.results.map((r) => [r.id, r]));
  return (
    <div className="board-ctl">
      <p className="board-title">{def.title}</p>
      <ul className="board-items">
        {def.items.map((it) => {
          const r = status.get(it.id)!;
          const mark = checked ? (r.status === 'right' ? 'right' : r.status === 'wrong' ? 'wrong' : r.status === 'missed' ? 'missed' : undefined) : undefined;
          return (
            <li key={it.id} data-result={mark}>
              {def.mode === 'select' ? (
                <button type="button" className="opt" aria-pressed={picks[it.id] === 'yes'} onClick={() => setPick(it.id, picks[it.id] === 'yes' ? undefined : 'yes')}>
                  {it.label}
                </button>
              ) : (
                <>
                  <span className="item-label">{it.label}</span>
                  <Toggle label={`Place: ${it.label}`} options={(def.zones ?? []).map((z) => z.label)} value={(def.zones ?? []).find((z) => z.id === picks[it.id])?.label ?? ''} onChange={(v) => setPick(it.id, def.zones?.find((z) => z.label === v)?.id)} />
                </>
              )}
              {checked && mark && mark !== 'right' && it.why && <span className="why">{it.why}</span>}
            </li>
          );
        })}
      </ul>
      <div className="board-actions">
        <Button variant="primary" onClick={() => setLearner((l) => ({ ...l, boardChecked: { ...l.boardChecked, [boardId]: true } }))}>Check</Button>
        <Button onClick={() => setLearner((l) => ({ ...l, board: { ...l.board, [boardId]: {} }, boardChecked: { ...l.boardChecked, [boardId]: false } }))}>Reset</Button>
        <span id="probe-result" className="result" aria-live="polite">
          {checked ? (run.metrics.complete ? 'All right.' : `${run.metrics.right} right, ${run.metrics.wrong} wrong, ${run.metrics.missed} missed. Adjust and check again.`) : 'Make your choices, then press Check.'}
        </span>
      </div>
    </div>
  );
}

function CoverageControls({ ev, scene, learner, setLearner }: ControlsProps) {
  const [tier, setTier] = useState<'basic' | 'plus'>('basic');
  const [amount, setAmount] = useState(5000);
  if (ev.kind !== 'coverage' || scene.kind !== 'coverage') return null;
  return (
    <div className="cov-ctl">
      {scene.learnerTests && (
        <div className="switches" role="group" aria-label="New test">
          <Toggle label="Test tier" options={['Basic', 'Plus'] as const} value={tier === 'plus' ? 'Plus' : 'Basic'} onChange={(v) => setTier(v === 'Plus' ? 'plus' : 'basic')} />
          <Toggle label="Test amount" options={['₦5,000', '₦200,000'] as const} value={amount === 5000 ? '₦5,000' : '₦200,000'} onChange={(v) => setAmount(v === '₦5,000' ? 5000 : 200_000)} />
          <Button variant="primary" onClick={() => setLearner((l) => ({ ...l, covTests: [...l.covTests, { tier, amount }] }))}>Add test</Button>
          <Button onClick={() => setLearner((l) => ({ ...l, covTests: [] }))}>Clear my tests</Button>
        </div>
      )}
      {scene.fixed === 'learner' && (
        <div className="switch">
          <span>Declaration</span>
          <Toggle label="rate declaration" options={['let rate;', 'let rate = 0;'] as const} value={learner.covFixed ? 'let rate = 0;' : 'let rate;'} onChange={(v) => setLearner((l) => ({ ...l, covFixed: v === 'let rate = 0;' }))} />
        </div>
      )}
      <ul id="probe-result" className="cov-results" aria-live="polite">
        {ev.run.results.map((r, i) => (
          <li key={`${r.id}-${i}`} data-pass={r.passed}>
            {r.tier === 'plus' ? 'Plus' : 'Basic'} · {naira(r.amount)} → {Number.isNaN(r.actual) ? '₦NaN' : naira(r.actual)} (spec {naira(r.expected)}) <Chip tone={r.passed ? 'good' : 'bad'}>{r.passed ? 'PASS' : 'FAIL'}</Chip>
          </li>
        ))}
      </ul>
    </div>
  );
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
