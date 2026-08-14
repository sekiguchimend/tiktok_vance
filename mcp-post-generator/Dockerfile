# post-generator-b — remote MCP server (Streamable HTTP).
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
ENV PORT=8787
WORKDIR /app

# Install production dependencies first (better layer caching).
# npm ci picks the correct @napi-rs/canvas prebuilt for the image's os/arch.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# App source only (no output dir, no VOLUME — nothing is written at runtime).
COPY src ./src

# Run as the built-in non-root user; the app needs no write access.
USER node

# Listens on $PORT (default 8787). Optional: MCP_POST_UPLOAD_TTL = 1h|12h|24h|72h.
EXPOSE 8787

# MCP over Streamable HTTP at POST /mcp; logs go to stderr.
# Point clients at http://<host>:8787/mcp
CMD ["node", "src/index.js"]
