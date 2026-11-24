'use client';

import { evaluateStep, type Lesson } from '@shift-left/lessons';
import type { MaxOperator } from '@shift-left/sim';
import { Button, Callout, Chip, Metric, StepRail, Toggle, type Tone } from '@shift-left/ui';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { BoundaryScene } from './BoundaryScene';
import { DeepDive } from './DeepDive';
import { RichText } from './RichText';

const naira = (v: number) => `${v < 0 ? '-' : ''}₦${Math.abs(v).toLocaleString('en-NG')}`;
const roleLabel = { setup: 'SETUP', problem: 'PROBLEM', fix: 'FIX', recap: 'RECAP' } as const;

type Saved = { met: string[]; furthest: number };
const storageKey = (id: string) => `shift-left:progress:${id}`;
function load(id: string): Saved {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (raw) return JSON.parse(raw) as Saved;
  } catch {
    /* storage unavailable: start fresh */
  }
  return { met: [], furthest: 0 };
}
function save(id: string, s: Saved) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function LessonPlayer({ lesson, moduleTitle }: { lesson: Lesson; moduleTitle: string }) {
  const [cur, setCur] = useState(0);
  const [operator, setOperator] = useState<MaxOperator>('<');
  const [probe, setProbe] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [met, setMet] = useState<Set<string>>(new Set());
  const [deepOpen, setDeepOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const deepRef = useRef<HTMLDetailsElement>(null);

  const step = lesson.steps[cur]!;
  const ev = useMemo(() => evaluateStep(step, { operator, probe }), [step, operator, probe]);

  // Restore progress and the step from the URL hash (#step-3).
  useEffect(() => {
    const saved = load(lesson.id);
    setMet(new Set(saved.met));
    const m = /^#step-(\d+)$/.exec(window.location.hash);
    if (m) {
      // Never jump past a goal that hasn't been met.
      const wanted = Math.min(lesson.steps.length - 1, Math.max(0, Number(m[1]) - 1));
      const firstLocked = lesson.steps.findIndex((s, i) => i > 0 && lesson.steps.slice(0, i).some((p) => p.goal && !saved.met.includes(p.id)));
      setCur(firstLocked === -1 ? wanted : Math.min(wanted, firstLocked - 1));
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
  }, [lesson]);

  // Record a goal the moment it is met.
  useEffect(() => {
    if (step.goal && ev.goalMet && !met.has(step.id)) {
      setMet((prev) => {
        const next = new Set(prev).add(step.id);
        save(lesson.id, { met: [...next], furthest: cur });
        return next;
      });
    }
  }, [ev.goalMet, step, met, lesson.id, cur]);

  /** A step is locked while any earlier goal step is unmet. */
  const isLocked = useCallback(
    (i: number) => lesson.steps.slice(0, i).some((s) => s.goal && !met.has(s.id)),
    [lesson.steps, met],
  );

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= lesson.steps.length || isLocked(i)) return;
      setCur(i);
      setAnimKey((k) => k + 1);
      history.replaceState(null, '', `#step-${i + 1}`);
    },
    [lesson.steps.length, isLocked],
  );

  const canNext = !step.goal || ev.goalMet || met.has(step.id);
  const next = lesson.steps[cur + 1];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, .sl-rail, summary')) return;
      if (e.key === 'ArrowRight' && canNext) go(cur + 1);
      else if (e.key === 'ArrowLeft') go(cur - 1);
      else if (e.key === 'r' || e.key === 'R') go(0);
      else if (e.key === 'd' || e.key === 'D') {
        setDeepOpen(true);
        deepRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cur, canNext, go, reducedMotion]);

  const runProbe = (e: FormEvent) => {
    e.preventDefault();
    const raw = amount.trim().replace(/[₦,\s]/g, '');
    const n = Number(raw);
    if (!raw || !Number.isFinite(n)) {
      setInputError('Enter an amount in naira, like 250000.');
      return;
    }
    setInputError(null);
    setProbe(Math.round(n));
  };

  const m = ev.run.metrics;
  const metrics: { label: string; value: string | number; tone: Tone }[] = [
    { label: 'Tests', value: m.tests, tone: m.failing > 0 ? 'bad' : 'neutral' },
    { label: 'Suite time', value: `${m.suiteSeconds} s`, tone: 'neutral' },
    { label: 'Groups covered', value: `${m.groupsCovered} / 3`, tone: m.groupsCovered === 3 ? 'good' : 'neutral' },
    { label: 'Edges covered', value: `${m.edgesCovered} / 4`, tone: m.edgesCovered === 4 ? 'good' : 'neutral' },
    { label: 'Escaped bugs', value: ev.escapedBugs, tone: ev.escapedBugs > 0 ? 'bad' : 'neutral' },
  ];

  const learnt = lesson.learn.map((l) => ({ ...l, done: cur >= l.afterStep }));

  return (
    <>
      <main className="stage">
        <div className="top">
          <div>
            <div className="crumb">
              {String(lesson.module).padStart(2, '0')}. {moduleTitle} / Lesson {lesson.order}
            </div>
            <h1>{lesson.title}</h1>
            <p className="sub">{lesson.hook}</p>
          </div>
          <div className="chips">
            <Chip tone="hint">{lesson.minutes} min</Chip>
            <Chip tone="good">{lesson.level}</Chip>
            <Chip tone="you">{lesson.steps.length} steps</Chip>
            <Chip tone="system">CTFL {lesson.ctfl.join(' · ')}</Chip>
          </div>
        </div>

        <div className="metrics" aria-live="polite">
          {metrics.map((x) => (
            <Metric key={x.label} {...x} />
          ))}
        </div>

        <section className="scene" aria-label="Interactive scene">
          <div className={`fig ${reducedMotion ? '' : 'anim'}`} key={animKey}>
            <BoundaryScene evalState={ev} scene={step.scene} reducedMotion={reducedMotion} />
          </div>
          <div className="controls">
            <form className="console" onSubmit={runProbe}>
              <label htmlFor="amount">Try an amount</label>
              <div className="amt">
                <span aria-hidden="true">₦</span>
                <input id="amount" inputMode="numeric" autoComplete="off" placeholder="500000" value={amount} onChange={(e) => setAmount(e.target.value)} aria-describedby="probe-result" />
              </div>
              <Button type="submit" variant="primary">Run test</Button>
            </form>
            {step.scene.operator === 'learner' && (
              <div className="switch">
                <span>Validator: amount</span>
                <Toggle label="Validator comparison at the maximum" options={['<', '<='] as const} value={operator} onChange={setOperator} />
                <span>500,000</span>
              </div>
            )}
            <div id="probe-result" className="result" aria-live="polite">
              {inputError ? (
                inputError
              ) : ev.you ? (
                <>
                  Spec: <b>{ev.you.expected ? 'accept' : 'reject'}</b> · Kudi: <b>{ev.you.actual ? 'accept' : 'reject'}</b> ·{' '}
                  <Chip tone={ev.you.passed ? 'good' : 'bad'}>{ev.you.passed ? 'PASS' : 'FAIL'}</Chip>{' '}
                  {ev.you.passed ? 'Kudi matches the spec.' : `You found a bug at ${naira(ev.you.amount)}.`}
                </>
              ) : (
                'Run any amount through Kudi. It lands on the ruler as a lavender post.'
              )}
            </div>
          </div>
          <div className="legend" aria-hidden="true">
            <span><i style={{ background: 'var(--sl-sage)' }} />test passed</span>
            <span><i style={{ background: 'var(--sl-rose)' }} />test failed</span>
            <span><i style={{ background: 'var(--sl-lavender)' }} />your test</span>
            <span><i style={{ background: 'var(--sl-pink)' }} />should be rejected</span>
            <span><i style={{ background: 'var(--sl-sky)' }} />should be accepted</span>
            <span><i style={{ background: 'var(--sl-request)', borderRadius: '50%' }} />request</span>
          </div>
        </section>

        <div className="rail">
          <div className="rail-hd">
            <b>In this lesson</b>
            <span>Step {cur + 1} of {lesson.steps.length}</span>
          </div>
          <StepRail steps={lesson.steps.map((s) => ({ label: s.rail }))} current={cur} onSelect={go} isLocked={isLocked} />
        </div>

        <DeepDive ref={deepRef} title={step.deep.title} blocks={step.deep.blocks} open={deepOpen} onToggle={setDeepOpen} />
      </main>

      <aside className="side">
        <div className="card narr" data-testid="narration">
          <div className="steplbl">
            <span>STEP {cur + 1} / {lesson.steps.length}</span>
            <span className={`kind ${step.role}`}>{roleLabel[step.role]}</span>
          </div>
          <h2>{step.title}</h2>
          {step.body.map((p) => (
            <p key={p}><RichText text={p} /></p>
          ))}
          {step.list && (
            <ul className="chg">
              {step.list.map((t) => <li key={t}>{t}</li>)}
            </ul>
          )}
          {step.code && <pre>{step.code}</pre>}
          {step.after && <p><RichText text={step.after} /></p>}
          {step.goal && (
            <Callout kind="goal" title={canNext ? 'Goal complete ✓' : 'Your goal'}>
              {step.goal.text}
            </Callout>
          )}
          {step.callout && <Callout kind={step.callout.kind}>{step.callout.text}</Callout>}
          {step.changed.length > 0 && (
            <>
              <b className="mini-hd">WHAT CHANGED</b>
              <ul className="chg">
                {step.changed.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </>
          )}
          <p className="godeep">
            <button
              className="linkbtn"
              onClick={() => {
                setDeepOpen(true);
                deepRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
              }}
            >
              Go deeper: {step.deep.title} ↓
            </button>
          </p>
          <div className="nav2">
            <Button onClick={() => go(cur - 1)} disabled={cur === 0}>← Back</Button>
            <Button variant="primary" onClick={() => (next ? go(cur + 1) : go(0))} disabled={!canNext} aria-describedby={!canNext ? 'goal-hint' : undefined}>
              {next ? `Next: ${next.rail} →` : 'Replay lesson ↺'}
            </Button>
          </div>
          {!canNext && <p className="keys" id="goal-hint">Complete the goal to continue.</p>}
          <p className="keys">← → step · R replay · D deeper</p>
        </div>
        <div className="card learn">
          <h3>You&apos;ll learn</h3>
          <ul>
            {learnt.map((l) => (
              <li key={l.text} className={l.done ? 'ok' : ''}>
                <i aria-hidden="true">{l.done ? '✓' : ''}</i>
                <span>{l.text}</span>
              </li>
            ))}
          </ul>
        </div>
        {lesson.exercise && (
          <div className="card practice">
            <h3>Practice</h3>
            <p>Write these tests for real against Kudi:</p>
            <pre>pnpm exercise 02-boundaries</pre>
            <p className="note">See {lesson.exercise}/README.md</p>
          </div>
        )}
      </aside>
    </>
  );
}
