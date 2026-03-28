import { loadPage, closeBrowser } from '../browser/playwright.js';
import { takeScreenshot } from '../browser/screenshot.js';
import { extractMarkdown } from '../extractors/markdown.js';
import { extractMetadata } from '../extractors/metadata.js';
import { extractLinks } from '../extractors/links.js';
import { extractPDF } from '../extractors/pdf.js';
import {
  buildOutputPath,
  writeArtifact,
  writeJson,
  writeManifest,
  resolveOutputDir,
  type Manifest,
} from '../storage/writer.js';

export interface ScrapeOptions {
  url: string;
  outputDir?: string;
  screenshot?: boolean;
  keepBrowser?: boolean;
}

export interface ScrapeResult {
  outputPath: string;
  url: string;
  title: string;
  artifacts: string[];
}

function isPDF(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf') || url.includes('.pdf?');
}

export async function scrape(options: ScrapeOptions): Promise<ScrapeResult> {
  const { url, screenshot: doScreenshot = true, keepBrowser = false } = options;
  const startedAt = new Date().toISOString();
  const artifacts: string[] = [];

  const outputDir = resolveOutputDir(options.outputDir);
  const outPath = buildOutputPath({ url, type: 'scrape', outputDir });

  // Handle PDF files
  if (isPDF(url)) {
    console.log(`Detected PDF: ${url}`);
    const pdf = await extractPDF(url);
    artifacts.push(await writeArtifact(outPath, 'page.md', pdf.text));
    artifacts.push(await writeJson(outPath, 'metadata.json', {
      url, title: (pdf.info as Record<string, string>).Title || url, pages: pdf.pages, ...pdf.info,
    }));
    const manifest: Manifest = {
      jobType: 'scrape', url, startedAt,
      finishedAt: new Date().toISOString(), outputPath: outPath,
      artifacts: ['./page.md', './metadata.json'],
    };
    artifacts.push(await writeManifest(outPath, manifest));
    return { outputPath: outPath, url, title: (pdf.info as Record<string, string>).Title || 'PDF', artifacts };
  }

  try {
    const { page, html } = await loadPage(url);

    // Extract markdown
    const mdResult = extractMarkdown(html, url);
    artifacts.push(await writeArtifact(outPath, 'page.md', mdResult.markdown));

    // Save raw HTML
    artifacts.push(await writeArtifact(outPath, 'page.html', html));

    // Extract metadata
    const metadata = extractMetadata(html, url);
    artifacts.push(await writeJson(outPath, 'metadata.json', metadata));

    // Extract links
    const links = extractLinks(html, url);
    artifacts.push(await writeJson(outPath, 'links.json', links));

    // Screenshot
    if (doScreenshot) {
      const shot = await takeScreenshot(page);
      artifacts.push(await writeArtifact(outPath, 'screenshot.png', shot.buffer));
    }

    await page.close();

    // Manifest
    const manifest: Manifest = {
      jobType: 'scrape',
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
      artifacts,
    };
  } finally {
    if (!keepBrowser) {
      await closeBrowser();
    }
  }
}
