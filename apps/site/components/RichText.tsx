'use client';

import { glossary } from '@shift-left/lessons';
import { Fragment, useId, useState } from 'react';

/** A glossary term: tap or click to show its plain-language definition inline. */
export function Term({ id, label }: { id: string; label?: string }) {
  const entry = glossary[id];
  const [open, setOpen] = useState(false);
  const popId = useId();
  if (!entry) return <>{label ?? id}</>;
  return (
    <span className="term-wrap">
      <button type="button" className="term" aria-expanded={open} aria-controls={popId} onClick={() => setOpen((o) => !o)}>
        {label ?? entry.term.charAt(0).toLowerCase() + entry.term.slice(1)}
      </button>
      {open && (
        <span id={popId} role="note" className="term-pop">
          <b>{entry.term}:</b> {entry.def}
        </span>
      )}
    </span>
  );
}

/** Renders lesson text with **bold**, `code` and [[glossary-key|label]]. Text only — never HTML. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[\[[a-z0-9-]+(?:\|[^\]]+)?\]\])/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('`') && p.endsWith('`')) return <code key={i}>{p.slice(1, -1)}</code>;
        const m = /^\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]$/.exec(p);
        if (m) return <Term key={i} id={m[1]!} label={m[2]} />;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}
