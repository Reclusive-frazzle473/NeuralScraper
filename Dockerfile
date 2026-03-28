FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Copy source and build
COPY tsconfig.json tsup.config.ts ./
COPY src/ src/
RUN npm run build

# Install only chromium for smaller image
RUN npx playwright install chromium

# Environment
ENV NS_OUTPUT_DIR=/app/output
ENV NS_MCP_PORT=9996
ENV NS_SEARXNG_URL=http://host.docker.internal:8080
ENV NS_OLLAMA_URL=http://host.docker.internal:11434
ENV NS_OLLAMA_MODEL=qwen3:14b

VOLUME ["/app/output"]
EXPOSE 9996

# Run MCP server + HTTP API
CMD ["node", "dist/mcp-server.js"]
