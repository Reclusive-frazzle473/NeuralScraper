export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  engine: string;
}

export interface SearXNGOptions {
  baseUrl?: string;
  limit?: number;
  engines?: string;
  language?: string;
}

function getSearXNGUrl(): string {
  return process.env.NS_SEARXNG_URL || 'http://localhost:8080';
}

export async function searchWeb(
  query: string,
  options: SearXNGOptions = {},
): Promise<SearchResult[]> {
  const {
    baseUrl = getSearXNGUrl(),
    limit = 10,
    engines,
    language = 'en',
  } = options;

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    language,
  });

  if (engines) params.set('engines', engines);

  const url = `${baseUrl}/search?${params.toString()}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`SearXNG error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { results: Array<{ url: string; title: string; content: string; engine: string }> };

  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const r of data.results) {
    if (!r.url || seen.has(r.url)) continue;
    seen.add(r.url);
    results.push({
      url: r.url,
      title: r.title || '',
      snippet: r.content || '',
      engine: r.engine || '',
    });
    if (results.length >= limit) break;
  }

  return results;
}
