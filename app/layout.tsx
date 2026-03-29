// app/layout.tsx
// This is the "root layout" — it wraps every single page in the app.
// Think of it like the master template: NavBar goes here once and
// automatically appears on all 5 pages.

import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'Knicks Hub',
  description: 'The ultimate New York Knicks fan dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ backgroundColor: '#080C14' }}>
        <NavBar />
        <main className="max-w-6xl mx-auto px-4 py-10">
          {children}
        </main>
        <footer
          className="text-center text-xs py-10 mt-16"
          style={{
            color: 'rgba(136,153,170,0.45)',
            borderTop: '1px solid #1E2D3D',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.04em',
          }}
        >
          KNICKS HUB · Data via NBA CDN & ESPN · Not affiliated with the New York Knicks or NBA
        </footer>
      </body>
    </html>
  );
}
