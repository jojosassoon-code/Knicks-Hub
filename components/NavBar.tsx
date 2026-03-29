'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const links = [
  { href: '/',          label: 'Home' },
  { href: '/standings', label: 'Standings' },
  { href: '/schedule',  label: 'Schedule' },
  { href: '/analyst',   label: 'Analyst Mode' },
  { href: '/news',      label: 'News' },
];

function BasketballIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93C7.24 7.24 8 10 8 12s-.76 4.76-3.07 7.07" />
      <path d="M19.07 4.93C16.76 7.24 16 10 16 12s.76 4.76 3.07 7.07" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <nav
        className="sticky top-0 z-50"
        style={{
          backgroundColor: 'rgba(8,12,20,0.85)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid #1E2D3D',
          boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">

          {/* Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 text-white hover:opacity-85 transition-opacity">
            <span style={{ color: '#F58426' }}><BasketballIcon /></span>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.55rem',
              letterSpacing: '0.08em',
              color: '#FFFFFF',
              lineHeight: 1,
            }}>
              KNICKS HUB
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-1">
            {links.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`relative px-4 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 inline-block ${active ? 'nav-active' : ''}`}
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: active ? '#FFFFFF' : '#8899AA',
                      backgroundColor: active ? 'rgba(0,107,182,0.18)' : 'transparent',
                      letterSpacing: '0.03em',
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#8899AA'; }}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2 rounded-lg transition hover:bg-white/10"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile full-screen overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={() => setOpen(false)}
          />

          {/* Slide-in panel */}
          <div
            className="fixed top-0 right-0 bottom-0 z-50 w-72 mobile-menu-enter flex flex-col"
            style={{
              backgroundColor: '#0A1520',
              borderLeft: '1px solid #1E2D3D',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #1E2D3D' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#FFFFFF', letterSpacing: '0.08em' }}>
                MENU
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-white p-1.5 rounded-lg hover:bg-white/10 transition"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 py-4">
              {links.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-6 py-4 font-semibold text-base transition-all"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: active ? '#FFFFFF' : '#8899AA',
                      backgroundColor: active ? 'rgba(0,107,182,0.15)' : 'transparent',
                      borderLeft: active ? '3px solid #F58426' : '3px solid transparent',
                    }}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer brand */}
            <div className="px-6 py-5" style={{ borderTop: '1px solid #1E2D3D' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#F58426', letterSpacing: '0.08em', opacity: 0.7 }}>
                KNICKS HUB
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
