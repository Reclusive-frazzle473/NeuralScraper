import { loadPage, closeBrowser } from '../browser/playwright.js';
import { auditSEO } from '../extractors/seo.js';
import { buildOutputPath, writeJson, writeManifest, resolveOutputDir, type Manifest } from '../storage/writer.js';

export interface SEOOptions {
  url: string;
  outputDir?: string;
  keepBrowser?: boolean;
}

export async function seo(options: SEOOptions) {
  const { url, keepBrowser = false } = options;
  const startedAt = new Date().toISOString();
  const outputDir = resolveOutputDir(options.outputDir);
  const outPath = buildOutputPath({ url, type: 'seo', outputDir });

  try {
    const { page, html } = await loadPage(url);
    await page.close();

    const data = auditSEO(html, url);
    await writeJson(outPath, 'seo-audit.json', data);
    const manifest: Manifest = { jobType: 'seo', url, startedAt, finishedAt: new Date().toISOString(), outputPath: outPath, artifacts: ['./seo-audit.json'] };
    await writeManifest(outPath, manifest);

    return { outputPath: outPath, url, score: data.score, data };
  } finally {
    if (!keepBrowser) await closeBrowser();
  }
}
