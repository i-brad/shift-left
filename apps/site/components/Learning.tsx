'use client';

import type { CheckQuestion, Prediction } from '@shift-left/lessons';
import { useState } from 'react';
import { RichText } from './RichText';

/** "Predict before you see": the scene keeps results hidden until the learner commits to a guess. */
export function PredictCard({ predict, chosen, onChoose }: { predict: Prediction; chosen: string | undefined; onChoose: (id: string) => void }) {
  const right = chosen === predict.answer;
  return (
    <div className="predict" role="group" aria-labelledby="predict-q">
      <b className="mini-hd">PREDICT FIRST</b>
      <p id="predict-q">{predict.question}</p>
      <div className="predict-opts">
        {predict.options.map((o) => (
          <button
            key={o.id}
            type="button"
            className="opt"
            aria-pressed={chosen === o.id}
            data-result={chosen ? (o.id === predict.answer ? 'right' : o.id === chosen ? 'wrong' : undefined) : undefined}
            disabled={!!chosen}
            onClick={() => onChoose(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {chosen && (
        <p className="predict-result" role="status">
          <b>{right ? 'Right.' : 'Not quite.'}</b> <RichText text={predict.explain} />
        </p>
      )}
    </div>
  );
}

/** End-of-lesson check: each question reveals its explanation once answered. */
export function LessonCheck({ questions }: { questions: CheckQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const answered = Object.keys(answers).length;
  const score = questions.filter((q, i) => answers[i] === q.answer).length;
  return (
    <section className="check" aria-labelledby="check-title">
      <div className="check-hd">
        <h2 id="check-title">Check yourself</h2>
        <span>{answered === questions.length ? `${score} / ${questions.length} right` : `${answered} / ${questions.length} answered`}</span>
      </div>
      {questions.map((q, i) => {
        const a = answers[i];
        return (
          <fieldset key={q.q} className="check-q">
            <legend>
              {i + 1}. {q.q}
            </legend>
            {q.options.map((o, j) => (
              <label key={o} className="check-opt" data-result={a === undefined ? undefined : j === q.answer ? 'right' : j === a ? 'wrong' : undefined}>
                <input type="radio" name={`q${i}`} checked={a === j} disabled={a !== undefined} onChange={() => setAnswers((s) => ({ ...s, [i]: j }))} />
                {o}
              </label>
            ))}
            {a !== undefined && (
              <p className="check-why" role="status">
                <b>{a === q.answer ? 'Right.' : 'Not quite.'}</b> {q.why}
              </p>
            )}
          </fieldset>
        );
      })}
    </section>
  );
}

export function AtWork({ items }: { items: string[] }) {
  return (
    <div className="card atwork">
      <h3>Use it on your team</h3>
      <ol>
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>
    </div>
  );
}
