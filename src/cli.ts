import { Command } from 'commander';
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

const program = new Command();

program
  .name('ns')
  .description('NeuralScraper — web scraping, analysis & content extraction')
  .version('2.0.0');

program
  .command('scrape')
  .description('Scrape a single page: markdown, HTML, metadata, links, screenshot')
  .argument('<url>', 'URL to scrape')
  .option('-o, --output <dir>', 'Output directory', undefined)
  .option('--no-screenshot', 'Skip screenshot')
  .action(async (url: string, opts: { output?: string; screenshot: boolean }) => {
    try {
      console.log(`Scraping ${url}...`);
      const result = await scrape({ url, outputDir: opts.output, screenshot: opts.screenshot });
      console.log(`Done! Output: ${result.outputPath}`);
      console.log(`Title: ${result.title}`);
      console.log(`Artifacts: ${result.artifacts.length} files`);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('screenshot')
  .description('Take a full-page screenshot')
  .argument('<url>', 'URL to screenshot')
  .option('-o, --output <dir>', 'Output directory', undefined)
  .action(async (url: string, opts: { output?: string }) => {
    try {
      console.log(`Screenshotting ${url}...`);
      const result = await screenshot({ url, outputDir: opts.output });
      console.log(`Done! Output: ${result.outputPath}`);
      console.log(`Size: ${result.width}x${result.height}`);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('crawl')
  .description('Crawl a site: scrape multiple pages')
  .argument('<url>', 'Root URL to crawl')
  .option('-o, --output <dir>', 'Output directory', undefined)
  .option('-d, --depth <n>', 'Max crawl depth', '2')
  .option('-l, --limit <n>', 'Max pages to process', '20')
  .option('--no-screenshot', 'Skip screenshots')
  .action(async (url: string, opts: { output?: string; depth: string; limit: string; screenshot: boolean }) => {
    try {
      console.log(`Crawling ${url} (depth: ${opts.depth}, limit: ${opts.limit})...`);
      const result = await crawl({
        url,
        outputDir: opts.output,
        depth: parseInt(opts.depth),
        limit: parseInt(opts.limit),
        screenshot: opts.screenshot,
      });
      console.log(`Done! Output: ${result.outputPath}`);
      console.log(`Pages: ${result.pagesProcessed}, Errors: ${result.errors}`);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('map')
  .description('Discover all internal URLs of a site')
  .argument('<url>', 'Root URL to map')
  .option('-o, --output <dir>', 'Output directory', undefined)
  .action(async (url: string, opts: { output?: string }) => {
    try {
      console.log(`Mapping ${url}...`);
      const result = await map({ url, outputDir: opts.output });
      console.log(`Done! Output: ${result.outputPath}`);
      console.log(`URLs found: ${result.totalUrls}`);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('ui')
  .description('Analyze UI: layout, components, spacing, fonts')
  .argument('<url>', 'URL to analyze')
  .option('-o, --output <dir>', 'Output directory', undefined)
  .action(async (url: string, opts: { output?: string }) => {
    try {
      console.log(`Analyzing UI of ${url}...`);
      const result = await ui({ url, outputDir: opts.output });
      console.log(`Done! Output: ${result.outputPath}`);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('brand')
  .description('Extract branding: colors, fonts, logos')
  .argument('<url>', 'URL to analyze')
  .option('-o, --output <dir>', 'Output directory', undefined)
  .action(async (url: string, opts: { output?: string }) => {
    try {
      console.log(`Extracting brand from ${url}...`);
      const result = await brand({ url, outputDir: opts.output });
      console.log(`Done! Output: ${result.outputPath}`);
      console.log(`Brand: ${result.data.brandName}`);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('seo')
  .description('SEO audit: meta tags, headings, OG, schema, technical')
  .argument('<url>', 'URL to audit')
  .option('-o, --output <dir>', 'Output directory', undefined)
  .action(async (url: string, opts: { output?: string }) => {
    try {
      console.log(`Auditing SEO of ${url}...`);
      const result = await seo({ url, outputDir: opts.output });
      console.log(`Done! Output: ${result.outputPath}`);
      console.log(`SEO Score: ${result.score}/100`);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Full analysis: scrape + screenshot + UI + brand + SEO')
  .argument('<url>', 'URL to analyze')
  .option('-o, --output <dir>', 'Output directory', undefined)
  .action(async (url: string, opts: { output?: string }) => {
    try {
      console.log(`Full analysis of ${url}...`);
      const result = await analyze({ url, outputDir: opts.output });
      console.log(`Done! Output: ${result.outputPath}`);
      console.log(`Title: ${result.title}`);
      console.log(`SEO Score: ${result.seoScore}/100`);
      console.log(`Artifacts: ${result.artifacts.length} files`);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

// --- V2 Commands ---

program
  .command('search')
  .description('Search the web via SearXNG and scrape top results')
  .argument('<query>', 'Search query')
  .option('-o, --output <dir>', 'Output directory', undefined)
  .option('-l, --limit <n>', 'Max results to scrape', '5')
  .option('--no-scrape', 'Only search, do not scrape results')
  .action(async (query: string, opts: { output?: string; limit: string; scrape: boolean }) => {
    try {
      console.log(`Searching: "${query}" (limit: ${opts.limit})...`);
      const result = await search({
        query,
        outputDir: opts.output,
        limit: parseInt(opts.limit),
        scrapeResults: opts.scrape,
      });
      console.log(`Done! Output: ${result.outputPath}`);
      console.log(`Found: ${result.resultsFound}, Scraped: ${result.resultsScraped}, Errors: ${result.errors}`);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('extract')
  .description('Extract structured data from a page using LLM (Ollama)')
  .argument('<url>', 'URL to extract from')
  .option('-o, --output <dir>', 'Output directory', undefined)
  .option('-s, --schema <json>', 'JSON schema for extraction')
  .option('-p, --prompt <text>', 'Natural language extraction prompt')
  .action(async (url: string, opts: { output?: string; schema?: string; prompt?: string }) => {
    try {
      console.log(`Extracting from ${url}...`);
      const result = await extract({ url, outputDir: opts.output, schema: opts.schema, prompt: opts.prompt });
      console.log(`Done! Output: ${result.outputPath}`);
      console.log(`Extracted data:`);
      console.log(JSON.stringify(result.data, null, 2));
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('interact')
  .description('Execute browser actions on a page, then scrape')
  .argument('<url>', 'URL to interact with')
  .option('-o, --output <dir>', 'Output directory', undefined)
  .option('-a, --actions <json>', 'JSON array of actions', '[]')
  .option('--no-scrape-after', 'Skip scraping after actions')
  .action(async (url: string, opts: { output?: string; actions: string; scrapeAfter: boolean }) => {
    try {
      const actions: BrowserAction[] = JSON.parse(opts.actions);
      console.log(`Interacting with ${url} (${actions.length} actions)...`);
      const result = await interact({ url, actions, outputDir: opts.output, scrapeAfter: opts.scrapeAfter });
      console.log(`Done! Output: ${result.outputPath}`);
      console.log(`Actions executed: ${result.actionsExecuted}, Artifacts: ${result.artifacts.length}`);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command('batch')
  .description('Scrape a list of URLs from a file')
  .argument('<file>', 'File with URLs (one per line)')
  .option('-o, --output <dir>', 'Output directory', undefined)
  .option('--no-screenshot', 'Skip screenshots')
  .action(async (file: string, opts: { output?: string; screenshot: boolean }) => {
    try {
      console.log(`Batch processing URLs from ${file}...`);
      const result = await batch({ file, outputDir: opts.output, screenshot: opts.screenshot });
      console.log(`Done! Output: ${result.outputPath}`);
      console.log(`Total: ${result.totalUrls}, Processed: ${result.processed}, Errors: ${result.errors}`);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse();
