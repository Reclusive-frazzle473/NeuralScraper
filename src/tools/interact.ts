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
  resolveOutputDir,
  type Manifest,
} from '../storage/writer.js';
import type { Page } from 'playwright';

export interface BrowserAction {
  click?: string;
  type?: { selector: string; text: string };
  wait?: number;
  scroll?: 'bottom' | 'top' | number;
  screenshot?: boolean;
  waitForSelector?: string;
}

export interface InteractOptions {
  url: string;
  actions: BrowserAction[];
  outputDir?: string;
  scrapeAfter?: boolean;
}

export interface InteractResult {
  outputPath: string;
  url: string;
  actionsExecuted: number;
  artifacts: string[];
}

async function executeAction(page: Page, action: BrowserAction, outPath: string, artifacts: string[], index: number): Promise<void> {
  if (action.click) {
    console.log(`  Action ${index + 1}: click "${action.click}"`);
    await page.click(action.click, { timeout: 10000 });
  }

  if (action.type) {
    console.log(`  Action ${index + 1}: type in "${action.type.selector}"`);
    await page.fill(action.type.selector, action.type.text);
  }

  if (action.wait) {
    console.log(`  Action ${index + 1}: wait ${action.wait}ms`);
    await page.waitForTimeout(action.wait);
  }

  if (action.scroll) {
    if (action.scroll === 'bottom') {
      console.log(`  Action ${index + 1}: scroll to bottom`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    } else if (action.scroll === 'top') {
      console.log(`  Action ${index + 1}: scroll to top`);
      await page.evaluate(() => window.scrollTo(0, 0));
    } else {
      console.log(`  Action ${index + 1}: scroll ${action.scroll}px`);
      await page.evaluate((y) => window.scrollBy(0, y), action.scroll);
    }
    await page.waitForTimeout(500);
  }

  if (action.waitForSelector) {
    console.log(`  Action ${index + 1}: wait for "${action.waitForSelector}"`);
    await page.waitForSelector(action.waitForSelector, { timeout: 10000 });
  }

  if (action.screenshot) {
    console.log(`  Action ${index + 1}: screenshot`);
    const shot = await takeScreenshot(page);
    artifacts.push(await writeArtifact(outPath, `screenshot-step-${index + 1}.png`, shot.buffer));
  }
}

export async function interact(options: InteractOptions): Promise<InteractResult> {
  const { url, actions, scrapeAfter = true } = options;
  const startedAt = new Date().toISOString();
  const artifacts: string[] = [];

  const outputDir = resolveOutputDir(options.outputDir);
  const outPath = buildOutputPath({ url, type: 'scrape', outputDir });

  try {
    console.log(`Loading ${url}...`);
    const { page } = await loadPage(url);

    // Execute actions
    for (let i = 0; i < actions.length; i++) {
      await executeAction(page, actions[i], outPath, artifacts, i);
    }

    // Scrape after actions
    if (scrapeAfter) {
      console.log('  Scraping final page state...');
      const html = await page.content();

      const mdResult = extractMarkdown(html, url);
      artifacts.push(await writeArtifact(outPath, 'page.md', mdResult.markdown));
      artifacts.push(await writeArtifact(outPath, 'page.html', html));

      const metadata = extractMetadata(html, url);
      artifacts.push(await writeJson(outPath, 'metadata.json', metadata));

      const links = extractLinks(html, url);
      artifacts.push(await writeJson(outPath, 'links.json', links));

      const shot = await takeScreenshot(page);
      artifacts.push(await writeArtifact(outPath, 'screenshot.png', shot.buffer));
    }

    await page.close();

    const manifest: Manifest = {
      jobType: 'interact',
      url,
      startedAt,
      finishedAt: new Date().toISOString(),
      outputPath: outPath,
      artifacts: artifacts.map((a) => a.replace(outPath, '.').replace(/\\/g, '/')),
      settings: { actions, scrapeAfter },
    };
    artifacts.push(await writeManifest(outPath, manifest));

    return {
      outputPath: outPath,
      url,
      actionsExecuted: actions.length,
      artifacts,
    };
  } finally {
    await closeBrowser();
  }
}
