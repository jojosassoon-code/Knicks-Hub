// lib/news.ts
// Fetches Knicks headlines from GNews API.
// Cache for 1 hour (3600 seconds) — news changes more often than standings.

export type Article = {
  title: string;
  description: string;
  url: string;
  source: { name: string };
  publishedAt: string;
  image: string | null;
};

export async function getKnicksNews(): Promise<{ articles: Article[]; error?: string }> {
  const key = process.env.GNEWS_API_KEY;

  if (!key) {
    return { articles: [], error: 'no_key' };
  }

  try {
    const url = `https://gnews.io/api/v4/search?q=New+York+Knicks&token=${key}&lang=en&max=10`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      return { articles: [], error: `api_error_${res.status}` };
    }

    const data = await res.json();
    return { articles: data.articles ?? [] };
  } catch {
    return { articles: [], error: 'fetch_failed' };
  }
}
