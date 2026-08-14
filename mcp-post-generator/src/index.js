#!/usr/bin/env node
// MCP server (stdio). Renders a full carousel in the a.png card style entirely in
// code and in memory, bundles the slides + caption.md into a ZIP, uploads the ZIP
// to a free temporary file host, and returns over the protocol:
//   - text: the post title + overview + the ZIP download URL
//   - one inline image: the cover, as a preview
// stdio is how stdio->SSE hosts (Nodeflare / code-mode) launch and bridge it — the
// upload only needs outbound HTTPS, so no port is exposed.
//
// Env: MCP_POST_UPLOAD_TTL — litterbox TTL: 1h | 12h | 24h | 72h (default 72h).
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { renderPost } from './generate.js';
import { makeZip } from './zip.js';
import { uploadTemp } from './upload.js';
import { listThemes, THEMES } from './themes.js';

const server = new McpServer({ name: 'post-generator-b', version: '0.6.0' });

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

await server.connect(new StdioServerTransport());
console.error('post-generator-b MCP running on stdio');
