import { loadPage, closeBrowser } from '../browser/playwright.js';
import { analyzeUI } from '../extractors/ui-analyzer.js';
import { buildOutputPath, writeJson, writeManifest, resolveOutputDir, type Manifest } from '../storage/writer.js';

export interface UIOptions {
  url: string;
  outputDir?: string;
  keepBrowser?: boolean;
}

export async function ui(options: UIOptions) {
  const { url, keepBrowser = false } = options;
  const startedAt = new Date().toISOString();
  const outputDir = resolveOutputDir(options.outputDir);
  const outPath = buildOutputPath({ url, type: 'ui', outputDir });

  try {
    const { page } = await loadPage(url);
    const data = await analyzeUI(page);
    await page.close();

    await writeJson(outPath, 'ui-analysis.json', data);
    const manifest: Manifest = { jobType: 'ui', url, startedAt, finishedAt: new Date().toISOString(), outputPath: outPath, artifacts: ['./ui-analysis.json'] };
    await writeManifest(outPath, manifest);

    return { outputPath: outPath, url, data };
  } finally {
    if (!keepBrowser) await closeBrowser();
  }
}
