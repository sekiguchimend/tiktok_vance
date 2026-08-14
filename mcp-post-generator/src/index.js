#!/usr/bin/env node
// Remote MCP server (Streamable HTTP, stateless). No stdio transport.
//
// It generates a TikTok/IG carousel in the a.png card style, fully in code and
// fully IN MEMORY, and hands everything back in the tool RESPONSE:
//   - one text block: the post title + overview (English), nothing else
//   - one image block per slide (PNG, inline)
// Nothing is written to a folder; the response is the deliverable.
//
// Env: PORT (default 8787)
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { pathToFileURL } from 'node:url';
import { renderPost } from './generate.js';
import { listThemes, THEMES } from './themes.js';

const PORT = Number(process.env.PORT) || 8787;

// A fresh MCP server per request (stateless HTTP mode).
function buildServer() {
  const server = new McpServer({ name: 'post-generator-b', version: '0.3.0' });

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
        'code at 1080x1320, and return it in the response: the post title + overview as text, plus every ' +
        'slide as an inline PNG image. Nothing is saved to disk. If themeId is omitted, a random theme is chosen.',
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

      // Only text: the post title + overview. Then every slide as an inline image.
      const content = [
        { type: 'text', text: `${r.caption.recommended.title}\n\n${r.caption.recommended.body}` },
      ];
      for (const img of r.images) {
        content.push({ type: 'image', data: img.buffer.toString('base64'), mimeType: 'image/png' });
      }
      return { content };
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
  createApp().listen(PORT, () => console.error(`post-generator-b MCP (Streamable HTTP) on http://localhost:${PORT}/mcp`));
}
