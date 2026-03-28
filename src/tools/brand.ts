import { loadPage, closeBrowser } from '../browser/playwright.js';
import { extractBrand } from '../extractors/brand.js';
import { buildOutputPath, writeJson, writeManifest, resolveOutputDir, type Manifest } from '../storage/writer.js';

export interface BrandOptions {
  url: string;
  outputDir?: string;
  keepBrowser?: boolean;
}

export async function brand(options: BrandOptions) {
  const { url, keepBrowser = false } = options;
  const startedAt = new Date().toISOString();
  const outputDir = resolveOutputDir(options.outputDir);
  const outPath = buildOutputPath({ url, type: 'brand', outputDir });

  try {
    const { page } = await loadPage(url);
    const data = await extractBrand(page);
    await page.close();

    await writeJson(outPath, 'brand.json', data);
    const manifest: Manifest = { jobType: 'brand', url, startedAt, finishedAt: new Date().toISOString(), outputPath: outPath, artifacts: ['./brand.json'] };
    await writeManifest(outPath, manifest);

    return { outputPath: outPath, url, data };
  } finally {
    if (!keepBrowser) await closeBrowser();
  }
}
