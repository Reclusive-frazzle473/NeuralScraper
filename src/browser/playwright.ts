import { chromium, type Browser, type Page } from 'playwright';

let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance && browserInstance.isConnected()) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function loadPage(url: string): Promise<{ page: Page; html: string }> {
  const browser = await getBrowser();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  });

  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  const html = await page.content();
  return { page, html };
}

export async function withPage<T>(
  url: string,
  fn: (page: Page, html: string) => Promise<T>,
): Promise<T> {
  const { page, html } = await loadPage(url);
  try {
    return await fn(page, html);
  } finally {
    await page.close();
  }
}
