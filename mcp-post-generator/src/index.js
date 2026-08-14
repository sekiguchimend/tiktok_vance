#!/usr/bin/env node
// Remote MCP server (Streamable HTTP, stateless). No stdio transport.
//
// generate_post renders the whole carousel in memory, bundles all slides +
// caption.md into a single ZIP, and returns in the tool response:
//   - text: the post title + overview + a download URL for the ZIP
//   - one inline image: the cover, as a preview
// Delivering ONE small download URL (instead of many big inline images) is what
// survives size caps and code-mode hosts, and lets the user grab everything at
// once. The ZIP is held in memory and served at /download/<id>.zip.
//
// Env:
//   PORT             (default 8787)
//   PUBLIC_BASE_URL  external base URL for the download links (default http://localhost:PORT)
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { renderPost } from './generate.js';
import { makeZip } from './zip.js';
import { listThemes, THEMES } from './themes.js';

const PORT = Number(process.env.PORT) || 8787;
const BASE = (process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');

// In-memory store of recent ZIPs, capped so memory stays bounded.
const POSTS = new Map(); // id -> { zip: Buffer, filename: string, createdAt: number }
const MAX_POSTS = 30;
function storePost(zip, filename) {
  const id = randomUUID();
  POSTS.set(id, { zip, filename, createdAt: Date.now() });
  if (POSTS.size > MAX_POSTS) {
    let oldestId, oldest = Infinity;
    for (const [k, v] of POSTS) if (v.createdAt < oldest) { oldest = v.createdAt; oldestId = k; }
    POSTS.delete(oldestId);
  }
  return id;
}

// A fresh MCP server per request (stateless HTTP mode).
function buildServer() {
  const server = new McpServer({ name: 'post-generator-b', version: '0.4.0' });

  server.registerTool(
    'list_themes',
    {
      title: 'List post themes',
      description:
        'List the ~30 built-in listicle themes (e.g. "7 AI tools that feel like cheating"). ' +
        'Returns each theme id, title and item count. Use an id with generate_post, or omit it for a random pick.',
      inputSchema: {},
    },
    async () => {
      const themes = listThemes();
      return { content: [{ type: 'text', text: JSON.stringify({ count: themes.length, themes }, null, 2) }] };
    }
  );

  server.registerTool(
    'generate_post',
    {
      title: 'Generate a carousel post',
      description:
        'Render a full carousel (cover + one slide per item + closing) in the a.png card style, fully in ' +
        'code at 1080x1320. Bundles every slide + caption.md into a single ZIP and returns the post title + ' +
        'overview and a download URL for the ZIP, plus the cover image inline as a preview. ' +
        'If themeId is omitted, a random theme is chosen.',
      inputSchema: {
        themeId: z.string().optional().describe('Theme id from list_themes. Omit for a random theme.'),
        seed: z.number().int().optional().describe('Optional seed for reproducible output.'),
      },
    },
    async ({ themeId, seed }) => {
      if (themeId && !THEMES.some((t) => t.id === themeId)) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Unknown themeId "${themeId}". Call list_themes for valid ids.` }],
        };
      }
      const r = await renderPost({ themeId, seed });

      // Bundle every slide + caption.md into one ZIP and stash it for download.
      const files = r.images.map((im) => ({ name: im.name, buffer: im.buffer }));
      files.push({ name: 'caption.md', buffer: Buffer.from(r.captionMd, 'utf8') });
      const id = storePost(makeZip(files), `${r.themeId}.zip`);
      const url = `${BASE}/download/${id}.zip`;

      const text =
        `${r.caption.recommended.title}\n\n${r.caption.recommended.body}\n\n` +
        `Download all ${r.images.length} slides + caption (ZIP): ${url}`;

      return {
        content: [
          { type: 'text', text },
          { type: 'image', data: r.images[0].buffer.toString('base64'), mimeType: 'image/png' }, // cover preview
        ],
      };
    }
  );

  return server;
}

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, name: 'post-generator-b', themes: THEMES.length }));

  // Download a generated post as a single ZIP.
  app.get('/download/:file', (req, res) => {
    const id = req.params.file.replace(/\.zip$/i, '');
    const post = POSTS.get(id);
    if (!post) return res.status(404).json({ error: 'Not found or expired.' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${post.filename}"`);
    res.send(post.zip);
  });

  // Streamable HTTP MCP endpoint (stateless: new server+transport per request).
  app.post('/mcp', async (req, res) => {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => { transport.close(); server.close(); });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: String(err) }, id: null });
      }
    }
  });

  // Stateless mode has no server-initiated stream / session teardown.
  const methodNotAllowed = (_req, res) =>
    res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Use POST for MCP.' }, id: null });
  app.get('/mcp', methodNotAllowed);
  app.delete('/mcp', methodNotAllowed);

  return app;
}

// Only start listening when run directly (not when imported by tests).
const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  createApp().listen(PORT, () => {
    console.error(`post-generator-b MCP (Streamable HTTP) on ${BASE}/mcp`);
    console.error(`  downloads at ${BASE}/download/<id>.zip  |  health at ${BASE}/health`);
  });
}
