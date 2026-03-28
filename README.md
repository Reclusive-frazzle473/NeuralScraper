<div align="center">

# NeuralScraper v1.0

**Web scraping, analysis & content extraction for AI agents.**

Scrape pages, crawl sites, extract UI/brand/SEO data.
MCP server + CLI. Local-first, self-hosted.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-0D1117?style=flat-square&logo=typescript&logoColor=3178C6)
![License](https://img.shields.io/badge/License-MIT-0D1117?style=flat-square&logo=opensourceinitiative&logoColor=4CAF50)
![MCP](https://img.shields.io/badge/MCP-Compliant-0D1117?style=flat-square&logo=anthropic&logoColor=9F7AEA)

</div>

---

> **Part of the Neural\* ecosystem.**
> NeuralScraper handles web scraping & analysis — but it doesn't work alone.
> It pairs with **NeuralVaultCore** (persistent memory), **NeuralVaultSkill** (session automation), and **NeuralVaultFlow** (dev workflow orchestration).
> Each component has its own repository and documentation. See the [Neural\* Ecosystem](#neural-ecosystem) section at the bottom.

---

## What It Does

NeuralScraper gives AI agents (and humans) a clean, structured way to extract data from the web — no fluff, no cloud dependency.

| Capability | Description |
|---|---|
| **Scrape** | Extract markdown, HTML, metadata, links & screenshot from any page |
| **Crawl** | Multi-page scraping with depth and limit control |
| **Map** | Fast internal URL discovery across a domain |
| **Screenshot** | Full-page PNG capture |
| **UI Analysis** | Layout structure, components, spacing, typography |
| **Brand Extraction** | Dominant colors, fonts, logos |
| **SEO Audit** | Meta tags, headings, OG, schema markup, scoring |
| **Full Analyze** | Everything above in a single command |

---

## Installation

### Option 1 — Local (recommended)

```bash
git clone https://github.com/getobyte/NeuralScraper.git
cd NeuralScraper
npm install
npx playwright install chromium
npm run build
```

Make the CLI globally available:

```bash
npm link
```

Start the MCP server:

```bash
node dist/mcp-server.js
```

---

### Option 2 — Docker (homelab)

```bash
git clone https://github.com/getobyte/NeuralScraper.git
cd NeuralScraper
cp .env.example .env
docker compose up -d
```

MCP server starts on port `9996` inside container `NeuralScraper`.

Verify:

```bash
docker ps | grep NeuralScraper
docker logs NeuralScraper
```

---

## Connecting to Claude Code

Add to `~/.claude.json` or `.claude/settings.json` in your project:

```json
{
  "mcpServers": {
    "neuralscraper": {
      "command": "node",
      "args": ["D:/path/to/NeuralScraper/dist/mcp-server.js"]
    }
  }
}
```

Restart Claude Code. The following tools will be available:

`ns_scrape` · `ns_crawl` · `ns_map` · `ns_screenshot` · `ns_ui` · `ns_brand` · `ns_seo` · `ns_analyze`

All tools accept a `url` (required) and `output_dir` (optional) parameter.

---

## Using with Ollama (Local LLM)

Don't want to use Claude Code? NeuralScraper's MCP server works with any MCP-compatible client — including setups powered by **Ollama** and a local model.

### Step 1 — Install Ollama

**Windows / macOS:**
Download the installer from [ollama.com/download](https://ollama.com/download) and run it.

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Verify the install:
```bash
ollama --version
```

---

### Step 2 — Pull the recommended model

For MCP tool use, you need a model that supports function calling.
These two work well with NeuralScraper:

| Model | Size | When to use |
|---|---|---|
| `qwen2.5:14b` | ~9 GB | **Recommended** — best tool use accuracy |
| `llama3.1:8b` | ~5 GB | Lightweight — if VRAM is limited |

```bash
# Recommended
ollama pull qwen2.5:14b

# Lightweight alternative
ollama pull llama3.1:8b
```

Start the model:
```bash
ollama run qwen2.5:14b
```

> Ollama runs as a local API server on `http://localhost:11434` by default.
> No internet required after the initial pull.

---

### Step 3 — Connect NeuralScraper

Make sure NeuralScraper's MCP server is running (see [Installation](#installation)).

Then configure your MCP-compatible client (Open WebUI, AnythingLLM, LM Studio, etc.) to point to:

```
stdio: node /path/to/NeuralScraper/dist/mcp-server.js
```

Or, if using a client that supports direct MCP config (like **OpenCode**):

```json
{
  "mcpServers": {
    "neuralscraper": {
      "command": "node",
      "args": ["/path/to/NeuralScraper/dist/mcp-server.js"]
    }
  }
}
```

Once connected, the tools `ns_scrape`, `ns_crawl`, `ns_map`, `ns_screenshot`, `ns_ui`, `ns_brand`, `ns_seo`, `ns_analyze` are available to your local model.

> **Note:** Tool use quality depends on the model. `qwen2.5:14b` handles multi-step scrape+analyze flows reliably. Smaller models may need more explicit prompting.

---

## CLI Usage

```bash
# Scrape a page
ns scrape https://example.com

# Take a screenshot
ns screenshot https://example.com

# Crawl a site
ns crawl https://example.com --depth 2 --limit 20

# Discover URLs
ns map https://example.com

# UI analysis
ns ui https://example.com

# Brand extraction
ns brand https://example.com

# SEO audit
ns seo https://example.com

# Full analysis (everything at once)
ns analyze https://example.com
```

### CLI Options

| Option | Description |
|---|---|
| `-o, --output <dir>` | Custom output directory |
| `-d, --depth <n>` | Crawl depth (default: 2) |
| `-l, --limit <n>` | Max pages (default: 20) |
| `--no-screenshot` | Skip screenshots |

---

## Output Structure

Single page scrape:

```
ns-output/
  example.com/
    2026-03-28T14-30-00/
      page.md
      page.html
      metadata.json
      links.json
      screenshot.png
      ui-analysis.json
      brand.json
      seo-audit.json
      manifest.json
```

Crawl job:

```
ns-output/
  example.com/
    crawl-2026-03-28T14-30-00/
      manifest.json
      pages.json
      pages/
        001-home/
        002-about/
        ...
```

---

## Architecture

```
src/
  browser/
    playwright.ts        # Browser pool management
    screenshot.ts        # Full-page screenshot
  extractors/
    markdown.ts          # HTML → Markdown (readability + turndown)
    metadata.ts          # Meta tags, OG, Twitter cards
    links.ts             # Link extraction & classification
    ui-analyzer.ts       # Layout, components, spacing, fonts
    brand.ts             # Colors, fonts, logos
    seo.ts               # SEO audit with scoring
  storage/
    writer.ts            # File output & manifest generation
  tools/
    scrape.ts
    screenshot.ts
    crawl.ts
    map.ts
    ui.ts
    brand.ts
    seo.ts
    analyze.ts
  cli.ts                 # CLI entry point (commander)
  mcp-server.ts          # MCP server entry point (stdio)
  index.ts               # Library exports
```

---

## Stack

| | |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript 5.8 |
| Browser | Playwright (Chromium) |
| HTML → MD | @mozilla/readability + turndown |
| HTML parsing | cheerio |
| MCP | @modelcontextprotocol/sdk |
| CLI | commander |
| Build | tsup |

---

## Neural\* Ecosystem

NeuralScraper is a standalone tool — but it's designed to work alongside the rest of the Neural\* family. Each component lives in its own repo with its own docs.

| Component | Role | Repo |
|---|---|---|
| **NeuralScraper** *(you are here)* | Web scraping & analysis | — |
| **NeuralVaultCore** | Persistent memory for AI agents | [→ GitHub](https://github.com/getobyte/NeuralVaultCore) |
| **NeuralVaultSkill** | Session memory automation | [→ GitHub](https://github.com/getobyte/NeuralVaultSkill) |
| **NeuralVaultFlow** | Dev workflow orchestration | [→ GitHub](https://github.com/getobyte/NeuralVaultFlow) |

---

<div align="center">

**NeuralScraper v1.0** — Cyber-Draco Legacy
Built by [getobyte](https://github.com/getobyte)

</div>
