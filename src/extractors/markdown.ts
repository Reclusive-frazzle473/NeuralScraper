import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// Keep images with alt text
turndown.addRule('images', {
  filter: 'img',
  replacement(_content, node) {
    const el = node as HTMLImageElement;
    const alt = el.getAttribute('alt') || '';
    const src = el.getAttribute('src') || '';
    return src ? `![${alt}](${src})` : '';
  },
});

export interface MarkdownResult {
  markdown: string;
  title: string;
  excerpt: string;
  byline: string;
  length: number;
}

export function extractMarkdown(html: string, url: string): MarkdownResult {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    // Fallback: convert raw body
    const fallbackDom = new JSDOM(html, { url });
    const body = fallbackDom.window.document.body;
    const markdown = turndown.turndown(body?.innerHTML || html);
    return {
      markdown,
      title: fallbackDom.window.document.title || '',
      excerpt: '',
      byline: '',
      length: markdown.length,
    };
  }

  const markdown = turndown.turndown(article.content);
  return {
    markdown,
    title: article.title,
    excerpt: article.excerpt || '',
    byline: article.byline || '',
    length: article.length,
  };
}
