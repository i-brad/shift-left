import Link from 'next/link';

const nav = [
  { label: 'Learn', href: '/learn/partitions-boundaries', ready: true },
  { label: 'Lab', href: '#', ready: false },
  { label: 'Practice', href: '#', ready: false },
  { label: 'Roadmap', href: '#', ready: false },
];

export function AppHeader() {
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="Shift Left home">
        <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
          <path d="M13 2 24 8 13 14 2 8z" fill="#e6ddfa" stroke="#1f1e1b" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M2 8v10l11 6V14z" fill="#cdbff3" stroke="#1f1e1b" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M24 8v10l-11 6V14z" fill="#a993e8" stroke="#1f1e1b" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
        Shift <u>Left</u>
      </Link>
      <nav aria-label="Main">
        {nav.map((n) =>
          n.ready ? (
            <Link key={n.label} href={n.href} className="tab" aria-current="page">
              {n.label}
            </Link>
          ) : (
            <span key={n.label} className="tab soon" title="Coming in Phase 2">
              {n.label}
            </span>
          ),
        )}
      </nav>
    </header>
  );
}
