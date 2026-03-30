'use client';

import { useState } from 'react';
import type { Article, NewsTag } from '@/lib/news';
import { TAG_COLORS } from '@/lib/newsColors';

// ── Filter config ──────────────────────────────────────────────────────────────

const FILTERS: Array<{ label: string; tags: NewsTag[] | null }> = [
  { label: 'ALL',        tags: null },
  { label: 'INJURY',     tags: ['Injury'] },
  { label: 'PLAYOFFS',   tags: ['Playoffs'] },
  { label: 'POSTGAME',   tags: ['Postgame'] },
  { label: 'TRADE BUZZ', tags: ['Trade Buzz'] },
  { label: 'OFF-COURT',  tags: ['Off-Court'] },
  { label: 'GENERAL',    tags: ['General', 'Rotation', 'Game Preview'] },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Category pill ──────────────────────────────────────────────────────────────

function CategoryPill({ tag }: { tag: NewsTag }) {
  const s = TAG_COLORS[tag];
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        padding: '0.2rem 0.6rem',
        borderRadius: '100px',
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
      }}
    >
      {tag}
    </span>
  );
}

// ── News card ──────────────────────────────────────────────────────────────────

function NewsCard({ article }: { article: Article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card card-orange"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        padding: '1.25rem 1.4rem',
        textDecoration: 'none',
        height: '100%',
      }}
    >
      {/* Category pill */}
      <div style={{ marginBottom: '0.75rem' }}>
        <CategoryPill tag={article.tag} />
      </div>

      {/* Headline */}
      <h3
        style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '1.25rem',
          color: '#FFFFFF',
          lineHeight: 1.1,
          letterSpacing: '0.03em',
          flex: '1 1 auto',
          margin: 0,
        }}
      >
        {article.title}
      </h3>

      {/* Summary */}
      <p
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.8rem',
          color: '#8899AA',
          lineHeight: 1.6,
          marginTop: '0.6rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {article.summary}
      </p>

      {/* Footer: source + timestamp */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(30,45,61,0.7)',
        }}
      >
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: '#FFFFFF' }}>
          {article.source.name}
        </span>
        <span style={{ color: 'rgba(136,153,170,0.4)', fontSize: '0.6rem' }}>●</span>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: '#8899AA' }}>
          {timeAgo(article.publishedAt)}
        </span>
      </div>
    </a>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function NewsGrid({ articles }: { articles: Article[] }) {
  const [active, setActive] = useState<string>('ALL');

  const filtered = active === 'ALL'
    ? articles
    : articles.filter(a => {
        const entry = FILTERS.find(f => f.label === active);
        return entry?.tags?.includes(a.tag) ?? true;
      });

  return (
    <section>
      {/* Section label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ width: '3px', borderRadius: '2px', background: '#F58426', flexShrink: 0 }} />
        <div>
          <h2
            style={{
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '1.1rem',
              color: '#FFFFFF',
              letterSpacing: '0.1em',
              margin: 0,
            }}
          >
            Latest Knicks Intel
          </h2>
          <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.82rem', marginTop: '0.15rem' }}>
            {articles.length} stories · ranked by source quality and recency
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.45rem',
          marginBottom: '1.5rem',
        }}
      >
        {FILTERS.map(f => {
          const isActive = active === f.label;
          return (
            <button
              key={f.label}
              onClick={() => setActive(f.label)}
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                padding: '0.3rem 0.85rem',
                borderRadius: '100px',
                border: isActive ? '1px solid #F58426' : '1px solid rgba(255,255,255,0.13)',
                background: isActive ? '#F58426' : 'transparent',
                color: isActive ? '#080C14' : '#8899AA',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.9rem' }}>
          No stories in this category right now.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(1, 1fr)',
          }}
          className="sm:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map(article => (
            <NewsCard key={article.url} article={article} />
          ))}
        </div>
      )}
    </section>
  );
}
