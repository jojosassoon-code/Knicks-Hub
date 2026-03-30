import { getKnicksNews, type Article, type NewsBriefing, type NewsTag } from '@/lib/news';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function TagBadge({ tag }: { tag: NewsTag }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
      style={{
        borderColor: 'rgba(245,132,38,0.28)',
        background: 'rgba(245,132,38,0.1)',
        color: '#F58426',
      }}
    >
      {tag}
    </span>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-2">
      <div className="section-label">
        <h2
          style={{
            fontSize: 'clamp(1.4rem, 3vw, 1.9rem)',
            lineHeight: 1,
          }}
        >
          {title}
        </h2>
      </div>
      <p className="max-w-2xl text-sm sm:text-[0.95rem]" style={{ color: '#8899AA', lineHeight: 1.6 }}>
        {description}
      </p>
    </div>
  );
}

function MetadataLine({ article }: { article: Article }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm" style={{ color: '#8899AA' }}>
      <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{article.source.name}</span>
      <span>•</span>
      <span>{timeAgo(article.publishedAt)}</span>
      <TagBadge tag={article.tag} />
    </div>
  );
}

function BriefingPanel({ briefing }: { briefing: NewsBriefing }) {
  return (
    <section
      className="card overflow-hidden rounded-[28px]"
      style={{
        background: 'linear-gradient(135deg, rgba(0,107,182,0.18), rgba(245,132,38,0.08) 48%, rgba(10,21,32,0.98) 100%)',
      }}
    >
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mb-4 flex items-center gap-3">
            <span
              className="rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em]"
              style={{
                borderColor: 'rgba(143,203,255,0.28)',
                background: 'rgba(143,203,255,0.1)',
                color: '#8FCBFF',
              }}
            >
              AI Briefing
            </span>
            <span className="text-xs uppercase tracking-[0.18em]" style={{ color: '#8899AA' }}>
              Based on {briefing.basedOnCount} key articles
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.9rem, 4vw, 3rem)',
              lineHeight: 0.98,
              color: '#FFFFFF',
            }}
          >
            {briefing.headline}
          </h2>

          <p className="mt-5 max-w-3xl text-sm sm:text-base" style={{ color: '#E7F0F8', lineHeight: 1.8 }}>
            {briefing.summary}
          </p>
        </div>

        <div
          className="border-t p-6 sm:p-8 lg:border-l lg:border-t-0"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em]" style={{ color: '#F58426' }}>
            Consolidated Key Points
          </p>
          <div className="mt-4 space-y-3">
            {briefing.keyPoints.map((point, index) => (
              <div
                key={`${point}-${index}`}
                className="rounded-2xl border p-4"
                style={{
                  borderColor: 'rgba(255,255,255,0.08)',
                  background: 'rgba(8,12,20,0.22)',
                }}
              >
                <p className="text-sm sm:text-[0.95rem]" style={{ color: '#D7E2EC', lineHeight: 1.7 }}>
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TopStoryCard({ article }: { article: Article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card card-orange group block overflow-hidden rounded-[28px]"
      style={{ textDecoration: 'none' }}
    >
      <div className="grid gap-0 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mb-5 flex items-center gap-3">
            <span
              className="rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em]"
              style={{
                borderColor: 'rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.06)',
                color: '#FFFFFF',
              }}
            >
              Top Story
            </span>
          </div>

          <MetadataLine article={article} />

          <h3
            className="mt-5 text-balance group-hover:text-orange-300"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.3rem)',
              lineHeight: 0.96,
              color: '#FFFFFF',
              transition: 'color 180ms ease',
            }}
          >
            {article.title}
          </h3>

          <div className="mt-6 space-y-5">
            <div>
              <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em]" style={{ color: '#F58426' }}>
                Summary
              </p>
              <p className="max-w-2xl text-sm sm:text-base" style={{ color: '#D7E2EC', lineHeight: 1.7 }}>
                {article.deepSummary ?? article.summary}
              </p>
            </div>

            {article.whyItMatters && (
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: 'rgba(245,132,38,0.18)',
                  background: 'linear-gradient(180deg, rgba(245,132,38,0.08), rgba(245,132,38,0.03))',
                }}
              >
                <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em]" style={{ color: '#F58426' }}>
                  Why It Matters
                </p>
                <p className="text-sm sm:text-base" style={{ color: '#FFF4EB', lineHeight: 1.7 }}>
                  {article.whyItMatters}
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          className="relative min-h-[220px] overflow-hidden border-t lg:border-t-0 lg:border-l"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            background: article.image
              ? `linear-gradient(180deg, rgba(8,12,20,0.05), rgba(8,12,20,0.6)), url(${article.image}) center/cover`
              : 'linear-gradient(160deg, rgba(0,107,182,0.32), rgba(245,132,38,0.12), rgba(8,12,20,0.92))',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em]"
              style={{
                borderColor: 'rgba(255,255,255,0.12)',
                background: 'rgba(8,12,20,0.6)',
                color: '#FFFFFF',
                backdropFilter: 'blur(8px)',
              }}
            >
              Open Article
              <span aria-hidden="true">↗</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

function TakeawaysPanel({ takeaways }: { takeaways: string[] }) {
  return (
    <div
      className="card rounded-[24px] p-5 sm:p-6"
      style={{
        background: 'linear-gradient(180deg, rgba(15,25,35,0.96), rgba(9,17,27,0.98))',
      }}
    >
      <SectionHeading
        title="What Matters Today"
        description="Fast reads pulled from the most relevant Knicks developments in the current feed."
      />

      <div className="mt-5 space-y-3">
        {takeaways.map((takeaway, index) => (
          <div
            key={`${takeaway}-${index}`}
            className="flex gap-3 rounded-2xl border p-4"
            style={{
              borderColor: 'rgba(30,45,61,0.9)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <span
              className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[0.72rem] font-semibold"
              style={{
                background: 'rgba(0,107,182,0.18)',
                color: '#8FCBFF',
              }}
            >
              {index + 1}
            </span>
            <p className="text-sm sm:text-[0.95rem]" style={{ color: '#D7E2EC', lineHeight: 1.6 }}>
              {takeaway}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntelCard({ article }: { article: Article }) {
  return (
    <article
      className="card flex h-full flex-col rounded-[24px] p-5 sm:p-6"
      style={{
        background: 'linear-gradient(180deg, rgba(15,25,35,0.96), rgba(10,21,32,1))',
      }}
    >
      <MetadataLine article={article} />

      <h3
        className="mt-4 text-balance"
        style={{
          fontSize: '1.35rem',
          color: '#FFFFFF',
          lineHeight: 1.1,
        }}
      >
        {article.title}
      </h3>

      <p className="mt-4 flex-1 text-sm sm:text-[0.95rem]" style={{ color: '#D7E2EC', lineHeight: 1.7 }}>
        {article.deepSummary ?? article.summary}
      </p>

      {article.whyItMatters && (
        <p className="mt-4 text-sm" style={{ color: '#8FB6D8', lineHeight: 1.6 }}>
          <span className="font-semibold uppercase tracking-[0.16em]" style={{ color: '#F58426', fontSize: '0.68rem' }}>
            Why It Matters
          </span>{' '}
          {article.whyItMatters}
        </p>
      )}

      <div className="mt-5">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.18em]"
          style={{
            borderColor: 'rgba(30,45,61,0.95)',
            color: '#FFFFFF',
            background: 'rgba(255,255,255,0.02)',
            textDecoration: 'none',
          }}
        >
          Open Article
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

export default async function NewsPage() {
  const { articles, takeaways, briefing, error } = await getKnicksNews();
  const topStory = articles[0];
  const latestIntel = articles.slice(1);

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        title="KNICKS INTEL"
        eyebrow="NEWS DESK"
        metadata={['Curated Knicks coverage', 'Consolidated AI briefing', 'Powered by GNews']}
      />

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

      {briefing && <BriefingPanel briefing={briefing} />}

      {topStory && (
        <div className="space-y-8 fade-in-delay">
          <TopStoryCard article={topStory} />

          {takeaways.length > 0 && <TakeawaysPanel takeaways={takeaways} />}

          {latestIntel.length > 0 && (
            <section className="space-y-5 fade-in-delay-2">
              <SectionHeading
                title="Latest Knicks Intel"
                description="A cleaner stream of the remaining stories after duplicate removal, source weighting, relevance ranking, and limited article-level synthesis."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {latestIntel.map(article => (
                  <IntelCard key={article.url} article={article} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
