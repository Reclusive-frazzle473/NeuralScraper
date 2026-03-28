import type { Page } from 'playwright';

export interface ScreenshotData {
  buffer: Buffer;
  width: number;
  height: number;
}

export async function takeScreenshot(page: Page, fullPage = true): Promise<ScreenshotData> {
  const viewport = page.viewportSize() || { width: 1440, height: 900 };

  const buffer = Buffer.from(
    await page.screenshot({
      fullPage,
      type: 'png',
    }),
  );

  // Get actual page dimensions if fullPage
  let height = viewport.height;
  if (fullPage) {
    height = await page.evaluate(() => document.documentElement.scrollHeight);
  }

  return {
    buffer,
    width: viewport.width,
    height,
  };
}
