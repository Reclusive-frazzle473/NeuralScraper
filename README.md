<div align="center">

# NeuralScraper v1.0

**Web scraping, analysis & content extraction for AI agents.**

Scrape pages, crawl sites, extract UI/brand/SEO data. MCP server + CLI.
Local-first, self-hosted. Part of the Neural* ecosystem.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-0D1117?style=flat-square&logo=typescript&logoColor=3178C6)
![License](https://img.shields.io/badge/License-MIT-0D1117?style=flat-square&logo=opensourceinitiative&logoColor=4CAF50)
![MCP](https://img.shields.io/badge/MCP-Compliant-0D1117?style=flat-square&logo=anthropic&logoColor=9F7AEA)

</div>

---

## Ecosystem

| Component | Role |
|-----------|------|
| **NeuralScraper** _(you are here)_ | Web scraping & analysis MCP server + CLI |
| [NeuralVaultCore](https://github.com/getobyte/NeuralVaultCore) | Persistent memory for AI agents |
| [NeuralVaultSkill](https://github.com/getobyte/NeuralVaultSkill) | Session memory automation |
| [NeuralVaultFlow](https://github.com/getobyte/NeuralVaultFlow) | Dev workflow orchestration |

---

## Features

### Scraping & Extraction
- **Scrape** — markdown, HTML, metadata, links, screenshot per page
- **Screenshot** — full-page PNG capture
- **Crawl** — multi-page scraping with depth/limit control
- **Map** — fast internal URL discovery

### Analysis
- **UI Analysis** — layout structure, components, spacing, typography
- **Brand Extraction** — dominant colors, fonts, logos
- **SEO Audit** — meta tags, headings, OG, schema markup, scoring
- **Full Analyze** — all of the above in one command

### Integration
- MCP server (stdio) for Claude Code, Cursor, VS Code, OpenCode
- CLI tool (`ns`) for terminal use
- Docker deployment for homelab

---

## Ports & Docker

| Service | Port | Container Name |
|---------|------|----------------|
| MCP Server | `9996` | `NeuralScraper` |

---

## Installation

### Option 1 — Local (recommended for development)

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
# Now you can run: ns scrape https://example.com
```

Start MCP server locally:

```bash
node dist/mcp-server.js
```

### Option 2 — Docker (homelab)

```bash
git clone https://github.com/getobyte/NeuralScraper.git
cd NeuralScraper
cp .env.example .env
docker compose up -d
```

This starts the MCP server on port `9996` in container `NeuralScraper`.

Verify it's running:

```bash
docker ps | grep NeuralScraper
docker logs NeuralScraper
```

---

## Connecting to Claude Code

Add to your Claude Code MCP settings (`~/.claude.json` or project `.claude/settings.json`):

**Local (stdio — recommended):**

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

Restart Claude Code. Tools `ns_scrape`, `ns_crawl`, `ns_map`, `ns_screenshot`, `ns_ui`, `ns_brand`, `ns_seo`, `ns_analyze` will be available.

### Available MCP Tools After Connection

All tools accept a `url` (required) and `output_dir` (optional) parameter.

---

## CLI Usage

```bash
# Scrape a page
ns scrape https://example.com

# Take screenshot
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

# Full analysis (everything)
ns analyze https://example.com
```

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <dir>` | Custom output directory |
| `-d, --depth <n>` | Crawl depth (default: 2) |
| `-l, --limit <n>` | Max pages (default: 20) |
| `--no-screenshot` | Skip screenshots |

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `ns_scrape` | Scrape a single page |
| `ns_screenshot` | Full-page screenshot |
| `ns_crawl` | Multi-page crawl |
| `ns_map` | URL discovery |
| `ns_ui` | UI analysis |
| `ns_brand` | Brand extraction |
| `ns_seo` | SEO audit |
| `ns_analyze` | Full analysis |

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
      manifest.json
```

For crawl jobs:

```
ns-output/
  example.com/
    crawl-2026-03-28T14-30-00/
      manifest.json
      pages.json
      pages/
        001-home/
          page.md, page.html, metadata.json, links.json, screenshot.png
        002-about/
          ...
```

---

## Architecture

```
NeuralScraper/
  src/
    browser/
      playwright.ts      # Browser pool management
      screenshot.ts      # Full-page screenshot
    extractors/
      markdown.ts        # HTML -> Markdown (readability + turndown)
      metadata.ts        # Meta tags, OG, Twitter cards
      links.ts           # Link extraction & classification
      ui-analyzer.ts     # Layout, components, spacing, fonts
      brand.ts           # Colors, fonts, logos
      seo.ts             # SEO audit with scoring
    storage/
      writer.ts          # File output & manifest generation
    tools/
      scrape.ts          # Scrape orchestration
      screenshot.ts      # Screenshot standalone
      crawl.ts           # Multi-page crawl
      map.ts             # URL discovery
      ui.ts              # UI analysis standalone
      brand.ts           # Brand extraction standalone
      seo.ts             # SEO audit standalone
      analyze.ts         # All-in-one analysis
    cli.ts               # CLI entry point (commander)
    mcp-server.ts        # MCP server entry point (stdio)
    index.ts             # Library exports
```

---

## Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.8
- **Browser:** Playwright (Chromium)
- **HTML -> MD:** @mozilla/readability + turndown
- **HTML parsing:** cheerio
- **MCP:** @modelcontextprotocol/sdk
- **CLI:** commander
- **Build:** tsup

---

<div align="center">

**NeuralScraper v1.0** — Cyber-Draco Legacy
Built by [getobyte](https://github.com/getobyte)

</div>
