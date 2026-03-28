import Fastify from 'fastify';
import { scrape } from './tools/scrape.js';
import { screenshot } from './tools/screenshot.js';
import { crawl } from './tools/crawl.js';
import { map } from './tools/map.js';
import { ui } from './tools/ui.js';
import { brand } from './tools/brand.js';
import { seo } from './tools/seo.js';
import { analyze } from './tools/analyze.js';
import { search } from './tools/search.js';
import { extract } from './tools/extract.js';
import { interact } from './tools/interact.js';
import { batch } from './tools/batch.js';

export async function createAPI(port: number) {
  const app = Fastify({ logger: false });

  // Health
  app.get('/health', async () => ({
    status: 'ok',
    service: 'neuralscraper',
    version: '2.0.0',
    uptime: process.uptime(),
  }));

  // V1 tools
  app.post('/scrape', async (req) => {
    const { url, output_dir, screenshot: doScreenshot } = req.body as Record<string, unknown>;
    return scrape({ url: url as string, outputDir: output_dir as string, screenshot: doScreenshot as boolean, keepBrowser: true });
  });

  app.post('/screenshot', async (req) => {
    const { url, output_dir } = req.body as Record<string, unknown>;
    return screenshot({ url: url as string, outputDir: output_dir as string, keepBrowser: true });
  });

  app.post('/crawl', async (req) => {
    const { url, output_dir, depth, limit, screenshot: doScreenshot } = req.body as Record<string, unknown>;
    return crawl({ url: url as string, outputDir: output_dir as string, depth: depth as number, limit: limit as number, screenshot: doScreenshot as boolean });
  });

  app.post('/map', async (req) => {
    const { url, output_dir } = req.body as Record<string, unknown>;
    return map({ url: url as string, outputDir: output_dir as string, keepBrowser: true });
  });

  app.post('/ui', async (req) => {
    const { url, output_dir } = req.body as Record<string, unknown>;
    return ui({ url: url as string, outputDir: output_dir as string, keepBrowser: true });
  });

  app.post('/brand', async (req) => {
    const { url, output_dir } = req.body as Record<string, unknown>;
    return brand({ url: url as string, outputDir: output_dir as string, keepBrowser: true });
  });

  app.post('/seo', async (req) => {
    const { url, output_dir } = req.body as Record<string, unknown>;
    return seo({ url: url as string, outputDir: output_dir as string, keepBrowser: true });
  });

  app.post('/analyze', async (req) => {
    const { url, output_dir } = req.body as Record<string, unknown>;
    return analyze({ url: url as string, outputDir: output_dir as string });
  });

  // V2 tools
  app.post('/search', async (req) => {
    const { query, output_dir, limit, scrape_results } = req.body as Record<string, unknown>;
    return search({ query: query as string, outputDir: output_dir as string, limit: limit as number, scrapeResults: scrape_results as boolean });
  });

  app.post('/extract', async (req) => {
    const { url, schema, prompt, output_dir } = req.body as Record<string, unknown>;
    return extract({ url: url as string, schema: schema as string, prompt: prompt as string, outputDir: output_dir as string, keepBrowser: true });
  });

  app.post('/interact', async (req) => {
    const { url, actions, output_dir, scrape_after } = req.body as Record<string, unknown>;
    return interact({ url: url as string, actions: actions as [], outputDir: output_dir as string, scrapeAfter: scrape_after as boolean });
  });

  app.post('/batch', async (req) => {
    const { urls, output_dir, screenshot: doScreenshot } = req.body as Record<string, unknown>;
    return batch({ urls: urls as string[], outputDir: output_dir as string, screenshot: doScreenshot as boolean });
  });

  await app.listen({ port, host: '0.0.0.0' });
  console.error(`NeuralScraper HTTP API running on http://0.0.0.0:${port}`);

  return app;
}
