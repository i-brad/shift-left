'use client';

import { evaluateStep, initialLearner, type Learner, type Lesson } from '@shift-left/lessons';
import { Button, Callout, Chip, Metric, StepRail } from '@shift-left/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SceneControls, SceneView, legendFor, metricsFor } from './scenes';
import { DeepDive } from './DeepDive';
import { AtWork, LessonCheck, PredictCard } from './Learning';
import { RichText } from './RichText';

const roleLabel = { setup: 'SETUP', problem: 'PROBLEM', fix: 'FIX', recap: 'RECAP' } as const;

type Saved = { met: string[]; furthest: number; predictions?: Record<string, string> };
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
  const [learner, setLearnerState] = useState<Learner>(initialLearner);
  const setLearner = useCallback((f: (l: Learner) => Learner) => setLearnerState(f), []);
  const [met, setMet] = useState<Set<string>>(new Set());
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [deepOpen, setDeepOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const deepRef = useRef<HTMLDetailsElement>(null);

  const step = lesson.steps[cur]!;
  const ev = useMemo(() => evaluateStep(step, learner, lesson), [step, learner, lesson]);

  // Restore progress, then follow the URL hash (#step-3) now and whenever it changes.
  useEffect(() => {
    const saved = load(lesson.id);
    setMet(new Set(saved.met));
    setPredictions(saved.predictions ?? {});
    const fromHash = () => {
      const m = /^#step-(\d+)$/.exec(window.location.hash);
      if (!m) return;
      // Never jump past a goal or prediction that hasn't been done.
      const wanted = Math.min(lesson.steps.length - 1, Math.max(0, Number(m[1]) - 1));
      const latest = load(lesson.id);
      const firstLocked = lesson.steps.findIndex((s, i) => i > 0 && lesson.steps.slice(0, i).some((p) => (p.goal && !latest.met.includes(p.id)) || (p.predict && !latest.predictions?.[p.id])));
      setCur(firstLocked === -1 ? wanted : Math.min(wanted, firstLocked - 1));
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [lesson]);

  // Record a goal the moment it is met.
  useEffect(() => {
    if (step.goal && ev.goalMet && !met.has(step.id)) {
      setMet((prev) => {
        const next = new Set(prev).add(step.id);
        save(lesson.id, { met: [...next], furthest: cur, predictions });
        return next;
      });
    }
  }, [ev.goalMet, step, met, lesson.id, cur]);

  /** A step is locked while any earlier goal or prediction is unfinished. */
  const isLocked = useCallback(
    (i: number) => lesson.steps.slice(0, i).some((s) => (s.goal && !met.has(s.id)) || (s.predict && !predictions[s.id])),
    [lesson.steps, met, predictions],
  );

  const choosePrediction = (id: string) => {
    setPredictions((prev) => {
      const next = { ...prev, [step.id]: id };
      save(lesson.id, { met: [...met], furthest: cur, predictions: next });
      return next;
    });
  };

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= lesson.steps.length || isLocked(i)) return;
      setCur(i);
      setLearnerState((l) => ({ ...l, probe: null, req: null, sent: [] }));
      setAnimKey((k) => k + 1);
      history.replaceState(null, '', `#step-${i + 1}`);
    },
    [lesson.steps.length, isLocked],
  );

  const predicted = !step.predict || !!predictions[step.id];
  const canNext = (!step.goal || ev.goalMet || met.has(step.id)) && predicted;
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

  const metrics = metricsFor(ev, predicted);

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
            <SceneView ev={ev} scene={step.scene} reducedMotion={reducedMotion} hideResults={!predicted} />
          </div>
          <div className={`controls controls-${ev.kind}`} key={`controls-${cur}`}>
            <SceneControls ev={ev} scene={step.scene} learner={learner} setLearner={setLearner} hideResults={!predicted} />
          </div>
          <div className="legend" aria-hidden="true">
            {legendFor(ev.kind).map((x) => (
              <span key={x.label}>
                <i style={{ background: x.color, borderRadius: x.round ? '50%' : undefined }} />
                {x.label}
              </span>
            ))}
          </div>
        </section>

        <div className="rail">
          <div className="rail-hd">
            <b>In this lesson</b>
            <span>Step {cur + 1} of {lesson.steps.length}</span>
          </div>
          <StepRail steps={lesson.steps.map((s) => ({ label: s.rail }))} current={cur} onSelect={go} isLocked={isLocked} />
        </div>

        {!next && lesson.check.length > 0 && <LessonCheck questions={lesson.check} />}

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
          {step.predict && <PredictCard predict={step.predict} chosen={predictions[step.id]} onChoose={choosePrediction} />}
          {step.goal && (
            <Callout kind="goal" title={canNext ? 'Goal complete ✓' : 'Your goal'}>
              {step.goal.text}
            </Callout>
          )}
          {step.callout && <Callout kind={step.callout.kind}><RichText text={step.callout.text} /></Callout>}
          {step.changed.length > 0 && predicted && (
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
          {!canNext && <p className="keys" id="goal-hint">{predicted ? 'Complete the goal to continue.' : 'Make your prediction to continue.'}</p>}
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
        <AtWork items={lesson.atWork} />
        {lesson.exercise && (
          <div className="card practice">
            <h3>Practice</h3>
            <p>Write these tests for real against Kudi:</p>
            <pre>pnpm exercise {lesson.exercise.split('/').at(-1)}</pre>
            <p className="note">See {lesson.exercise}/README.md</p>
          </div>
        )}
      </aside>
    </>
  );
}
