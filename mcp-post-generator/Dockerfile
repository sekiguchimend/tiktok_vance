# post-generator-b — remote MCP server (Streamable HTTP).
#
# The server renders every post in memory and returns the PNGs + the English
# title/overview OVER the MCP protocol, so it needs no writable output folder:
# it runs fine as a non-root user on a read-only filesystem. @napi-rs/canvas
# ships self-contained Skia prebuilts (no cairo/pango) and fonts are bundled via
# @fontsource, so a slim glibc image needs no extra system libraries.
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

EXPOSE 8787

# MCP over Streamable HTTP at POST /mcp; logs go to stderr.
# Point clients at http://<host>:8787/mcp
CMD ["node", "src/index.js"]
