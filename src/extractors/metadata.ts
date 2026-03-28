import * as cheerio from 'cheerio';

export interface PageMetadata {
  url: string;
  title: string;
  description: string;
  canonical: string;
  lang: string;
  favicon: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  ogUrl: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  author: string;
  keywords: string[];
  generator: string;
  themeColor: string;
  viewport: string;
}

export function extractMetadata(html: string, url: string): PageMetadata {
  const $ = cheerio.load(html);

  const getMeta = (name: string): string =>
    $(`meta[name="${name}"]`).attr('content') ||
    $(`meta[property="${name}"]`).attr('content') ||
    '';

  const keywords = getMeta('keywords');

  return {
    url,
    title: $('title').first().text().trim(),
    description: getMeta('description'),
    canonical: $('link[rel="canonical"]').attr('href') || '',
    lang: $('html').attr('lang') || '',
    favicon:
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      '/favicon.ico',
    ogTitle: getMeta('og:title'),
    ogDescription: getMeta('og:description'),
    ogImage: getMeta('og:image'),
    ogType: getMeta('og:type'),
    ogUrl: getMeta('og:url'),
    twitterCard: getMeta('twitter:card'),
    twitterTitle: getMeta('twitter:title'),
    twitterDescription: getMeta('twitter:description'),
    twitterImage: getMeta('twitter:image'),
    author: getMeta('author'),
    keywords: keywords ? keywords.split(',').map((k) => k.trim()) : [],
    generator: getMeta('generator'),
    themeColor: getMeta('theme-color'),
    viewport: getMeta('viewport'),
  };
}
