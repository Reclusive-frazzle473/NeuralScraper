import { loadPage, closeBrowser } from '../browser/playwright.js';
import { takeScreenshot } from '../browser/screenshot.js';
import { extractMarkdown } from '../extractors/markdown.js';
import { extractMetadata } from '../extractors/metadata.js';
import { extractLinks } from '../extractors/links.js';
import { analyzeUI } from '../extractors/ui-analyzer.js';
import { extractBrand } from '../extractors/brand.js';
import { auditSEO } from '../extractors/seo.js';
import {
  buildOutputPath,
  writeArtifact,
  writeJson,
  writeManifest,
  resolveOutputDir,
  type Manifest,
} from '../storage/writer.js';

export interface AnalyzeOptions {
  url: string;
  outputDir?: string;
}

export interface AnalyzeResult {
  outputPath: string;
  url: string;
  title: string;
  seoScore: number;
  artifacts: string[];
}

export async function analyze(options: AnalyzeOptions): Promise<AnalyzeResult> {
  const { url } = options;
  const startedAt = new Date().toISOString();
  const artifacts: string[] = [];

  const outputDir = resolveOutputDir(options.outputDir);
  const outPath = buildOutputPath({ url, type: 'analyze', outputDir });

  try {
    const { page, html } = await loadPage(url);

    // Scrape
    const mdResult = extractMarkdown(html, url);
    artifacts.push(await writeArtifact(outPath, 'page.md', mdResult.markdown));
    artifacts.push(await writeArtifact(outPath, 'page.html', html));

    const metadata = extractMetadata(html, url);
    artifacts.push(await writeJson(outPath, 'metadata.json', metadata));

    const links = extractLinks(html, url);
    artifacts.push(await writeJson(outPath, 'links.json', links));

    // Screenshot
    const shot = await takeScreenshot(page);
    artifacts.push(await writeArtifact(outPath, 'screenshot.png', shot.buffer));

    // UI Analysis (needs page for computed styles)
    const uiData = await analyzeUI(page);
    artifacts.push(await writeJson(outPath, 'ui-analysis.json', uiData));

    // Brand (needs page for computed styles)
    const brandData = await extractBrand(page);
    artifacts.push(await writeJson(outPath, 'brand.json', brandData));

    await page.close();

    // SEO (uses cheerio, no page needed)
    const seoData = auditSEO(html, url);
    artifacts.push(await writeJson(outPath, 'seo-audit.json', seoData));

    // Manifest
    const manifest: Manifest = {
      jobType: 'analyze',
      url,
      startedAt,
      finishedAt: new Date().toISOString(),
      outputPath: outPath,
      artifacts: artifacts.map((a) => a.replace(outPath, '.').replace(/\\/g, '/')),
    };
    artifacts.push(await writeManifest(outPath, manifest));

    return {
      outputPath: outPath,
      url,
      title: mdResult.title || metadata.title,
      seoScore: seoData.score,
      artifacts,
    };
  } finally {
    await closeBrowser();
  }
}
