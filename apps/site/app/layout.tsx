import '@shift-left/ui/styles.css';
import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppHeader } from '../components/AppHeader';

export const metadata: Metadata = {
  title: 'Shift Left · QA lessons',
  description: 'Learn the basics of QA testing with interactive 3D lessons and a real codebase to test.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
