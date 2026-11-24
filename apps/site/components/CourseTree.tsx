'use client';

import { course, lessonCount } from '@shift-left/lessons';
import Link from 'next/link';
import { useState } from 'react';

const Folder = ({ color }: { color: string }) => (
  <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h4l2 2h7A1.5 1.5 0 0 1 17 4.5v7a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 1 11.5z" fill={color} stroke="#1f1e1b" strokeWidth="1.2" />
  </svg>
);

export function CourseTree({ currentId }: { currentId: string }) {
  const currentModule = course.find((m) => m.lessons.some((l) => l.id === currentId))?.n;
  const [open, setOpen] = useState<Set<number>>(() => new Set(currentModule ? [currentModule] : []));
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(false);
  const q = query.trim().toLowerCase();

  const toggle = (n: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const built = course.flatMap((m) => m.lessons).filter((l) => l.built).length;

  return (
    <>
      <button className="sl-btn menu-btn" onClick={() => setShown((s) => !s)} aria-expanded={shown} aria-controls="course-tree">
        Course
      </button>
      <aside className={`tree ${shown ? 'show' : ''}`} id="course-tree" aria-label="Course">
        <div className="tree-hd">
          Course <span>{lessonCount} lessons</span>
        </div>
        <input className="search" placeholder="Search lessons…" aria-label="Search lessons" value={query} onChange={(e) => setQuery(e.target.value)} />
        {course.map((m) => {
          const hits = m.lessons.filter((l) => !q || l.title.toLowerCase().includes(q) || m.title.toLowerCase().includes(q));
          if (q && hits.length === 0) return null;
          const isOpen = q ? true : open.has(m.n);
          return (
            <div key={m.n} className={`mod ${isOpen ? 'open' : ''}`}>
              <button onClick={() => toggle(m.n)} aria-expanded={isOpen}>
                <span className="car" aria-hidden="true">›</span>
                <Folder color={m.color} />
                {String(m.n).padStart(2, '0')}. {m.title}
                {m.optional && <em>optional</em>}
                <small>{m.lessons.filter((l) => l.built).length}/{m.lessons.length}</small>
              </button>
              {isOpen && (
                <ul>
                  {hits.map((l) => (
                    <li key={l.id}>
                      <Link href={`/learn/${l.id}`} className={`lesson ${l.id === currentId ? 'cur' : ''} ${l.built ? '' : 'todo'}`} aria-current={l.id === currentId ? 'page' : undefined}>
                        {l.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        <div className="prog">
          Built <b>{built} / {lessonCount}</b>
          <div className="sl-progress" role="progressbar" aria-label="Lessons built" aria-valuenow={built} aria-valuemin={0} aria-valuemax={lessonCount}>
            <span style={{ width: `${(built / lessonCount) * 100}%` }} />
          </div>
        </div>
      </aside>
    </>
  );
}
