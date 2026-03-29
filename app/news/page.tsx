// app/news/page.tsx — News Page (/news)
import { getKnicksNews, type Article } from '@/lib/news';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function FeaturedCard({ article }: { article: Article }) {
  const ago = timeAgo(article.publishedAt);
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card card-orange block rounded-2xl overflow-hidden group"
      style={{ textDecoration: 'none' }}
    >
      <div className="sm:flex">
        {article.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image}
            alt={article.title}
            className="w-full sm:w-64 object-cover flex-shrink-0"
            style={{ height: '200px' }}
          />
        )}
        <div className="p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: 'rgba(245,132,38,0.18)',
                  color: '#F58426',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.12em',
                  border: '1px solid rgba(245,132,38,0.3)',
                }}
              >
                FEATURED
              </span>
              <span style={{ color: '#8899AA', fontSize: '0.8rem' }}>
                {article.source.name} · {ago}
              </span>
            </div>
            <h2
              className="group-hover:text-orange-400 transition-colors duration-200"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.3rem, 3vw, 1.7rem)',
                color: '#FFFFFF',
                letterSpacing: '0.03em',
                lineHeight: 1.2,
                marginBottom: '0.75rem',
              }}
            >
              {article.title}
            </h2>
            {article.description && (
              <p style={{ color: '#8899AA', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {article.description}
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.8rem',
              color: '#F58426',
              letterSpacing: '0.1em',
            }}>
              READ MORE
            </span>
            <span style={{ color: '#F58426', fontSize: '1rem' }}>→</span>
          </div>
        </div>
      </div>
    </a>
  );
}

function NewsCard({ article }: { article: Article }) {
  const ago = timeAgo(article.publishedAt);
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card block rounded-2xl overflow-hidden group"
      style={{ textDecoration: 'none' }}
    >
      {article.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.image}
          alt={article.title}
          className="w-full object-cover"
          style={{ height: '140px' }}
        />
      )}
      <div className="p-5 flex flex-col" style={{ minHeight: article.image ? undefined : '100%' }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: '#F58426', fontSize: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            {article.source.name}
          </span>
          <span style={{ color: '#1E2D3D' }}>·</span>
          <span style={{ color: '#8899AA', fontSize: '0.75rem' }}>{ago}</span>
        </div>
        <h3
          className="group-hover:text-orange-400 transition-colors duration-200 flex-1"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            color: '#FFFFFF',
            letterSpacing: '0.03em',
            lineHeight: 1.3,
            marginBottom: '0.5rem',
          }}
        >
          {article.title}
        </h3>
        {article.description && (
          <p
            className="text-sm mt-1"
            style={{
              color: '#8899AA',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {article.description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-1">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: '#8899AA', letterSpacing: '0.08em' }}>
            READ MORE
          </span>
          <span style={{ color: '#8899AA', fontSize: '0.85rem' }}>→</span>
        </div>
      </div>
    </a>
  );
}

export default async function NewsPage() {
  const { articles, error } = await getKnicksNews();

  return (
    <div className="space-y-8 fade-in">

      {/* ── Header ── */}
      <div className="section-label">
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 6vw, 3.5rem)',
            color: '#FFFFFF',
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}>
            KNICKS NEWS
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#8899AA' }}>
            Latest headlines · Powered by GNews
          </p>
        </div>
      </div>

      {/* ── No API key ── */}
      {error === 'no_key' && (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            backgroundColor: 'rgba(15,25,35,0.8)',
            border: '1px dashed rgba(245,132,38,0.3)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📰</div>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            color: '#FFFFFF',
            letterSpacing: '0.06em',
            marginBottom: '0.75rem',
          }}>
            NEWS COMING SOON
          </p>
          <p style={{ color: '#8899AA', fontSize: '0.9rem', maxWidth: '32rem', margin: '0 auto', lineHeight: 1.6 }}>
            Add your free GNews API key to enable this page. Open{' '}
            <code style={{
              backgroundColor: 'rgba(30,45,61,0.8)',
              color: '#F58426',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
            }}>
              .env.local
            </code>{' '}
            and set{' '}
            <code style={{
              backgroundColor: 'rgba(30,45,61,0.8)',
              color: '#F58426',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
            }}>
              GNEWS_API_KEY=your_key_here
            </code>
          </p>
        </div>
      )}

      {/* ── API error ── */}
      {error && error !== 'no_key' && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            backgroundColor: 'rgba(15,25,35,0.8)',
            border: '1px solid rgba(255,61,61,0.3)',
          }}
        >
          <p style={{ color: '#FF3D3D' }}>Could not load news ({error}). Please try again later.</p>
        </div>
      )}

      {/* ── No articles ── */}
      {!error && articles.length === 0 && (
        <p style={{ color: '#8899AA' }}>No articles found.</p>
      )}

      {/* ── Magazine layout ── */}
      {articles.length > 0 && (
        <div className="space-y-5 fade-in-delay">
          {/* Featured article — full width */}
          <FeaturedCard article={articles[0]} />

          {/* Remaining articles — grid */}
          {articles.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 fade-in-delay-2">
              {articles.slice(1).map((article, i) => (
                <NewsCard key={i} article={article} />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
