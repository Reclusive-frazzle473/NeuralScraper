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

const server = new McpServer({
  name: 'neuralscraper',
  version: '1.0.0',
});

// --- ns_scrape ---
server.tool(
  'ns_scrape',
  'Scrape a single page: extract markdown, HTML, metadata, links, and screenshot',
  {
    url: z.string().url().describe('URL to scrape'),
    output_dir: z.string().optional().describe('Output directory (default: ./ns-output)'),
    screenshot: z.boolean().default(true).describe('Take screenshot'),
  },
  async ({ url, output_dir, screenshot: doScreenshot }) => {
    const result = await scrape({ url, outputDir: output_dir, screenshot: doScreenshot, keepBrowser: true });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              status: 'ok',
              url: result.url,
              title: result.title,
              outputPath: result.outputPath,
              artifacts: result.artifacts.length,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// --- ns_screenshot ---
server.tool(
  'ns_screenshot',
  'Take a full-page screenshot of a URL',
  {
    url: z.string().url().describe('URL to screenshot'),
    output_dir: z.string().optional().describe('Output directory'),
  },
  async ({ url, output_dir }) => {
    const result = await screenshot({ url, outputDir: output_dir, keepBrowser: true });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            { status: 'ok', url: result.url, outputPath: result.outputPath, size: `${result.width}x${result.height}` },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// --- ns_crawl ---
server.tool(
  'ns_crawl',
  'Crawl a site: scrape multiple pages with depth and limit control',
  {
    url: z.string().url().describe('Root URL to crawl'),
    output_dir: z.string().optional().describe('Output directory'),
    depth: z.number().default(2).describe('Max crawl depth'),
    limit: z.number().default(20).describe('Max pages to process'),
    screenshot: z.boolean().default(true).describe('Take screenshots'),
  },
  async ({ url, output_dir, depth, limit, screenshot: doScreenshot }) => {
    const result = await crawl({ url, outputDir: output_dir, depth, limit, screenshot: doScreenshot });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            { status: 'ok', url: result.url, outputPath: result.outputPath, pagesProcessed: result.pagesProcessed, errors: result.errors },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// --- ns_map ---
server.tool(
  'ns_map',
  'Discover all internal URLs of a site',
  {
    url: z.string().url().describe('Root URL to map'),
    output_dir: z.string().optional().describe('Output directory'),
  },
  async ({ url, output_dir }) => {
    const result = await map({ url, outputDir: output_dir, keepBrowser: true });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            { status: 'ok', url: result.url, outputPath: result.outputPath, totalUrls: result.totalUrls },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// --- ns_ui ---
server.tool(
  'ns_ui',
  'Analyze UI: layout structure, components, spacing, typography',
  {
    url: z.string().url().describe('URL to analyze'),
    output_dir: z.string().optional().describe('Output directory'),
  },
  async ({ url, output_dir }) => {
    const result = await ui({ url, outputDir: output_dir, keepBrowser: true });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            { status: 'ok', url: result.url, outputPath: result.outputPath, layout: result.data.layout.type, components: result.data.components.length },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// --- ns_brand ---
server.tool(
  'ns_brand',
  'Extract branding: dominant colors, fonts, logos',
  {
    url: z.string().url().describe('URL to analyze'),
    output_dir: z.string().optional().describe('Output directory'),
  },
  async ({ url, output_dir }) => {
    const result = await brand({ url, outputDir: output_dir, keepBrowser: true });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            { status: 'ok', url: result.url, outputPath: result.outputPath, brandName: result.data.brandName, fonts: result.data.fonts.families },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// --- ns_seo ---
server.tool(
  'ns_seo',
  'SEO audit: meta tags, headings, OG tags, schema markup, technical issues',
  {
    url: z.string().url().describe('URL to audit'),
    output_dir: z.string().optional().describe('Output directory'),
  },
  async ({ url, output_dir }) => {
    const result = await seo({ url, outputDir: output_dir, keepBrowser: true });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            { status: 'ok', url: result.url, outputPath: result.outputPath, score: result.score },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// --- ns_analyze ---
server.tool(
  'ns_analyze',
  'Full analysis: scrape + screenshot + UI + brand + SEO — everything in one call',
  {
    url: z.string().url().describe('URL to fully analyze'),
    output_dir: z.string().optional().describe('Output directory'),
  },
  async ({ url, output_dir }) => {
    const result = await analyze({ url, outputDir: output_dir });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              status: 'ok',
              url: result.url,
              title: result.title,
              seoScore: result.seoScore,
              outputPath: result.outputPath,
              artifacts: result.artifacts.length,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// --- Start ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('NeuralScraper MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
