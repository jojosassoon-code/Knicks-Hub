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

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <nav
        className="sticky top-0 z-50"
        style={{
          backgroundColor: 'rgba(8,12,20,0.92)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,107,182,0.4)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">

          {/* Wordmark */}
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', textDecoration: 'none' }}
          >
            {/* Orange circle logo mark */}
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: '#F58426',
                flexShrink: 0,
                display: 'inline-block',
                boxShadow: '0 0 6px rgba(245,132,38,0.55)',
              }}
            />
            <span
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.6rem',
                letterSpacing: '0.08em',
                lineHeight: 1,
              }}
            >
              <span style={{ color: '#F58426' }}>KNICKS</span>
              <span style={{ color: '#FFFFFF' }}> HUB</span>
            </span>
          </Link>

          {/* Desktop links */}
          <ul
            className="hidden md:flex items-center"
            style={{ gap: '0.15rem', listStyle: 'none', margin: 0, padding: 0 }}
          >
            {links.map(({ href, label }) => {
              const active = pathname === href;
              const isAnalyst = href === '/analyst';
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      'nav-link',
                      active    ? 'nav-active'  : '',
                      isAnalyst ? 'nav-analyst'  : '',
                    ].filter(Boolean).join(' ')}
                    style={{
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: '1rem',
                      letterSpacing: '0.1em',
                      color: active ? '#FFFFFF' : '#9CA3AF',
                      padding: '0.45rem 1rem',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      display: 'inline-block',
                      border: '1px solid transparent',
                      transition: 'color 0.15s ease, background 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#F58426',
            }}
          >
            {open ? (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile full-width dropdown */}
      {open && (
        <div
          className="md:hidden mobile-menu-dropdown"
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            zIndex: 49,
            backgroundColor: '#080C14',
            borderBottom: '1px solid rgba(0,107,182,0.4)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          }}
        >
          <nav style={{ padding: '0.5rem 0 1rem' }}>
            {links.map(({ href, label }) => {
              const active = pathname === href;
              const isAnalyst = href === '/analyst';
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'block',
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: '1.3rem',
                    letterSpacing: '0.1em',
                    color: active ? '#FFFFFF' : '#9CA3AF',
                    padding: '0.9rem 1.5rem',
                    textDecoration: 'none',
                    borderLeft: active
                      ? '3px solid #F58426'
                      : '3px solid transparent',
                    backgroundColor: active
                      ? 'rgba(0,107,182,0.1)'
                      : isAnalyst
                      ? 'rgba(245,132,38,0.04)'
                      : 'transparent',
                    transition: 'color 0.15s ease',
                  }}
                >
                  {label}
                  {isAnalyst && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        display: 'inline-block',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#F58426',
                        verticalAlign: 'middle',
                        opacity: 0.75,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
