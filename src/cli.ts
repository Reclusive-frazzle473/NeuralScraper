import { Command } from 'commander';
import { scrape } from './tools/scrape.js';
import { screenshot } from './tools/screenshot.js';
import { crawl } from './tools/crawl.js';
import { map } from './tools/map.js';
import { ui } from './tools/ui.js';
import { brand } from './tools/brand.js';
import { seo } from './tools/seo.js';
import { analyze } from './tools/analyze.js';

const program = new Command();

program
  .name('ns')
  .description('NeuralScraper — web scraping, analysis & content extraction')
  .version('1.0.0');

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

program.parse();
