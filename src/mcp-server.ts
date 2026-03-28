import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
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
import { interact, type BrowserAction } from './tools/interact.js';
import { batch } from './tools/batch.js';
import { createAPI } from './api.js';

const server = new McpServer({
  name: 'neuralscraper',
  version: '2.0.0',
});

const jsonResult = (data: Record<string, unknown>) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
});

// --- V1 Tools ---

server.tool(
  'ns_scrape',
  'Scrape a single page: extract markdown, HTML, metadata, links, and screenshot. Also handles PDF files.',
  {
    url: z.string().describe('URL to scrape (web page or PDF)'),
    output_dir: z.string().optional().describe('Output directory'),
    screenshot: z.boolean().default(true).describe('Take screenshot'),
  },
  async ({ url, output_dir, screenshot: doScreenshot }) => {
    const r = await scrape({ url, outputDir: output_dir, screenshot: doScreenshot, keepBrowser: true });
    return jsonResult({ status: 'ok', url: r.url, title: r.title, outputPath: r.outputPath, artifacts: r.artifacts.length });
  },
);

server.tool(
  'ns_screenshot',
  'Take a full-page screenshot of a URL',
  {
    url: z.string().url().describe('URL to screenshot'),
    output_dir: z.string().optional().describe('Output directory'),
  },
  async ({ url, output_dir }) => {
    const r = await screenshot({ url, outputDir: output_dir, keepBrowser: true });
    return jsonResult({ status: 'ok', url: r.url, outputPath: r.outputPath, size: `${r.width}x${r.height}` });
  },
);

server.tool(
  'ns_crawl',
  'Crawl a site: scrape multiple pages with depth and limit control',
  {
    url: z.string().url().describe('Root URL to crawl'),
    output_dir: z.string().optional().describe('Output directory'),
    depth: z.number().default(2).describe('Max crawl depth'),
    limit: z.number().default(20).describe('Max pages'),
    screenshot: z.boolean().default(true).describe('Take screenshots'),
  },
  async ({ url, output_dir, depth, limit, screenshot: doScreenshot }) => {
    const r = await crawl({ url, outputDir: output_dir, depth, limit, screenshot: doScreenshot });
    return jsonResult({ status: 'ok', url: r.url, outputPath: r.outputPath, pagesProcessed: r.pagesProcessed, errors: r.errors });
  },
);

server.tool(
  'ns_map',
  'Discover all internal URLs of a site',
  {
    url: z.string().url().describe('Root URL to map'),
    output_dir: z.string().optional().describe('Output directory'),
  },
  async ({ url, output_dir }) => {
    const r = await map({ url, outputDir: output_dir, keepBrowser: true });
    return jsonResult({ status: 'ok', url: r.url, outputPath: r.outputPath, totalUrls: r.totalUrls });
  },
);

server.tool(
  'ns_ui',
  'Analyze UI: layout structure, components, spacing, typography',
  {
    url: z.string().url().describe('URL to analyze'),
    output_dir: z.string().optional().describe('Output directory'),
  },
  async ({ url, output_dir }) => {
    const r = await ui({ url, outputDir: output_dir, keepBrowser: true });
    return jsonResult({ status: 'ok', url: r.url, outputPath: r.outputPath, layout: r.data.layout.type, components: r.data.components.length });
  },
);

server.tool(
  'ns_brand',
  'Extract branding: dominant colors, fonts, logos',
  {
    url: z.string().url().describe('URL to analyze'),
    output_dir: z.string().optional().describe('Output directory'),
  },
  async ({ url, output_dir }) => {
    const r = await brand({ url, outputDir: output_dir, keepBrowser: true });
    return jsonResult({ status: 'ok', url: r.url, outputPath: r.outputPath, brandName: r.data.brandName, fonts: r.data.fonts.families });
  },
);

server.tool(
  'ns_seo',
  'SEO audit: meta tags, headings, OG tags, schema markup, technical issues',
  {
    url: z.string().url().describe('URL to audit'),
    output_dir: z.string().optional().describe('Output directory'),
  },
  async ({ url, output_dir }) => {
    const r = await seo({ url, outputDir: output_dir, keepBrowser: true });
    return jsonResult({ status: 'ok', url: r.url, outputPath: r.outputPath, score: r.score });
  },
);

server.tool(
  'ns_analyze',
  'Full analysis: scrape + screenshot + UI + brand + SEO — everything in one call',
  {
    url: z.string().url().describe('URL to fully analyze'),
    output_dir: z.string().optional().describe('Output directory'),
  },
  async ({ url, output_dir }) => {
    const r = await analyze({ url, outputDir: output_dir });
    return jsonResult({ status: 'ok', url: r.url, title: r.title, seoScore: r.seoScore, outputPath: r.outputPath, artifacts: r.artifacts.length });
  },
);

// --- V2 Tools ---

server.tool(
  'ns_search',
  'Search the web via SearXNG and scrape the top results',
  {
    query: z.string().describe('Search query'),
    output_dir: z.string().optional().describe('Output directory'),
    limit: z.number().default(5).describe('Max results to scrape'),
    scrape_results: z.boolean().default(true).describe('Scrape each result page'),
  },
  async ({ query, output_dir, limit, scrape_results }) => {
    const r = await search({ query, outputDir: output_dir, limit, scrapeResults: scrape_results });
    return jsonResult({ status: 'ok', query: r.query, outputPath: r.outputPath, resultsFound: r.resultsFound, resultsScraped: r.resultsScraped, errors: r.errors });
  },
);

server.tool(
  'ns_extract',
  'Extract structured data from a page using LLM (Ollama). Provide either a JSON schema or a natural language prompt.',
  {
    url: z.string().describe('URL to extract from'),
    schema: z.string().optional().describe('JSON schema for extraction (e.g. {"price": "string", "name": "string"})'),
    prompt: z.string().optional().describe('Natural language extraction prompt (e.g. "find all product prices")'),
    output_dir: z.string().optional().describe('Output directory'),
  },
  async ({ url, schema, prompt, output_dir }) => {
    const r = await extract({ url, schema, prompt, outputDir: output_dir, keepBrowser: true });
    return jsonResult({ status: 'ok', url: r.url, outputPath: r.outputPath, data: r.data });
  },
);

server.tool(
  'ns_interact',
  'Execute browser actions (click, type, wait, scroll) on a page, then scrape the result',
  {
    url: z.string().url().describe('URL to interact with'),
    actions: z.string().describe('JSON array of actions: [{"click":".btn"}, {"wait":1000}, {"type":{"selector":"#input","text":"hello"}}]'),
    output_dir: z.string().optional().describe('Output directory'),
    scrape_after: z.boolean().default(true).describe('Scrape page after actions'),
  },
  async ({ url, actions: actionsStr, output_dir, scrape_after }) => {
    const actions: BrowserAction[] = JSON.parse(actionsStr);
    const r = await interact({ url, actions, outputDir: output_dir, scrapeAfter: scrape_after });
    return jsonResult({ status: 'ok', url: r.url, outputPath: r.outputPath, actionsExecuted: r.actionsExecuted, artifacts: r.artifacts.length });
  },
);

server.tool(
  'ns_batch',
  'Scrape a list of URLs sequentially',
  {
    urls: z.array(z.string()).describe('Array of URLs to scrape'),
    output_dir: z.string().optional().describe('Output directory'),
    screenshot: z.boolean().default(true).describe('Take screenshots'),
  },
  async ({ urls, output_dir, screenshot: doScreenshot }) => {
    const r = await batch({ urls, outputDir: output_dir, screenshot: doScreenshot });
    return jsonResult({ status: 'ok', outputPath: r.outputPath, totalUrls: r.totalUrls, processed: r.processed, errors: r.errors });
  },
);

// --- Start ---
async function main() {
  // Start HTTP API
  const port = parseInt(process.env.NS_MCP_PORT || '9996');
  await createAPI(port);

  // Start MCP on stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`NeuralScraper MCP server running on stdio + HTTP API on :${port}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
