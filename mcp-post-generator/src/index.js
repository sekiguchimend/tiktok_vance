#!/usr/bin/env node
// MCP server (stdio) — a POST RENDERER, not a content database.
//
// The calling AI picks one of 30 topics (titles), researches real, current
// tools/sites, writes the copy itself, and passes it to render_post. This server
// draws that content in the a.png card style (1080x1320), bundles the slides into
// a ZIP, uploads it to a temporary file host, and returns the ZIP URL + the cover
// inline as a preview. The AI owns the content; this server owns the pixels.
//
// Tools:
//   list_themes  — the 30 topics to choose from
//   pick_theme   — one random topic + how to fill it in
//   render_post  — render AI-authored content -> ZIP URL + cover preview
//
// Env: MCP_POST_UPLOAD_TTL — litterbox TTL: 1h | 12h | 24h | 72h (default 72h).
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { renderContent, pickRandomTheme } from './generate.js';
import { makeZip } from './zip.js';
import { uploadTemp } from './upload.js';
import { MOTIF_NAMES } from './illustrations.js';
import { listThemes, THEMES, NODEFLARE_FACTS } from './themes.js';

const MOTIFS = MOTIF_NAMES.join(', ');

const AUTHOR_GUIDE =
  'You write the content. For the chosen title, research the exact number of real, ' +
  'currently-popular tools/sites that fit it. For each item provide: name, tag (1-2 ' +
  'words), desc (~2 short sentences, benefit-first), points (2 short takeaways), and ' +
  `motif (an icon name from: ${MOTIFS}). ` +
  'ALL text must be English (no CJK — the renderer rejects it). Keep it punchy and ' +
  'TikTok-friendly. If the topic is nodeflareFit, include Nodeflare as ONE of the ' +
  `picks, described accurately: ${NODEFLARE_FACTS} ` +
  'Then call render_post with { eyebrow, title, subtitle, hook, items, closing }.';

const slug = (s) => (s || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'post';

const server = new McpServer({ name: 'post-generator-b', version: '1.0.0' });

server.registerTool(
  'list_themes',
  {
    title: 'List post topics',
    description:
      'List the 30 post topics (titles) to choose from. Each has an id, title (with its item count), ' +
      'eyebrow, and nodeflareFit flag. Pick one (at random for variety), then research and write the ' +
      'content and call render_post. This server does NOT store the content — you create it.',
    inputSchema: {},
  },
  async () => ({ content: [{ type: 'text', text: JSON.stringify({ count: THEMES.length, themes: listThemes() }, null, 2) }] })
);

server.registerTool(
  'pick_theme',
  {
    title: 'Pick a random topic',
    description:
      'Return ONE random topic to build a post around, plus guidance on how to fill it in. ' +
      'Use this to start a post, then research the tools yourself and call render_post.',
    inputSchema: {
      seed: z.number().int().optional().describe('Optional seed for a reproducible pick.'),
    },
  },
  async ({ seed }) => {
    const t = pickRandomTheme(seed ?? ((Date.now() ^ (Math.random() * 1e9)) >>> 0));
    const payload = {
      chosen: { id: t.id, title: t.title, eyebrow: t.eyebrow, hook: t.hook, itemCount: t.count, nodeflareFit: t.nodeflareFit },
      howTo: AUTHOR_GUIDE,
      motifs: MOTIF_NAMES,
    };
    return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
  }
);

const ItemSchema = z.object({
  name: z.string().describe('Tool/site name (short).'),
  tag: z.string().optional().describe('1-2 word category, e.g. "AI Chat".'),
  desc: z.string().describe('~2 short, benefit-first sentences.'),
  points: z.array(z.string()).max(3).optional().describe('Up to 2-3 short takeaways.'),
  motif: z.string().optional().describe(`Icon name from: ${MOTIFS}`),
});

server.registerTool(
  'render_post',
  {
    title: 'Render a post from your content',
    description:
      'Render an AI-authored carousel (cover + one slide per item + closing) in the a.png card style at ' +
      '1080x1320, bundle the slides (+ optional caption.md) into a ZIP, upload it to a temporary file host, ' +
      'and return the ZIP download URL + the cover inline as a preview. YOU supply the researched content. ' +
      `All text must be English. Valid motif icon names: ${MOTIFS}.`,
    inputSchema: {
      title: z.string().describe('Cover headline, e.g. "7 AI tools that feel like cheating". Include the count.'),
      eyebrow: z.string().optional().describe('Small label above the title, e.g. "AI Tools".'),
      subtitle: z.string().optional().describe('One-line cover subtitle.'),
      hook: z.string().optional().describe(`Cover icon from: ${MOTIFS}`),
      items: z.array(ItemSchema).min(1).max(10).describe('One slide per item; match the count in the title.'),
      closing: z.object({
        eyebrow: z.string().optional(),
        title: z.string().optional().describe('Use \\n to force line breaks.'),
        subtitle: z.string().optional(),
        motif: z.string().optional(),
      }).optional().describe('Closing slide copy. Sensible defaults if omitted.'),
      caption: z.string().optional().describe('Optional post caption (markdown) to include as caption.md in the ZIP.'),
      seed: z.number().int().optional().describe('Optional seed for reproducible visuals.'),
    },
  },
  async ({ title, eyebrow, subtitle, hook, items, closing, caption, seed }) => {
    try {
      const r = await renderContent({ title, eyebrow, subtitle, hook, items, closing }, seed);

      const files = r.images.map((im) => ({ name: im.name, buffer: im.buffer }));
      if (caption) files.push({ name: 'caption.md', buffer: Buffer.from(caption, 'utf8') });
      const zip = await makeZip(files);
      const up = await uploadTemp(zip, `${slug(title)}.zip`);

      const note = r.unknownMotifs.length ? ` (unknown motifs fell back to a default icon: ${r.unknownMotifs.join(', ')})` : '';
      const text =
        `Rendered "${title}" — ${r.images.length} slides, ${r.size}.${note}\n` +
        `Download all slides${caption ? ' + caption' : ''} (ZIP, ${up.host}, expires ~${up.ttl}): ${up.url}`;

      return {
        content: [
          { type: 'text', text },
          { type: 'image', data: r.images[0].buffer.toString('base64'), mimeType: 'image/png' }, // cover preview
        ],
      };
    } catch (err) {
      return { isError: true, content: [{ type: 'text', text: `render_post failed: ${err?.message || String(err)}` }] };
    }
  }
);

await server.connect(new StdioServerTransport());
console.error('post-generator-b MCP running on stdio');
