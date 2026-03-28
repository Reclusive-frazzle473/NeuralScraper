import { loadPage, closeBrowser } from '../browser/playwright.js';
import { extractLinks } from '../extractors/links.js';
import {
  buildOutputPath,
  writeJson,
  writeManifest,
  resolveOutputDir,
  type Manifest,
} from '../storage/writer.js';

export interface MapOptions {
  url: string;
  outputDir?: string;
  keepBrowser?: boolean;
}

export interface MapResult {
  outputPath: string;
  url: string;
  totalUrls: number;
}

export async function map(options: MapOptions): Promise<MapResult> {
  const { url, keepBrowser = false } = options;
  const startedAt = new Date().toISOString();

  const outputDir = resolveOutputDir(options.outputDir);
  const outPath = buildOutputPath({ url, type: 'map', outputDir });

  try {
    const { page, html } = await loadPage(url);
    const links = extractLinks(html, url);
    await page.close();

    const internalUrls = links.links
      .filter((l) => l.type === 'internal')
      .map((l) => l.href);

    const mapData = {
      rootUrl: url,
      scannedAt: new Date().toISOString(),
      totalUrls: internalUrls.length,
      urls: internalUrls,
      externalLinks: links.links.filter((l) => l.type === 'external').map((l) => l.href),
    };

    await writeJson(outPath, 'map.json', mapData);

    const manifest: Manifest = {
      jobType: 'map',
      url,
      startedAt,
      finishedAt: new Date().toISOString(),
      outputPath: outPath,
      artifacts: ['./map.json'],
    };
    await writeManifest(outPath, manifest);

    return {
      outputPath: outPath,
      url,
      totalUrls: internalUrls.length,
    };
  } finally {
    if (!keepBrowser) {
      await closeBrowser();
    }
  }
}
