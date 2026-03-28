export interface OllamaOptions {
  baseUrl?: string;
  model?: string;
  temperature?: number;
}

function getOllamaUrl(): string {
  return process.env.NS_OLLAMA_URL || 'http://localhost:11434';
}

function getOllamaModel(): string {
  return process.env.NS_OLLAMA_MODEL || 'qwen3:14b';
}

export async function generate(prompt: string, options: OllamaOptions = {}): Promise<string> {
  const {
    baseUrl = getOllamaUrl(),
    model = getOllamaModel(),
    temperature = 0.1,
  } = options;

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { response: string };
  return data.response;
}

export async function extractStructured(
  html: string,
  schemaOrPrompt: string,
  isSchema: boolean,
  options: OllamaOptions = {},
): Promise<Record<string, unknown>> {
  // Trim HTML to avoid token overflow — keep first 8000 chars
  const trimmedHtml = html.length > 8000 ? html.slice(0, 8000) + '\n[... truncated]' : html;

  let prompt: string;

  if (isSchema) {
    prompt = `You are a data extraction assistant. Extract data from the following HTML according to this JSON schema. Return ONLY valid JSON, no explanations.

Schema:
${schemaOrPrompt}

HTML:
${trimmedHtml}

Return ONLY the JSON object:`;
  } else {
    prompt = `You are a data extraction assistant. Extract data from the following HTML based on this instruction. Return ONLY valid JSON, no explanations.

Instruction: ${schemaOrPrompt}

HTML:
${trimmedHtml}

Return ONLY the JSON object:`;
  }

  const raw = await generate(prompt, options);

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) {
    throw new Error(`Ollama did not return valid JSON. Raw response: ${raw.slice(0, 500)}`);
  }

  try {
    return JSON.parse(jsonMatch[1].trim());
  } catch {
    throw new Error(`Failed to parse JSON from Ollama response: ${jsonMatch[1].slice(0, 500)}`);
  }
}
