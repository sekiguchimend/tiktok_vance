#!/usr/bin/env node
// Remote MCP server (Streamable HTTP, stateless). No stdio transport.
//
// generate_post renders the whole carousel in memory, bundles all slides +
// caption.md into a ZIP, uploads it to a no-auth temporary file host, and
// returns in the tool response:
//   - text: the post title + overview + the ZIP download URL (with expiry note)
//   - one inline image: the cover, as a preview
// Uploading to a temp host (litterbox -> 0x0.st) gives a universally reachable
// link that works from any client / code-mode host, without this server needing
// a public URL of its own. The links are TEMPORARY (download soon).
//
// Env:
//   PORT                  (default 8787)
//   MCP_POST_UPLOAD_TTL   litterbox TTL: 1h | 12h | 24h | 72h (default 72h)
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { pathToFileURL } from 'node:url';
import { renderPost } from './generate.js';
import { makeZip } from './zip.js';
import { uploadTemp } from './upload.js';
import { listThemes, THEMES } from './themes.js';

const PORT = Number(process.env.PORT) || 8787;

// A fresh MCP server per request (stateless HTTP mode).
function buildServer() {
  const server = new McpServer({ name: 'post-generator-b', version: '0.5.0' });

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
        'code at 1080x1320. Bundles every slide + caption.md into a ZIP, uploads it to a temporary file host, ' +
        'and returns the post title + overview + a download URL for the ZIP, plus the cover image inline as a ' +
        'preview. The download link is temporary — grab it soon. If themeId is omitted, a random theme is chosen.',
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
      // Wrap the whole pipeline so a render/zip/upload failure comes back as a
      // legible message instead of an opaque "server returned an error".
      try {
        const r = await renderPost({ themeId, seed });

        // Bundle every slide + caption.md into one ZIP and upload it.
        const files = r.images.map((im) => ({ name: im.name, buffer: im.buffer }));
        files.push({ name: 'caption.md', buffer: Buffer.from(r.captionMd, 'utf8') });
        const zip = await makeZip(files);
        const up = await uploadTemp(zip, `${r.themeId}.zip`);

        const text =
          `${r.caption.recommended.title}\n\n${r.caption.recommended.body}\n\n` +
          `Download all ${r.images.length} slides + caption (ZIP, ${up.host}, expires ~${up.ttl}): ${up.url}`;

        return {
          content: [
            { type: 'text', text },
            { type: 'image', data: r.images[0].buffer.toString('base64'), mimeType: 'image/png' }, // cover preview
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `generate_post failed: ${err?.stack || err?.message || String(err)}` }],
        };
      }
    }
  );

  return server;
}

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, name: 'post-generator-b', themes: THEMES.length }));

  // Streamable HTTP MCP endpoint (stateless: new server+transport per request).
  app.post('/mcp', async (req, res) => {
    // The Streamable HTTP spec requires POSTs to Accept BOTH application/json and
    // text/event-stream, else the transport replies 406 -32000 "Not Acceptable".
    // Some hosts' internal clients (e.g. code-mode sandboxes) omit this header and
    // then fail to call their own tools. We only ever return those two types, so
    // normalize the header here to accept whatever the client actually sent.
    const accept = req.headers.accept || '';
    if (!accept.includes('application/json') || !accept.includes('text/event-stream')) {
      req.headers.accept = 'application/json, text/event-stream';
    }
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

// Start when run directly (not when imported by tests).
//   default   -> stdio (works on stdio->SSE / code-mode hosts, like account_a)
//   MCP_HTTP=1 -> Streamable HTTP listener on $PORT (for self-hosting)
const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  if (process.env.MCP_HTTP === '1' || process.env.MCP_HTTP === 'true') {
    createApp().listen(PORT, () =>
      console.error(`post-generator-b MCP (Streamable HTTP) on http://localhost:${PORT}/mcp`)
    );
  } else {
    const server = buildServer();
    await server.connect(new StdioServerTransport());
    console.error('post-generator-b MCP running on stdio');
  }
}
