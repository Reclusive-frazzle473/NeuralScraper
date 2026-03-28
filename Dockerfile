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

# Set output dir
ENV NS_OUTPUT_DIR=/app/output
ENV NS_MCP_PORT=9996

VOLUME ["/app/output"]

# Default: run MCP server
CMD ["node", "dist/mcp-server.js"]
