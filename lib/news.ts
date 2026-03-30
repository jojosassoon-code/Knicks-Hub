const NEWS_REVALIDATE_SECONDS = 3600;
const MAX_FETCHED_ARTICLES = 25;
const MAX_CURATED_ARTICLES = 12;
const MAX_DEEP_DIVE_ARTICLES = 5;
const ARTICLE_FETCH_TIMEOUT_MS = 3500;

export type NewsTag =
  | 'Injury'
  | 'Game Preview'
  | 'Postgame'
  | 'Rotation'
  | 'Trade Buzz'
  | 'Playoffs'
  | 'Off-Court'
  | 'General';

export type Article = {
  title: string;
  description: string;
  url: string;
  source: { name: string };
  publishedAt: string;
  image: string | null;
  summary: string;
  whyItMatters: string | null;
  tag: NewsTag;
  score: number;
  deepSummary?: string | null;
};

export type NewsBriefing = {
  bullets: Array<{ label: string; text: string }>;
  basedOnCount: number;
};

type RawArticle = {
  title?: string;
  description?: string;
  url?: string;
  source?: { name?: string };
  publishedAt?: string;
  image?: string | null;
};

type ArticleSignals = {
  metaDescription: string;
  paragraphText: string;
};

const SOURCE_WEIGHTS: Record<string, number> = {
  'the athletic': 18,
  espn: 14,
  'sports illustrated': 10,
  'new york post': 9,
  sny: 10,
  reuters: 12,
  ap: 12,
  'associated press': 12,
  nba: 14,
  'nba.com': 14,
  yahoo: 4,
  bleacher: -5,
  fannation: -4,
  yardbarker: -8,
  clutchpoints: -10,
  'si.com': 6,
};

const CLICKBAIT_PATTERNS = [
  'you won’t believe',
  'you wont believe',
  'shocking',
  'wild',
  'rumor',
  'rumour',
  'rumors',
  'rumours',
  'fans react',
  'must see',
  'watch:',
  'watch ',
  'breaking?',
  'went viral',
  'best ever',
];

const TAG_KEYWORDS: Array<{ tag: NewsTag; keywords: string[] }> = [
  { tag: 'Injury', keywords: ['injury', 'injured', 'questionable', 'out ', 'doubtful', 'ankle', 'knee', 'hamstring', 'return', 'status'] },
  { tag: 'Game Preview', keywords: ['preview', 'pregame', 'tonight vs', 'matchup', 'keys to the game', 'tipoff'] },
  { tag: 'Postgame', keywords: ['postgame', 'takeaways', 'win over', 'loss to', 'beats', 'fall to', 'defeat', 'recap', 'after win', 'after loss'] },
  { tag: 'Rotation', keywords: ['rotation', 'minutes', 'starting lineup', 'bench', 'lineup', 'role', 'usage', 'coach', 'starter'] },
  { tag: 'Trade Buzz', keywords: ['trade', 'deadline', 'target', 'market', 'rumor', 'proposal', 'package'] },
  { tag: 'Playoffs', keywords: ['playoff', 'play-in', 'seeding', 'seed', 'east standings', 'postseason'] },
  { tag: 'Off-Court', keywords: ['front office', 'ownership', 'contract', 'arena', 'media', 'business', 'community', 'charity'] },
];

const WHY_IT_MATTERS_BY_TAG: Record<NewsTag, string> = {
  Injury: 'Availability can shift the Knicks rotation, matchup plans, and late-game options.',
  'Game Preview': 'Preview details usually point to the matchup edges that could swing tonight’s result.',
  Postgame: 'The biggest postgame developments often signal what carries into the next stretch.',
  Rotation: 'Rotation changes reveal who Tom Thibodeau trusts and where the workload is moving.',
  'Trade Buzz': 'Even light trade noise can hint at roster priorities and long-term team needs.',
  Playoffs: 'Playoff positioning changes the Knicks path, urgency, and possible first-round matchup.',
  'Off-Court': 'Off-court developments can shape organizational direction even when they do not affect tonight’s game.',
  General: 'It adds useful context around the Knicks without changing the core team picture on its own.',
};

function cleanText(value: string | undefined): string {
  return (value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/\s+[|:-]\s+[^|:-]+$/, '')
    .trim();
}

function stripHtml(html: string): string {
  return cleanText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  );
}

function normalizeTitle(title: string): string {
  return cleanText(title)
    .toLowerCase()
    .replace(/new york knicks|knicks/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(the|a|an|and|or|vs|vs\.|to|for|of|on|in|at|with|from|after|before)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      parsed.searchParams.delete(param);
    });
    return parsed.toString();
  } catch {
    return url;
  }
}

function getSourceWeight(sourceName: string): number {
  const lower = sourceName.toLowerCase();
  for (const [pattern, weight] of Object.entries(SOURCE_WEIGHTS)) {
    if (lower.includes(pattern)) return weight;
  }
  return 0;
}

function getTag(text: string): NewsTag {
  const lower = text.toLowerCase();

  for (const entry of TAG_KEYWORDS) {
    if (entry.keywords.some(keyword => lower.includes(keyword))) {
      return entry.tag;
    }
  }

  return 'General';
}

function getHoursAgo(publishedAt: string): number {
  const published = new Date(publishedAt).getTime();
  if (Number.isNaN(published)) return 48;
  return Math.max(0, (Date.now() - published) / 3_600_000);
}

function hasClickbait(text: string): boolean {
  const lower = text.toLowerCase();
  return CLICKBAIT_PATTERNS.some(pattern => lower.includes(pattern));
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

function splitSentences(text: string): string[] {
  return cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length >= 30);
}

function scoreSentence(sentence: string): number {
  const lower = sentence.toLowerCase();
  let score = 0;

  if (lower.includes('knicks')) score += 6;
  if (/brunson|towns|anunoby|hart|bridges|robinson|thibodeau/.test(lower)) score += 5;
  if (/injury|playoff|starting|rotation|minutes|seed|trade|questionable|out/.test(lower)) score += 4;
  if (sentence.length >= 60 && sentence.length <= 210) score += 3;
  if (/subscribe|cookies|newsletter|advertisement/.test(lower)) score -= 8;

  return score;
}

function selectBestSentence(text: string): string | null {
  const sentences = splitSentences(text).sort((a, b) => scoreSentence(b) - scoreSentence(a));
  return sentences[0] ?? null;
}

function summarize(article: Pick<Article, 'title' | 'description' | 'tag'>): string {
  const description = cleanText(article.description);
  const title = cleanText(article.title);

  if (description) {
    const summary = description
      .replace(/\b(read more|click here|subscribe now)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    return truncate(summary, 150);
  }

  const fallbackByTag: Record<NewsTag, string> = {
    Injury: `${title} with a direct update on player availability and short-term impact.`,
    'Game Preview': `${title} with matchup context ahead of the next Knicks game.`,
    Postgame: `${title} focused on the biggest takeaway from the latest result.`,
    Rotation: `${title} with clues about roles, minutes, and lineup trust.`,
    'Trade Buzz': `${title} tracking a roster-related storyline around the Knicks.`,
    Playoffs: `${title} with postseason implications for the Knicks' path.`,
    'Off-Court': `${title} covering a Knicks development beyond the game floor.`,
    General: title,
  };

  return truncate(fallbackByTag[article.tag], 150);
}

function deriveWhyItMatters(article: Pick<Article, 'title' | 'description' | 'tag'>): string | null {
  const text = `${article.title} ${article.description}`.toLowerCase();

  if (article.tag === 'Trade Buzz' && !text.includes('trade')) {
    return null;
  }

  if (article.tag === 'General' && !article.description) {
    return null;
  }

  if (article.tag === 'Injury' && /brunson|anunoby|towns|bridges|hart|robinson/.test(text)) {
    return 'A rotation-level injury update matters more when it affects one of the Knicks core pieces.';
  }

  if (article.tag === 'Playoffs' && /seed|standings|play-in|postseason/.test(text)) {
    return 'Seeding movement can change the Knicks matchup path and how much each remaining game matters.';
  }

  return WHY_IT_MATTERS_BY_TAG[article.tag];
}

function scoreArticle(article: Omit<Article, 'score' | 'summary' | 'whyItMatters' | 'deepSummary'>): number {
  const text = `${article.title} ${article.description}`.toLowerCase();
  const hoursAgo = getHoursAgo(article.publishedAt);
  const recencyScore = Math.max(0, 36 - hoursAgo) * 1.2;
  const sourceScore = getSourceWeight(article.source.name);
  const tagScore: Record<NewsTag, number> = {
    Injury: 18,
    'Game Preview': 12,
    Postgame: 14,
    Rotation: 13,
    'Trade Buzz': 4,
    Playoffs: 16,
    'Off-Court': 6,
    General: 8,
  };

  let score = recencyScore + sourceScore + tagScore[article.tag];

  if (text.includes('new york knicks') || text.includes('knicks')) score += 6;
  if (article.image) score += 2;
  if (hasClickbait(text)) score -= 12;
  if (text.includes('opinion') || text.includes('podcast')) score -= 6;
  if (article.tag === 'Trade Buzz' && hasClickbait(text)) score -= 8;

  return Number(score.toFixed(2));
}

function tokens(text: string): Set<string> {
  return new Set(
    normalizeTitle(text)
      .split(' ')
      .filter(token => token.length > 2),
  );
}

function similarity(a: string, b: string): number {
  const aTokens = tokens(a);
  const bTokens = tokens(b);
  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }

  return overlap / Math.max(aTokens.size, bTokens.size);
}

function isValidArticle(article: RawArticle): article is Required<Pick<RawArticle, 'title' | 'url' | 'publishedAt'>> & RawArticle {
  return Boolean(article.title && article.url && article.publishedAt);
}

function curateArticles(rawArticles: RawArticle[]): Article[] {
  const seenUrls = new Set<string>();
  const curated: Article[] = [];

  for (const raw of rawArticles) {
    if (!isValidArticle(raw)) continue;

    const title = cleanText(raw.title);
    if (!title) continue;

    const url = canonicalUrl(raw.url);
    if (seenUrls.has(url)) continue;

    const description = cleanText(raw.description);
    const tag = getTag(`${title} ${description}`);

    const baseArticle = {
      title,
      description,
      url,
      source: { name: cleanText(raw.source?.name) || 'Unknown Source' },
      publishedAt: raw.publishedAt,
      image: raw.image ?? null,
      tag,
    };

    const score = scoreArticle(baseArticle);
    const summary = summarize(baseArticle);
    const whyItMatters = deriveWhyItMatters(baseArticle);

    const candidate: Article = { ...baseArticle, score, summary, whyItMatters };

    const duplicateIndex = curated.findIndex(existing =>
      similarity(existing.title, candidate.title) >= 0.72,
    );

    if (duplicateIndex >= 0) {
      if (candidate.score > curated[duplicateIndex].score) {
        curated[duplicateIndex] = candidate;
      }
      continue;
    }

    seenUrls.add(url);
    curated.push(candidate);
  }

  return curated
    .sort((a, b) => b.score - a.score || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, MAX_CURATED_ARTICLES);
}

function buildTakeaways(articles: Article[]): string[] {
  const takeaways: string[] = [];
  const seenTags = new Set<NewsTag>();

  for (const article of articles) {
    const prefix = article.tag === 'General' ? '' : `${article.tag}: `;
    const base = article.whyItMatters ?? article.deepSummary ?? article.summary;
    if (!base) continue;

    if (seenTags.has(article.tag) && takeaways.length >= 3) continue;

    seenTags.add(article.tag);
    takeaways.push(truncate(`${prefix}${base}`.trim(), 110));

    if (takeaways.length === 5) break;
  }

  return takeaways.slice(0, 5);
}

function extractMetaDescription(html: string): string {
  const patterns = [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return cleanText(match[1]);
  }

  return '';
}

function extractRelevantParagraphText(html: string): string {
  const paragraphMatches = Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi));
  const paragraphs = paragraphMatches
    .map(match => stripHtml(match[1] ?? ''))
    .filter(text => text.length >= 70)
    .filter(text => /knicks|new york|brunson|towns|anunoby|hart|bridges|robinson|thibodeau|playoff|injury|rotation/i.test(text))
    .slice(0, 6);

  return cleanText(paragraphs.join(' '));
}

async function fetchArticleSignals(url: string): Promise<ArticleSignals | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; KnicksHubNewsBot/1.0; +https://knicks-hub.vercel.app)',
      },
      signal: AbortSignal.timeout(ARTICLE_FETCH_TIMEOUT_MS),
      next: { revalidate: NEWS_REVALIDATE_SECONDS },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const metaDescription = extractMetaDescription(html);
    const paragraphText = extractRelevantParagraphText(html);

    if (!metaDescription && !paragraphText) return null;

    return { metaDescription, paragraphText };
  } catch {
    return null;
  }
}

function buildDeepSummary(article: Article, signals: ArticleSignals | null): string | null {
  const candidates = [
    signals?.metaDescription ?? '',
    selectBestSentence(signals?.paragraphText ?? ''),
    article.description,
    article.summary,
  ]
    .map(value => cleanText(value ?? undefined))
    .filter(Boolean);

  const best = candidates.find(candidate => candidate.length >= 55) ?? candidates[0];
  if (!best) return null;

  return truncate(best, 190);
}

const TAG_TO_LABEL: Record<NewsTag, string> = {
  'Injury':       'INJURY',
  'Playoffs':     'STANDINGS',
  'Postgame':     'POSTGAME',
  'Rotation':     'ROSTER',
  'Trade Buzz':   'ROSTER',
  'Game Preview': 'MATCHUP',
  'Off-Court':    'OFF-COURT',
  'General':      'TRENDING',
};

function buildBriefing(articles: Article[]): NewsBriefing | null {
  const pool = articles.filter(a => a.deepSummary || a.summary);
  if (pool.length === 0) return null;

  // Pick up to 3 articles with distinct labels (prefer variety)
  const chosen: Article[] = [];
  const usedLabels = new Set<string>();

  for (const article of pool) {
    if (chosen.length >= 3) break;
    const label = TAG_TO_LABEL[article.tag];
    if (usedLabels.has(label)) continue;
    usedLabels.add(label);
    chosen.push(article);
  }

  // Fill remaining slots with next best if still under 3
  for (const article of pool) {
    if (chosen.length >= 3) break;
    if (!chosen.includes(article)) chosen.push(article);
  }

  const bullets = chosen.slice(0, 3).map(article => ({
    label: TAG_TO_LABEL[article.tag],
    text: truncate(article.deepSummary ?? article.summary, 130),
  }));

  return { bullets, basedOnCount: pool.length };
}

async function enrichArticles(articles: Article[]): Promise<Article[]> {
  if (articles.length === 0) return articles;

  const enrichedTop = await Promise.all(
    articles.slice(0, MAX_DEEP_DIVE_ARTICLES).map(async article => {
      const signals = await fetchArticleSignals(article.url);
      const deepSummary = buildDeepSummary(article, signals);

      if (!deepSummary) return article;

      return {
        ...article,
        deepSummary,
        summary: truncate(deepSummary, 150),
      };
    }),
  );

  return [...enrichedTop, ...articles.slice(MAX_DEEP_DIVE_ARTICLES)];
}

function buildNewsQuery(): string {
  return encodeURIComponent('"New York Knicks" OR Knicks NBA');
}

export async function getKnicksNews(): Promise<{
  articles: Article[];
  takeaways: string[];
  briefing: NewsBriefing | null;
  error?: string;
}> {
  const key = process.env.GNEWS_API_KEY;

  if (!key) {
    return { articles: [], takeaways: [], briefing: null, error: 'no_key' };
  }

  try {
    const url = `https://gnews.io/api/v4/search?q=${buildNewsQuery()}&token=${key}&lang=en&max=${MAX_FETCHED_ARTICLES}`;
    const res = await fetch(url, { next: { revalidate: NEWS_REVALIDATE_SECONDS } });

    if (!res.ok) {
      return { articles: [], takeaways: [], briefing: null, error: `api_error_${res.status}` };
    }

    const data = await res.json();
    const curated = curateArticles(Array.isArray(data.articles) ? data.articles : []);
    const articles = await enrichArticles(curated);

    return {
      articles,
      takeaways: buildTakeaways(articles.slice(0, 6)),
      briefing: buildBriefing(articles),
    };
  } catch {
    return { articles: [], takeaways: [], briefing: null, error: 'fetch_failed' };
  }
}

export const __newsTestUtils = {
  buildBriefing,
  buildDeepSummary,
  buildTakeaways,
  curateArticles,
  deriveWhyItMatters,
  extractMetaDescription,
  extractRelevantParagraphText,
  getTag,
  scoreArticle,
  similarity,
  summarize,
};
