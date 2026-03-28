import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

export interface WriteJob {
  url: string;
  type: 'scrape' | 'crawl' | 'map' | 'screenshot' | 'ui' | 'brand' | 'seo' | 'analyze';
  outputDir: string;
}

export interface Manifest {
  jobType: string;
  url: string;
  startedAt: string;
  finishedAt: string;
  outputPath: string;
  artifacts: string[];
  pagesProcessed?: number;
  errors?: number;
  settings?: Record<string, unknown>;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

export function buildOutputPath(job: WriteJob): string {
  const domain = getDomain(job.url);
  const ts = getTimestamp();
  const prefix = job.type === 'crawl' ? `crawl-${ts}` : ts;
  return join(job.outputDir, domain, prefix);
}

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function writeArtifact(dir: string, filename: string, data: string | Buffer): Promise<string> {
  await ensureDir(dir);
  const filepath = join(dir, filename);
  await writeFile(filepath, data, typeof data === 'string' ? 'utf-8' : undefined);
  return filepath;
}

export async function writeManifest(dir: string, manifest: Manifest): Promise<string> {
  return writeArtifact(dir, 'manifest.json', JSON.stringify(manifest, null, 2));
}

export async function writeJson(dir: string, filename: string, data: unknown): Promise<string> {
  return writeArtifact(dir, filename, JSON.stringify(data, null, 2));
}

export function resolveOutputDir(customDir?: string): string {
  return customDir || process.env.NS_OUTPUT_DIR || join(process.cwd(), 'ns-output');
}
