import { course, lessons } from '@shift-left/lessons';
import { notFound } from 'next/navigation';
import { CourseTree } from '../../../components/CourseTree';
import { LessonPlayer } from '../../../components/LessonPlayer';

export function generateStaticParams() {
  return course.flatMap((m) => m.lessons).map((l) => ({ lesson: l.id }));
}

export default async function LessonPage({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson: id } = await params;
  const entry = course.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m }))).find((l) => l.id === id);
  if (!entry) notFound();
  const lesson = lessons[id];

  return (
    <div className="app">
      <CourseTree currentId={id} />
      {lesson ? (
        <LessonPlayer lesson={lesson} moduleTitle={entry.module.title} />
      ) : (
        <main className="stage soon">
          <div className="crumb">
            {String(entry.module.n).padStart(2, '0')}. {entry.module.title}
          </div>
          <h1>{entry.title}</h1>
          <p className="sub">This lesson is planned but not built yet.</p>
          {entry.ctfl && <p className="sub">Covers CTFL {entry.ctfl.join(', ')}.</p>}
        </main>
      )}
    </div>
  );
}
