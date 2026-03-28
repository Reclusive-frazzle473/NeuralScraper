import { searchWeb, type SearchResult } from '../clients/searxng.js';
import { scrape } from './scrape.js';
import {
  resolveOutputDir,
  ensureDir,
  writeJson,
  writeManifest,
  type Manifest,
} from '../storage/writer.js';
import { join } from 'path';

export interface SearchOptions {
  query: string;
  outputDir?: string;
  limit?: number;
  scrapeResults?: boolean;
  searxngUrl?: string;
}

export interface SearchToolResult {
  outputPath: string;
  query: string;
  resultsFound: number;
  resultsScraped: number;
  errors: number;
}

function slugifyQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export async function search(options: SearchOptions): Promise<SearchToolResult> {
  const {
    query,
    limit = 5,
    scrapeResults = true,
    searxngUrl,
  } = options;
  const startedAt = new Date().toISOString();

  const outputDir = resolveOutputDir(options.outputDir);
  const slug = slugifyQuery(query);
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = join(outputDir, `search-${slug}`, ts);
  await ensureDir(outPath);

  // Search via SearXNG
  console.log(`Searching: "${query}" (limit: ${limit})...`);
  const results = await searchWeb(query, {
    baseUrl: searxngUrl,
    limit,
  });

  console.log(`Found ${results.length} results.`);
  await writeJson(outPath, 'search-results.json', results);

  let scraped = 0;
  let errors = 0;

  // Scrape each result
  if (scrapeResults && results.length > 0) {
    const pagesDir = join(outPath, 'pages');
    await ensureDir(pagesDir);

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      try {
        console.log(`  [${i + 1}/${results.length}] Scraping ${r.url}...`);
        await scrape({
          url: r.url,
          outputDir: pagesDir,
          screenshot: false,
          keepBrowser: true,
        });
        scraped++;
      } catch (err) {
        errors++;
        console.error(`  Error scraping ${r.url}: ${(err as Error).message}`);
      }
    }
  }

  // Manifest
  const manifest: Manifest = {
    jobType: 'search',
    url: query,
    startedAt,
    finishedAt: new Date().toISOString(),
    outputPath: outPath,
    artifacts: ['./search-results.json'],
    pagesProcessed: scraped,
    errors,
    settings: { query, limit, scrapeResults },
  };
  await writeManifest(outPath, manifest);

  return {
    outputPath: outPath,
    query,
    resultsFound: results.length,
    resultsScraped: scraped,
    errors,
  };
}
