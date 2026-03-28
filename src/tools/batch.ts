import { readFile } from 'fs/promises';
import { scrape } from './scrape.js';
import {
  resolveOutputDir,
  ensureDir,
  writeJson,
  writeManifest,
  type Manifest,
} from '../storage/writer.js';
import { join } from 'path';

export interface BatchOptions {
  file?: string;
  urls?: string[];
  outputDir?: string;
  screenshot?: boolean;
}

export interface BatchResult {
  outputPath: string;
  totalUrls: number;
  processed: number;
  errors: number;
}

export async function batch(options: BatchOptions): Promise<BatchResult> {
  const { screenshot = true } = options;
  const startedAt = new Date().toISOString();

  let urls: string[];

  if (options.urls && options.urls.length > 0) {
    urls = options.urls;
  } else if (options.file) {
    const content = await readFile(options.file, 'utf-8');
    urls = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.startsWith('http'));
  } else {
    throw new Error('Either --file or urls array is required');
  }

  const outputDir = resolveOutputDir(options.outputDir);
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = join(outputDir, `batch-${ts}`);
  await ensureDir(outPath);

  let processed = 0;
  let errors = 0;
  const results: { url: string; status: string; outputPath?: string }[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      console.log(`[${i + 1}/${urls.length}] ${url}`);
      const result = await scrape({
        url,
        outputDir: join(outPath, 'pages'),
        screenshot,
        keepBrowser: true,
      });
      processed++;
      results.push({ url, status: 'ok', outputPath: result.outputPath });
    } catch (err) {
      errors++;
      results.push({ url, status: `error: ${(err as Error).message}` });
      console.error(`  Error: ${(err as Error).message}`);
    }
  }

  await writeJson(outPath, 'batch-results.json', results);

  const manifest: Manifest = {
    jobType: 'batch',
    url: options.file || 'url-list',
    startedAt,
    finishedAt: new Date().toISOString(),
    outputPath: outPath,
    artifacts: ['./batch-results.json'],
    pagesProcessed: processed,
    errors,
    settings: { totalUrls: urls.length, screenshot },
  };
  await writeManifest(outPath, manifest);

  return { outputPath: outPath, totalUrls: urls.length, processed, errors };
}
