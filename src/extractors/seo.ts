import * as cheerio from 'cheerio';

export interface SEOAudit {
  score: number;
  url: string;
  findings: SEOFinding[];
  meta: MetaAnalysis;
  headings: HeadingAnalysis;
  images: ImageAnalysis;
  links: LinkAnalysis;
  schema: SchemaAnalysis;
  technical: TechnicalAnalysis;
}

interface SEOFinding {
  severity: 'critical' | 'warning' | 'info' | 'pass';
  category: string;
  message: string;
}

interface MetaAnalysis {
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  canonical: string;
  robots: string;
  ogTags: Record<string, string>;
  twitterTags: Record<string, string>;
}

interface HeadingAnalysis {
  h1Count: number;
  h1Text: string[];
  hierarchy: { tag: string; text: string }[];
  hasProperHierarchy: boolean;
}

interface ImageAnalysis {
  total: number;
  withAlt: number;
  withoutAlt: number;
  missingAltSrcs: string[];
}

interface LinkAnalysis {
  internal: number;
  external: number;
  nofollow: number;
  broken: string[];
}

interface SchemaAnalysis {
  hasSchema: boolean;
  types: string[];
  raw: string[];
}

interface TechnicalAnalysis {
  hasViewport: boolean;
  hasCharset: boolean;
  hasLang: boolean;
  lang: string;
  hasFavicon: boolean;
  hasCanonical: boolean;
  hasRobotsMeta: boolean;
  hasSitemap: boolean;
}

export function auditSEO(html: string, url: string): SEOAudit {
  const $ = cheerio.load(html);
  const findings: SEOFinding[] = [];
  let score = 100;

  const deduct = (points: number, severity: SEOFinding['severity'], category: string, message: string) => {
    score -= points;
    findings.push({ severity, category, message });
  };

  const pass = (category: string, message: string) => {
    findings.push({ severity: 'pass', category, message });
  };

  // --- META ---
  const title = $('title').first().text().trim();
  const titleLength = title.length;
  const description = $('meta[name="description"]').attr('content') || '';
  const descriptionLength = description.length;
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const robots = $('meta[name="robots"]').attr('content') || '';

  if (!title) deduct(15, 'critical', 'meta', 'Missing <title> tag');
  else if (titleLength < 30) deduct(5, 'warning', 'meta', `Title too short (${titleLength} chars, recommend 30-60)`);
  else if (titleLength > 60) deduct(3, 'warning', 'meta', `Title too long (${titleLength} chars, recommend 30-60)`);
  else pass('meta', `Title length OK (${titleLength} chars)`);

  if (!description) deduct(10, 'critical', 'meta', 'Missing meta description');
  else if (descriptionLength < 120) deduct(5, 'warning', 'meta', `Description too short (${descriptionLength} chars, recommend 120-160)`);
  else if (descriptionLength > 160) deduct(3, 'warning', 'meta', `Description too long (${descriptionLength} chars, recommend 120-160)`);
  else pass('meta', `Description length OK (${descriptionLength} chars)`);

  // OG tags
  const ogTags: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    ogTags[$(el).attr('property') || ''] = $(el).attr('content') || '';
  });

  if (!ogTags['og:title']) deduct(5, 'warning', 'social', 'Missing og:title');
  if (!ogTags['og:description']) deduct(5, 'warning', 'social', 'Missing og:description');
  if (!ogTags['og:image']) deduct(5, 'warning', 'social', 'Missing og:image');

  const twitterTags: Record<string, string> = {};
  $('meta[name^="twitter:"]').each((_, el) => {
    twitterTags[$(el).attr('name') || ''] = $(el).attr('content') || '';
  });

  // --- HEADINGS ---
  const h1Elements = $('h1');
  const h1Count = h1Elements.length;
  const h1Text = h1Elements.map((_, el) => $(el).text().trim()).get();
  const hierarchy: { tag: string; text: string }[] = [];

  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    hierarchy.push({
      tag: el.tagName.toLowerCase(),
      text: $(el).text().trim().slice(0, 100),
    });
  });

  if (h1Count === 0) deduct(15, 'critical', 'headings', 'Missing H1 tag');
  else if (h1Count > 1) deduct(5, 'warning', 'headings', `Multiple H1 tags found (${h1Count})`);
  else pass('headings', 'Single H1 tag present');

  // Check hierarchy order
  let hasProperHierarchy = true;
  let lastLevel = 0;
  for (const h of hierarchy) {
    const level = parseInt(h.tag[1]);
    if (level > lastLevel + 1 && lastLevel > 0) {
      hasProperHierarchy = false;
      deduct(3, 'warning', 'headings', `Heading hierarchy skip: ${hierarchy[hierarchy.indexOf(h) - 1]?.tag || 'none'} → ${h.tag}`);
      break;
    }
    lastLevel = level;
  }
  if (hasProperHierarchy && hierarchy.length > 0) pass('headings', 'Heading hierarchy is proper');

  // --- IMAGES ---
  const images = $('img');
  const total = images.length;
  let withAlt = 0;
  let withoutAlt = 0;
  const missingAltSrcs: string[] = [];

  images.each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt !== undefined && alt.trim() !== '') {
      withAlt++;
    } else {
      withoutAlt++;
      missingAltSrcs.push($(el).attr('src') || 'unknown');
    }
  });

  if (withoutAlt > 0) deduct(Math.min(10, withoutAlt * 2), 'warning', 'images', `${withoutAlt}/${total} images missing alt text`);
  else if (total > 0) pass('images', `All ${total} images have alt text`);

  // --- LINKS ---
  const allLinks = $('a[href]');
  let internal = 0;
  let external = 0;
  let nofollow = 0;
  const baseHost = new URL(url).hostname;

  allLinks.each((_, el) => {
    const href = $(el).attr('href') || '';
    const rel = $(el).attr('rel') || '';
    try {
      const linkUrl = new URL(href, url);
      if (linkUrl.hostname === baseHost) internal++;
      else external++;
    } catch {
      internal++; // Relative links
    }
    if (rel.includes('nofollow')) nofollow++;
  });

  // --- SCHEMA ---
  const schemaScripts = $('script[type="application/ld+json"]');
  const schemaTypes: string[] = [];
  const schemaRaw: string[] = [];

  schemaScripts.each((_, el) => {
    const text = $(el).html() || '';
    schemaRaw.push(text.slice(0, 500));
    try {
      const data = JSON.parse(text);
      if (data['@type']) schemaTypes.push(data['@type']);
      if (Array.isArray(data['@graph'])) {
        data['@graph'].forEach((item: Record<string, string>) => {
          if (item['@type']) schemaTypes.push(item['@type']);
        });
      }
    } catch { /* ignore */ }
  });

  if (schemaTypes.length === 0) deduct(5, 'info', 'schema', 'No structured data (JSON-LD) found');
  else pass('schema', `Found schema types: ${schemaTypes.join(', ')}`);

  // --- TECHNICAL ---
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const hasCharset = $('meta[charset]').length > 0 || $('meta[http-equiv="Content-Type"]').length > 0;
  const hasLang = !!$('html').attr('lang');
  const lang = $('html').attr('lang') || '';
  const hasFavicon = $('link[rel="icon"], link[rel="shortcut icon"]').length > 0;
  const hasCanonical = !!canonical;
  const hasRobotsMeta = !!robots;

  if (!hasViewport) deduct(10, 'critical', 'technical', 'Missing viewport meta tag');
  else pass('technical', 'Viewport meta tag present');

  if (!hasCharset) deduct(5, 'warning', 'technical', 'Missing charset declaration');
  if (!hasLang) deduct(5, 'warning', 'technical', 'Missing lang attribute on <html>');
  else pass('technical', `Language declared: ${lang}`);

  if (!hasCanonical) deduct(5, 'warning', 'technical', 'Missing canonical URL');
  if (!hasFavicon) deduct(3, 'info', 'technical', 'No favicon link found');

  score = Math.max(0, score);

  return {
    score,
    url,
    findings,
    meta: { title, titleLength, description, descriptionLength, canonical, robots, ogTags, twitterTags },
    headings: { h1Count, h1Text, hierarchy, hasProperHierarchy },
    images: { total, withAlt, withoutAlt, missingAltSrcs: missingAltSrcs.slice(0, 10) },
    links: { internal, external, nofollow, broken: [] },
    schema: { hasSchema: schemaTypes.length > 0, types: schemaTypes, raw: schemaRaw },
    technical: { hasViewport, hasCharset, hasLang, lang, hasFavicon, hasCanonical, hasRobotsMeta, hasSitemap: false },
  };
}
