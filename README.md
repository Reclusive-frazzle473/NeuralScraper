<div align="center">

# NeuralScraper v2.0

**Web scraping, analysis & content extraction for AI agents.**

Scrape pages, crawl sites, search the web, extract structured data with LLM,
interact with browsers, analyze UI/brand/SEO. MCP server + CLI + HTTP API.
Local-first, self-hosted. Part of the Neural* ecosystem.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-0D1117?style=flat-square&logo=typescript&logoColor=3178C6)
![License](https://img.shields.io/badge/License-MIT-0D1117?style=flat-square&logo=opensourceinitiative&logoColor=4CAF50)
![MCP](https://img.shields.io/badge/MCP-Compliant-0D1117?style=flat-square&logo=anthropic&logoColor=9F7AEA)

</div>

---

## Ecosystem

| Component | Role |
|-----------|------|
| **NeuralScraper** _(you are here)_ | Web scraping & analysis MCP server + CLI + API |
| [NeuralVaultCore](https://github.com/getobyte/NeuralVaultCore) | Persistent memory for AI agents |
| [NeuralVaultSkill](https://github.com/getobyte/NeuralVaultSkill) | Session memory automation |
| [NeuralVaultFlow](https://github.com/getobyte/NeuralVaultFlow) | Dev workflow orchestration |

---

## Features

### Core (v1)
- **Scrape** — markdown, HTML, metadata, links, screenshot per page
- **Screenshot** — full-page PNG capture
- **Crawl** — multi-page scraping with depth/limit control
- **Map** — fast internal URL discovery
- **UI Analysis** — layout structure, components, spacing, typography
- **Brand Extraction** — dominant colors, fonts, logos
- **SEO Audit** — meta tags, headings, OG, schema markup, scoring
- **Full Analyze** — all of the above in one command

### New in v2
- **Search** — search the web via SearXNG, scrape top results
- **Extract** — structured data extraction with LLM (Ollama)
- **Interact** — browser actions (click, type, wait, scroll) then scrape
- **Batch** — process a list of URLs from a file
- **PDF Support** — scrape PDF files (URL or local path)
- **HTTP API** — REST endpoints for all tools

### Integration
- MCP server (stdio) for Claude Code, Cursor, VS Code, OpenCode
- HTTP API on port 9996 for any client
- CLI tool (`ns`) for terminal use
- Docker deployment for homelab

---

## Ports & Docker

| Service | Port | Container Name |
|---------|------|----------------|
| MCP Server + HTTP API | `9996` | `NeuralScraper` |

---

## Prerequisites (homelab)

NeuralScraper integrates with services you already have running:

| Service | Purpose | Default URL |
|---------|---------|-------------|
| **SearXNG** | Web search for `ns search` | `http://host.docker.internal:8080` |
| **Ollama** | LLM extraction for `ns extract` | `http://host.docker.internal:11434` |

Both are optional — all other commands work without them.

Recommended Ollama model: **`qwen3:14b`** (best at structured JSON extraction).

---

## Installation

### Option 1 — Docker (recommended for homelab)

```bash
git clone https://github.com/getobyte/NeuralScraper.git
cd NeuralScraper
cp .env.example .env
docker compose up -d
```

This starts:
- MCP server on stdio
- HTTP API on `http://localhost:9996`
- Container name: `NeuralScraper`
- Connects to Ollama and SearXNG via `host.docker.internal`

Verify:

```bash
docker ps | grep NeuralScraper
curl http://localhost:9996/health
```

### Option 2 — Local (development)

```bash
git clone https://github.com/getobyte/NeuralScraper.git
cd NeuralScraper
npm install
npx playwright install chromium
npm run build
```

Make CLI globally available:

```bash
npm link
```

Start MCP server + HTTP API:

```bash
node dist/mcp-server.js
```

---

## Connecting to Claude Code

Add to `~/.claude.json`:

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

Restart Claude Code. All `ns_*` tools will be available.

---

## CLI Usage

### Core commands

```bash
ns scrape https://example.com              # Scrape page
ns screenshot https://example.com           # Full-page screenshot
ns crawl https://example.com --depth 2      # Crawl site
ns map https://example.com                  # Discover URLs
ns ui https://example.com                   # UI analysis
ns brand https://example.com                # Brand extraction
ns seo https://example.com                  # SEO audit
ns analyze https://example.com              # Full analysis (all above)
```

### V2 commands

```bash
# Search the web and scrape results
ns search "best react component libraries" --limit 5

# Extract structured data with LLM
ns extract https://example.com --schema '{"title": "string", "links": "array"}'
ns extract https://example.com --prompt "find all product prices and names"

# Browser actions then scrape
ns interact https://example.com --actions '[{"click":".cookie-accept"},{"wait":1000}]'

# Batch scrape from file
ns batch urls.txt --no-screenshot

# Scrape PDF
ns scrape https://example.com/document.pdf
```

### Options

| Option | Description | Commands |
|--------|-------------|----------|
| `-o, --output <dir>` | Custom output directory | all |
| `-d, --depth <n>` | Crawl depth (default: 2) | crawl |
| `-l, --limit <n>` | Max results/pages | crawl, search |
| `--no-screenshot` | Skip screenshots | scrape, crawl, batch |
| `-s, --schema <json>` | JSON schema for extraction | extract |
| `-p, --prompt <text>` | Natural language prompt | extract |
| `-a, --actions <json>` | Browser actions array | interact |

---

## HTTP API

All endpoints accept JSON body and return JSON.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/scrape` | Scrape a page |
| `POST` | `/screenshot` | Take screenshot |
| `POST` | `/crawl` | Crawl a site |
| `POST` | `/map` | Discover URLs |
| `POST` | `/ui` | UI analysis |
| `POST` | `/brand` | Brand extraction |
| `POST` | `/seo` | SEO audit |
| `POST` | `/analyze` | Full analysis |
| `POST` | `/search` | Search + scrape |
| `POST` | `/extract` | LLM extraction |
| `POST` | `/interact` | Browser actions |
| `POST` | `/batch` | Batch scrape |

### Examples

```bash
# Health check
curl http://localhost:9996/health

# Scrape
curl -X POST http://localhost:9996/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Search
curl -X POST http://localhost:9996/search \
  -H "Content-Type: application/json" \
  -d '{"query": "best react libraries", "limit": 5}'

# Extract
curl -X POST http://localhost:9996/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "prompt": "extract main heading and links"}'
```

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `ns_scrape` | Scrape a single page (web or PDF) |
| `ns_screenshot` | Full-page screenshot |
| `ns_crawl` | Multi-page crawl |
| `ns_map` | URL discovery |
| `ns_ui` | UI analysis |
| `ns_brand` | Brand extraction |
| `ns_seo` | SEO audit |
| `ns_analyze` | Full analysis |
| `ns_search` | Web search via SearXNG + scrape |
| `ns_extract` | LLM structured extraction |
| `ns_interact` | Browser actions + scrape |
| `ns_batch` | Batch URL scraping |

---

## Output Structure

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
      extracted.json          # extract command
      manifest.json
  search-best-react-libs/
    2026-03-28T14-30-00/
      search-results.json
      pages/
        example.com/...
  batch-2026-03-28T14-30-00/
    batch-results.json
    pages/
      example.com/...
```

---

## Configuration

Environment variables (`.env`):

```env
NS_OUTPUT_DIR=./ns-output        # Output directory
NS_MCP_PORT=9996                 # HTTP API + MCP port
NS_API_KEY=                      # Optional API key

# SearXNG (for ns search)
NS_SEARXNG_URL=http://host.docker.internal:8080

# Ollama (for ns extract)
NS_OLLAMA_URL=http://host.docker.internal:11434
NS_OLLAMA_MODEL=qwen3:14b
```

For local (non-Docker) use, change `host.docker.internal` to `localhost`.

---

## Architecture

```
NeuralScraper/
  src/
    browser/
      playwright.ts          # Browser pool management
      screenshot.ts          # Full-page screenshot
    clients/
      searxng.ts             # SearXNG search API client
      ollama.ts              # Ollama LLM API client
    extractors/
      markdown.ts            # HTML -> Markdown
      metadata.ts            # Meta tags, OG, Twitter
      links.ts               # Link extraction
      ui-analyzer.ts         # Layout, components, spacing
      brand.ts               # Colors, fonts, logos
      seo.ts                 # SEO audit with scoring
      pdf.ts                 # PDF text extraction
    storage/
      writer.ts              # File output & manifest
    tools/
      scrape.ts              # Scrape (web + PDF)
      screenshot.ts          # Screenshot standalone
      crawl.ts               # Multi-page crawl
      map.ts                 # URL discovery
      ui.ts                  # UI analysis
      brand.ts               # Brand extraction
      seo.ts                 # SEO audit
      analyze.ts             # All-in-one
      search.ts              # SearXNG search + scrape
      extract.ts             # LLM extraction
      interact.ts            # Browser actions
      batch.ts               # Batch URL processing
    api.ts                   # HTTP API (Fastify)
    cli.ts                   # CLI (commander)
    mcp-server.ts            # MCP + API entry point
    index.ts                 # Library exports
```

---

## Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.8
- **Browser:** Playwright (Chromium)
- **HTML -> MD:** @mozilla/readability + turndown
- **HTML parsing:** cheerio
- **HTTP API:** Fastify
- **PDF:** pdf-parse
- **MCP:** @modelcontextprotocol/sdk
- **CLI:** commander
- **Build:** tsup
- **LLM:** Ollama (qwen3:14b)
- **Search:** SearXNG

---

<div align="center">

**NeuralScraper v2.0** — Cyber-Draco Legacy
Built by [getobyte](https://github.com/getobyte)

</div>
