import { loadPage, closeBrowser } from '../browser/playwright.js';
import { takeScreenshot } from '../browser/screenshot.js';
import {
  buildOutputPath,
  writeArtifact,
  writeManifest,
  resolveOutputDir,
  type Manifest,
} from '../storage/writer.js';

export interface ScreenshotOptions {
  url: string;
  outputDir?: string;
  fullPage?: boolean;
  keepBrowser?: boolean;
}

export interface ScreenshotResult {
  outputPath: string;
  url: string;
  width: number;
  height: number;
}

export async function screenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
  const { url, fullPage = true, keepBrowser = false } = options;
  const startedAt = new Date().toISOString();

  const outputDir = resolveOutputDir(options.outputDir);
  const outPath = buildOutputPath({ url, type: 'screenshot', outputDir });

  try {
    const { page } = await loadPage(url);
    const shot = await takeScreenshot(page, fullPage);

    const artifacts: string[] = [];
    artifacts.push(await writeArtifact(outPath, 'screenshot.png', shot.buffer));

    const manifest: Manifest = {
      jobType: 'screenshot',
      url,
      startedAt,
      finishedAt: new Date().toISOString(),
      outputPath: outPath,
      artifacts: ['./screenshot.png'],
    };
    artifacts.push(await writeManifest(outPath, manifest));

    await page.close();

    return {
      outputPath: outPath,
      url,
      width: shot.width,
      height: shot.height,
    };
  } finally {
    if (!keepBrowser) {
      await closeBrowser();
    }
  }
}
