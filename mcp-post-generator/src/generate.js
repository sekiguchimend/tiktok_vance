import { renderSlide, CANVAS } from './render.js';
import { THEMES, getTheme } from './themes.js';
import { buildCaption, captionMarkdown, findCJK } from './caption.js';

// seeded RNG so a given (theme, seed) always renders identically
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

// Build the ordered slide list for a theme.
export function buildSlides(theme, seed) {
  const rnd = mulberry32(seed ^ hashStr(theme.id));
  const s = () => Math.floor(rnd() * 1e9);
  const total = theme.items.length;
  const slides = [
    { kind: 'cover', eyebrow: theme.eyebrow, title: theme.title, subtitle: theme.subtitle, motif: theme.hook, seed: s() },
  ];
  theme.items.forEach((it, i) => {
    slides.push({
      kind: 'item', index: i + 1, total,
      name: it.name, tag: it.tag, desc: it.desc, points: it.points, motif: it.motif,
      seed: s(),
    });
  });
  slides.push({
    kind: 'closing', total,
    eyebrow: theme.closing?.eyebrow || 'That is the list',
    title: theme.closing?.title || 'Save this\nlist',
    subtitle: theme.closing?.subtitle || 'Follow for more tools worth your time.',
    motif: theme.hook, seed: s(),
  });
  return slides;
}

// Collect every string that ends up on an image, for the English-only check.
function allText(theme) {
  const parts = [theme.eyebrow, theme.title, theme.subtitle,
    theme.closing?.eyebrow, theme.closing?.title, theme.closing?.subtitle];
  theme.items.forEach((it) => parts.push(it.name, it.tag, it.desc, ...(it.points || [])));
  return parts.filter(Boolean).join(' ');
}

// Pick a random theme (optionally excluding an id).
export function pickRandomTheme(seed, excludeId) {
  const rnd = mulberry32(seed);
  const pool = excludeId ? THEMES.filter((t) => t.id !== excludeId) : THEMES;
  return pool[Math.floor(rnd() * pool.length)];
}

// Render a whole post IN MEMORY (no disk). Returns the images as PNG buffers plus
// the English caption, so the caller can hand the whole thing back in a response.
export async function renderPost({ themeId, seed } = {}) {
  if (seed == null) seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
  const theme = themeId ? getTheme(themeId) : pickRandomTheme(seed);
  if (!theme) throw new Error(`Unknown themeId: ${themeId}`);

  // English-only guard (a.md rule): image copy + caption must be CJK-free.
  const cjk = findCJK(allText(theme)).length + findCJK(captionMarkdown(theme)).length;
  if (cjk) throw new Error(`CJK found in theme ${theme.id}`);

  const slides = buildSlides(theme, seed);
  const images = [];
  for (let i = 0; i < slides.length; i++) {
    const buffer = await renderSlide(slides[i]);
    images.push({ name: String(i + 1).padStart(2, '0') + '.png', buffer });
  }

  return {
    themeId: theme.id,
    title: theme.title.replace(/\n/g, ' '),
    size: `${CANVAS.W}x${CANVAS.H}`,
    seed,
    images,               // [{ name, buffer(PNG) }]
    caption: buildCaption(theme), // { recommended: {title, body}, options: [...] }
  };
}
