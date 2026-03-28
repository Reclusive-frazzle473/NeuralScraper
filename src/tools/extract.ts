import { loadPage, closeBrowser } from '../browser/playwright.js';
import { extractStructured } from '../clients/ollama.js';
import {
  buildOutputPath,
  writeJson,
  writeManifest,
  resolveOutputDir,
  type Manifest,
} from '../storage/writer.js';

export interface ExtractOptions {
  url: string;
  schema?: string;
  prompt?: string;
  outputDir?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
  keepBrowser?: boolean;
}

export interface ExtractResult {
  outputPath: string;
  url: string;
  data: Record<string, unknown>;
}

export async function extract(options: ExtractOptions): Promise<ExtractResult> {
  const { url, schema, prompt, keepBrowser = false, ollamaUrl, ollamaModel } = options;

  if (!schema && !prompt) {
    throw new Error('Either --schema or --prompt is required for extract');
  }

  const startedAt = new Date().toISOString();
  const outputDir = resolveOutputDir(options.outputDir);
  const outPath = buildOutputPath({ url, type: 'scrape', outputDir });

  try {
    console.log(`Fetching ${url}...`);
    const { page, html } = await loadPage(url);
    await page.close();

    const schemaOrPrompt = schema || prompt!;
    const isSchema = !!schema;

    console.log(`Extracting with Ollama (${isSchema ? 'schema' : 'prompt'})...`);
    const data = await extractStructured(html, schemaOrPrompt, isSchema, {
      baseUrl: ollamaUrl,
      model: ollamaModel,
    });

    await writeJson(outPath, 'extracted.json', data);

    const manifest: Manifest = {
      jobType: 'extract',
      url,
      startedAt,
      finishedAt: new Date().toISOString(),
      outputPath: outPath,
      artifacts: ['./extracted.json'],
      settings: { schema: schema || null, prompt: prompt || null },
    };
    await writeManifest(outPath, manifest);

    return { outputPath: outPath, url, data };
  } finally {
    if (!keepBrowser) await closeBrowser();
  }
}
