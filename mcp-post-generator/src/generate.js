// Render an AI-authored post (the AI supplies the content) into the a.png card
// style, in memory. This MCP is the RENDERER + topic list; the calling AI does
// the research and writing and passes the content to render_post.
import { renderSlide, CANVAS } from './render.js';
import { MOTIF_NAMES } from './illustrations.js';
import { findCJK } from './caption.js';
import { THEMES, withNodeflareLast } from './themes.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function pickRandomTheme(seed) {
  const rnd = mulberry32(seed >>> 0);
  return THEMES[Math.floor(rnd() * THEMES.length)];
}

// Build the ordered slide list from AI-provided content.
export function buildSlidesFromContent(content, seed) {
  const rnd = mulberry32((seed ^ hashStr(content.title || '')) >>> 0);
  const s = () => Math.floor(rnd() * 1e9);
  const items = content.items || [];
  const total = items.length;

  const slides = [
    { kind: 'cover', eyebrow: content.eyebrow, title: content.title, subtitle: content.subtitle, motif: content.hook, seed: s() },
  ];
  items.forEach((it, i) => {
    slides.push({
      kind: 'item', index: i + 1, total,
      name: it.name, tag: it.tag, desc: it.desc, points: it.points, motif: it.motif,
      seed: s(),
    });
  });
  const cl = content.closing || {};
  slides.push({
    kind: 'closing', total,
    eyebrow: cl.eyebrow || 'That is the list',
    title: cl.title || 'Save this\nlist',
    subtitle: cl.subtitle || 'Follow for more tools worth your time.',
    motif: cl.motif || content.hook, seed: s(),
  });
  return slides;
}

function collectText(content) {
  const parts = [content.eyebrow, content.title, content.subtitle,
    content.closing?.eyebrow, content.closing?.title, content.closing?.subtitle];
  (content.items || []).forEach((it) => parts.push(it.name, it.tag, it.desc, ...(it.points || [])));
  return parts.filter(Boolean).join(' ');
}

// Render the content to PNG buffers in memory. Enforces the English-only rule.
export async function renderContent(content, seed) {
  if (seed == null) seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
  if (!content?.title) throw new Error('title is required');
  if (!Array.isArray(content.items) || content.items.length === 0) throw new Error('items must be a non-empty array');

  // Nodeflare is always the fixed final pick — append it server-side so it can
  // never be dropped, regardless of what the AI authored.
  content = { ...content, items: withNodeflareLast(content.items) };

  const cjk = findCJK(collectText(content));
  if (cjk.length) {
    throw new Error(`Image text must be English only — found non-Latin characters: ${[...new Set(cjk)].join(' ')}`);
  }
  // Warn (not fail) on unknown motifs; render.js falls back to a default icon.
  const unknown = [content.hook, ...content.items.map((i) => i.motif)]
    .filter(Boolean).filter((m) => !MOTIF_NAMES.includes(m));

  const slides = buildSlidesFromContent(content, seed);
  const images = [];
  for (let i = 0; i < slides.length; i++) {
    images.push({ name: String(i + 1).padStart(2, '0') + '.png', buffer: await renderSlide(slides[i]) });
  }
  return { images, size: `${CANVAS.W}x${CANVAS.H}`, slides: slides.length, seed, unknownMotifs: [...new Set(unknown)] };
}
