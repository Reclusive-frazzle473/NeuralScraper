import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { readFile } from 'fs/promises';

export interface PDFResult {
  text: string;
  pages: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export async function extractPDF(source: string | Buffer): Promise<PDFResult> {
  let buffer: Buffer;

  if (typeof source === 'string') {
    if (source.startsWith('http://') || source.startsWith('https://')) {
      // Fetch from URL
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      buffer = Buffer.from(await response.arrayBuffer());
    } else {
      // Read from file
      buffer = await readFile(source);
    }
  } else {
    buffer = source;
  }

  const data = await pdfParse(buffer);

  return {
    text: data.text,
    pages: data.numpages,
    info: data.info || {},
    metadata: data.metadata?._metadata || {},
  };
}
