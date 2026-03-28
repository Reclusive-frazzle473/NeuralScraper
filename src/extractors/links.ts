import * as cheerio from 'cheerio';

export interface PageLink {
  href: string;
  text: string;
  type: 'internal' | 'external';
  rel: string;
}

export interface LinksResult {
  total: number;
  internal: number;
  external: number;
  links: PageLink[];
}

export function extractLinks(html: string, url: string): LinksResult {
  const $ = cheerio.load(html);
  const baseUrl = new URL(url);
  const seen = new Set<string>();
  const links: PageLink[] = [];

  $('a[href]').each((_, el) => {
    const rawHref = $(el).attr('href');
    if (!rawHref) return;

    let resolved: URL;
    try {
      resolved = new URL(rawHref, url);
    } catch {
      return;
    }

    // Skip non-http
    if (!resolved.protocol.startsWith('http')) return;

    const normalized = resolved.origin + resolved.pathname;
    if (seen.has(normalized)) return;
    seen.add(normalized);

    const isInternal = resolved.hostname === baseUrl.hostname;

    links.push({
      href: resolved.href,
      text: $(el).text().trim().slice(0, 200),
      type: isInternal ? 'internal' : 'external',
      rel: $(el).attr('rel') || '',
    });
  });

  const internal = links.filter((l) => l.type === 'internal').length;

  return {
    total: links.length,
    internal,
    external: links.length - internal,
    links,
  };
}
