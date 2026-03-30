import StatePanel from '@/components/ui/StatePanel';
import NewsGrid from '@/components/news/NewsGrid';
import { TAG_COLORS } from '@/lib/newsColors';
import { getKnicksNews, type Article, type NewsBriefing, type NewsTag } from '@/lib/news';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTodayDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    year:    'numeric',
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Section label (orange left-border accent) ─────────────────────────────────

function SectionLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.75rem', marginBottom: '1.25rem' }}>
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
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8899AA', fontSize: '0.82rem', marginTop: '0.15rem' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
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
        padding: '0.2rem 0.65rem',
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

// ── 1. MASTHEAD ────────────────────────────────────────────────────────────────

function Masthead() {
  return (
    <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
      {/* Left: title + underline accent */}
      <div>
        <h1
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 'clamp(2.8rem, 7vw, 4.5rem)',
            color: '#FFFFFF',
            letterSpacing: '0.05em',
            lineHeight: 1,
            margin: 0,
          }}
        >
          KNICKS INTEL
        </h1>
        {/* Orange underline */}
        <div
          style={{
            height: '3px',
            width: '3.5rem',
            background: '#F58426',
            borderRadius: '2px',
            marginTop: '0.4rem',
          }}
        />
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.88rem',
            color: '#8899AA',
            marginTop: '0.6rem',
          }}
        >
          Latest coverage from around the league
        </p>
      </div>

      {/* Right: LIVE FEED badge + date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.25rem' }}>
        {/* Pulsing green dot badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(0,200,83,0.1)',
            border: '1px solid rgba(0,200,83,0.28)',
            borderRadius: '100px',
            padding: '0.25rem 0.75rem',
          }}
        >
          <span
            className="pulse-dot"
            style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#00C853',
              flexShrink: 0,
              animationDuration: '1.8s',
            }}
          />
          <span
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#00C853',
              textTransform: 'uppercase',
            }}
          >
            Live Feed
          </span>
        </div>

        {/* Date */}
        <span
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.78rem',
            color: '#8899AA',
          }}
        >
          {formatTodayDate()}
        </span>
      </div>
    </header>
  );
}

// ── 2. WAR ROOM REPORT ─────────────────────────────────────────────────────────

function WarRoomReport({ briefing }: { briefing: NewsBriefing }) {
  return (
    <section
      style={{
        background: 'linear-gradient(160deg, #0F1923 0%, #0A1520 100%)',
        border: '1px solid #1E2D3D',
        borderTop: '3px solid #F58426',
        borderRadius: '16px',
        padding: '1.5rem 1.75rem',
      }}
    >
      <SectionLabel
        title="War Room Report"
        subtitle={`Synthesized from ${briefing.basedOnCount} top articles`}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {briefing.bullets.map((bullet, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '1rem',
              padding: '0.75rem 0',
              borderBottom: i < briefing.bullets.length - 1 ? '1px solid rgba(30,45,61,0.6)' : 'none',
            }}
          >
            {/* Label */}
            <span
              style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '0.9rem',
                color: '#F58426',
                letterSpacing: '0.1em',
                flexShrink: 0,
                minWidth: '6rem',
              }}
            >
              {bullet.label}
            </span>
            {/* Text */}
            <span
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '0.92rem',
                color: '#E7F0F8',
                lineHeight: 1.55,
              }}
            >
              {bullet.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── 3. HERO CARD ───────────────────────────────────────────────────────────────

function HeroCard({ article }: { article: Article }) {
  const tagStyle = TAG_COLORS[article.tag];

  return (
    <section>
      <SectionLabel title="Top Story" subtitle="Highest-ranked article from the current feed" />

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="card card-orange"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          borderRadius: '16px',
          overflow: 'hidden',
          textDecoration: 'none',
          minHeight: '280px',
        }}
      >
        <div className="lg:grid" style={{ display: 'contents' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
            }}
            className="hero-card-grid"
          >
            {/* Left: content */}
            <div style={{ padding: '2rem 2.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Source + tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.22em',
                    color: '#F58426',
                    textTransform: 'uppercase',
                  }}
                >
                  {article.source.name}
                </span>
                <CategoryPill tag={article.tag} />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', color: '#8899AA' }}>
                  {timeAgo(article.publishedAt)}
                </span>
              </div>

              {/* Headline */}
              <h2
                style={{
                  fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
                  color: '#FFFFFF',
                  lineHeight: 1.05,
                  letterSpacing: '0.03em',
                  margin: 0,
                }}
              >
                {article.title}
              </h2>

              {/* Summary */}
              <p
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '0.92rem',
                  color: '#AFC0D2',
                  lineHeight: 1.7,
                  maxWidth: '42rem',
                }}
              >
                {article.deepSummary ?? article.summary}
              </p>

              {/* CTA */}
              <div style={{ marginTop: '0.5rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#FFFFFF',
                    background: 'rgba(0,107,182,0.2)',
                    border: '1px solid rgba(0,107,182,0.4)',
                    borderRadius: '8px',
                    padding: '0.5rem 1.1rem',
                    transition: 'background 0.15s ease',
                  }}
                >
                  Open Article
                  <span aria-hidden="true" style={{ fontSize: '0.85rem' }}>↗</span>
                </span>
              </div>
            </div>

            {/* Right: graphic panel */}
            <div
              className="hero-visual-panel"
              style={{
                position: 'relative',
                minHeight: '180px',
                background: 'linear-gradient(160deg, rgba(0,107,182,0.18) 0%, rgba(8,12,20,0.95) 100%)',
                borderLeft: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {/* Huge faded category word as texture */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: 'clamp(5rem, 12vw, 9rem)',
                    color: '#FFFFFF',
                    opacity: 0.06,
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {article.tag.toUpperCase()}
                </span>
              </div>

              {/* Source name centered */}
              <div style={{ position: 'relative', textAlign: 'center', padding: '1.5rem' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '3px',
                      background: tagStyle.text,
                      borderRadius: '2px',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'Bebas Neue, sans-serif',
                      fontSize: '1.3rem',
                      color: '#FFFFFF',
                      letterSpacing: '0.1em',
                      opacity: 0.85,
                    }}
                  >
                    {article.source.name.toUpperCase()}
                  </span>
                  <div
                    style={{
                      width: '40px',
                      height: '3px',
                      background: tagStyle.text,
                      borderRadius: '2px',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function NewsPage() {
  const { articles, briefing, error } = await getKnicksNews();
  const topStory     = articles[0];
  const gridArticles = articles.slice(1);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

      <Masthead />

      {/* Error / empty states */}
      {error === 'no_key' && (
        <StatePanel
          title="News coming soon"
          body={(
            <>
              Add your free GNews API key to enable this page. Open <code style={{ color: '#F58426' }}>.env.local</code> and set <code style={{ color: '#F58426' }}>GNEWS_API_KEY=your_key_here</code>.
            </>
          )}
          variant="empty"
        />
      )}

      {error && error !== 'no_key' && (
        <StatePanel
          title="Could not load news"
          body={`The news provider returned ${error}. Please try again later.`}
          variant="error"
        />
      )}

      {!error && articles.length === 0 && (
        <StatePanel
          title="No articles found"
          body="The current news search did not return any Knicks articles."
          variant="empty"
        />
      )}

      {/* War Room Report */}
      {briefing && <WarRoomReport briefing={briefing} />}

      {/* Top Story hero */}
      {topStory && (
        <div className="fade-in-delay" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          <HeroCard article={topStory} />

          {/* Filterable grid */}
          {gridArticles.length > 0 && (
            <div className="fade-in-delay-2">
              <NewsGrid articles={gridArticles} />
            </div>
          )}
        </div>
      )}

    </div>
  );
}
