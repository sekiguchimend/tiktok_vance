# post-generator-b — MCP server (stdio by default; HTTP optional).
#
# Each post is rendered in memory, bundled into a ZIP, and uploaded to a free
# temporary file host; the response carries the title/overview + that ZIP URL and
# the cover inline. So nothing is written to disk (runs fine as a non-root user on
# a read-only filesystem), but the container DOES need OUTBOUND HTTPS to the upload
# hosts (litter.catbox.moe, 0x0.st). @napi-rs/canvas ships self-contained Skia
# prebuilts (no cairo/pango) and fonts are bundled via @fontsource, so a slim glibc
# image needs no extra system libraries.
FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies first (better layer caching).
# npm ci picks the correct @napi-rs/canvas prebuilt for the image's os/arch.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# App source only (no output dir, no VOLUME — nothing is written at runtime).
COPY src ./src

# Run as the built-in non-root user; the app needs no write access.
USER node

# JSON-RPC over stdio (stdout stays clean for the protocol; logs go to stderr).
# The host launches this via `docker run --rm -i --init mcp-post-generator`.
# Optional: set MCP_HTTP=1 (and EXPOSE/-p $PORT, default 8787) to run the
# Streamable HTTP listener at POST /mcp instead, for self-hosting.
# Optional: MCP_POST_UPLOAD_TTL = 1h | 12h | 24h | 72h (default 72h).
ENTRYPOINT ["node", "src/index.js"]
