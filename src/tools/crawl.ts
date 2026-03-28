import { loadPage, closeBrowser } from '../browser/playwright.js';
import { takeScreenshot } from '../browser/screenshot.js';
import { extractMarkdown } from '../extractors/markdown.js';
import { extractMetadata } from '../extractors/metadata.js';
import { extractLinks } from '../extractors/links.js';
import {
  buildOutputPath,
  writeArtifact,
  writeJson,
  writeManifest,
  ensureDir,
  resolveOutputDir,
  type Manifest,
} from '../storage/writer.js';
import { join } from 'path';

export interface CrawlOptions {
  url: string;
  outputDir?: string;
  depth?: number;
  limit?: number;
  screenshot?: boolean;
}

export interface CrawlResult {
  outputPath: string;
  url: string;
  pagesProcessed: number;
  errors: number;
}

function slugify(url: string, index: number): string {
  const path = new URL(url).pathname.replace(/^\/|\/$/g, '') || 'home';
  const slug = path.replace(/\//g, '-').replace(/[^a-z0-9-]/gi, '').slice(0, 60);
  return `${String(index + 1).padStart(3, '0')}-${slug || 'page'}`;
}

export async function crawl(options: CrawlOptions): Promise<CrawlResult> {
  const {
    url,
    depth = 2,
    limit = 20,
    screenshot: doScreenshot = true,
  } = options;
  const startedAt = new Date().toISOString();

  const outputDir = resolveOutputDir(options.outputDir);
  const outPath = buildOutputPath({ url, type: 'crawl', outputDir });
  const pagesDir = join(outPath, 'pages');
  await ensureDir(pagesDir);

  const visited = new Set<string>();
  const queue: { url: string; currentDepth: number }[] = [{ url, currentDepth: 0 }];
  const baseHost = new URL(url).hostname;
  let processed = 0;
  let errors = 0;
  const pageManifests: { url: string; slug: string; status: string }[] = [];

  while (queue.length > 0 && processed < limit) {
    const item = queue.shift()!;
    const normalized = new URL(item.url).origin + new URL(item.url).pathname;

    if (visited.has(normalized)) continue;
    visited.add(normalized);

    const slug = slugify(item.url, processed);
    const pageDir = join(pagesDir, slug);

    try {
      console.log(`[${processed + 1}/${limit}] ${item.url}`);
      const { page, html } = await loadPage(item.url);

      // Extract all data
      const mdResult = extractMarkdown(html, item.url);
      await writeArtifact(pageDir, 'page.md', mdResult.markdown);
      await writeArtifact(pageDir, 'page.html', html);

      const metadata = extractMetadata(html, item.url);
      await writeJson(pageDir, 'metadata.json', metadata);

      const links = extractLinks(html, item.url);
      await writeJson(pageDir, 'links.json', links);

      if (doScreenshot) {
        const shot = await takeScreenshot(page);
        await writeArtifact(pageDir, 'screenshot.png', shot.buffer);
      }

      await page.close();

      pageManifests.push({ url: item.url, slug, status: 'ok' });
      processed++;

      // Queue internal links for next depth
      if (item.currentDepth < depth) {
        for (const link of links.links) {
          if (link.type === 'internal') {
            const linkHost = new URL(link.href).hostname;
            if (linkHost === baseHost && !visited.has(new URL(link.href).origin + new URL(link.href).pathname)) {
              queue.push({ url: link.href, currentDepth: item.currentDepth + 1 });
            }
          }
        }
      }
    } catch (err) {
      errors++;
      pageManifests.push({ url: item.url, slug, status: `error: ${(err as Error).message}` });
      console.error(`  Error: ${(err as Error).message}`);
    }
  }

  // Write crawl manifest
  const manifest: Manifest = {
    jobType: 'crawl',
    url,
    startedAt,
    finishedAt: new Date().toISOString(),
    outputPath: outPath,
    artifacts: pageManifests.map((p) => `./pages/${p.slug}/`),
    pagesProcessed: processed,
    errors,
    settings: { depth, limit, screenshot: doScreenshot },
  };
  await writeManifest(outPath, manifest);
  await writeJson(outPath, 'pages.json', pageManifests);

  await closeBrowser();

  return { outputPath: outPath, url, pagesProcessed: processed, errors };
}
