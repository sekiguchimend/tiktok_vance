import { createCanvas } from '@napi-rs/canvas';
import { registerFonts } from './fonts.js';
import { drawMotif, drawCoverScene } from './illustrations.js';
import { CANVAS, CARD, PAD, PALETTE, BRAND, FONT } from './config.js';

// ---------------------------------------------------------------------------
// text helpers
// ---------------------------------------------------------------------------

// letter-spaced line; align left|center. Returns total width drawn.
function drawLS(ctx, text, x, y, ls, align = 'center') {
  const chars = [...text];
  let total = 0;
  for (const c of chars) total += ctx.measureText(c).width + ls;
  total -= ls;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  for (const c of chars) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + ls; }
  ctx.textAlign = prev;
  return total;
}

function wrap(ctx, text, maxW) {
  const out = [];
  for (const seg of text.split('\n')) {
    let line = '';
    for (const word of seg.split(/\s+/)) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) { out.push(line); line = word; }
      else line = test;
    }
    if (line) out.push(line);
  }
  return out;
}

// ---------------------------------------------------------------------------
// background: paper + rounded blue card (a.png reproduction)
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function grain(ctx, x, y, w, h, seed, amount) {
  if (amount <= 0) return; // per-pixel noise defeats PNG compression; opt-in only
  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;
  const rnd = mulberry32((seed * 2654435761) >>> 0);
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, x, y);
}

function drawShell(ctx, seed) {
  const { W, H } = CANVAS;
  // paper
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, W, H);
  // subtle paper vignette drift per corner
  const pv = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.7);
  pv.addColorStop(0, 'rgba(255,255,255,0.6)');
  pv.addColorStop(1, 'rgba(226,229,234,0.55)');
  ctx.fillStyle = pv; ctx.fillRect(0, 0, W, H);
  grain(ctx, 0, 0, W, H, seed + 99, 0);

  // blue card
  roundRectPath(ctx, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r);
  ctx.fillStyle = PALETTE.card; ctx.fill();
  // gentle inner glow toward lower-center for depth (kept very subtle)
  ctx.save();
  roundRectPath(ctx, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r); ctx.clip();
  const g = ctx.createRadialGradient(CARD.x + CARD.w / 2, CARD.y + CARD.h * 0.62, 40, CARD.x + CARD.w / 2, CARD.y + CARD.h * 0.62, CARD.w * 0.9);
  g.addColorStop(0, 'rgba(90,130,216,0.22)');
  g.addColorStop(1, 'rgba(90,130,216,0)');
  ctx.fillStyle = g; ctx.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);
  grain(ctx, CARD.x, CARD.y, CARD.w, CARD.h, seed, 0);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// fixed chrome: brand url (top-left), arrow circle (top-right) — both from a.png
// ---------------------------------------------------------------------------

function drawBrand(ctx) {
  ctx.save();
  ctx.fillStyle = PALETTE.white;
  ctx.font = `700 30px ${FONT.b}`;
  ctx.textBaseline = 'alphabetic';
  ctx.transform(1, 0, -0.16, 1, 0, 0); // faux italic
  drawLS(ctx, BRAND, CARD.x + PAD + (CARD.y + 70) * 0.16, CARD.y + 70, 0.6, 'left');
  ctx.restore();
}

function drawArrowCircle(ctx) {
  const r = 33, cx = CARD.x + CARD.w - PAD - r, cy = CARD.y + 60;
  ctx.save();
  ctx.strokeStyle = PALETTE.white; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 10, cy);
  ctx.moveTo(cx + 2, cy - 9); ctx.lineTo(cx + 11, cy); ctx.lineTo(cx + 2, cy + 9);
  ctx.stroke();
  ctx.restore();
}

function drawPageDots(ctx, index, total) {
  const y = CARD.y + CARD.h - 58;
  const gap = 26, r = 4.5;
  const startX = CANVAS.W / 2 - ((total - 1) * gap) / 2;
  for (let i = 0; i < total; i++) {
    ctx.beginPath();
    ctx.arc(startX + i * gap, y, i === index ? r + 1.5 : r, 0, Math.PI * 2);
    ctx.fillStyle = i === index ? PALETTE.white : PALETTE.hairline;
    ctx.fill();
  }
}

// white rounded tile that holds a flat line icon
function iconTile(ctx, cx, cy, size, motif) {
  const r = size * 0.22;
  ctx.save();
  roundRectPath(ctx, cx - size / 2, cy - size / 2, size, size, r);
  ctx.fillStyle = PALETTE.white;
  ctx.shadowColor = 'rgba(10,30,90,0.25)';
  ctx.shadowBlur = size * 0.12; ctx.shadowOffsetY = size * 0.04;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.restore();
  drawMotif(ctx, motif, cx, cy, size * 0.62);
}

function eyebrow(ctx, text, y) {
  ctx.fillStyle = PALETTE.sub2;
  ctx.font = `600 22px ${FONT.sb}`;
  ctx.textBaseline = 'alphabetic';
  drawLS(ctx, text.toUpperCase(), CANVAS.W / 2, y, 5, 'center');
}

// ---------------------------------------------------------------------------
// slide layouts
// ---------------------------------------------------------------------------

function renderCover(ctx, slide) {
  const { W } = CANVAS;
  const maxW = CARD.w - PAD * 2 + 8;

  if (slide.eyebrow) eyebrow(ctx, slide.eyebrow, CARD.y + 186);

  // title — big and dense (a.png fills the frame). Grow to fill, allow 4 lines.
  ctx.fillStyle = PALETTE.white;
  ctx.textBaseline = 'alphabetic';
  let size = slide.titleSize || 92;
  ctx.font = `800 ${size}px ${FONT.x}`;
  let lines = wrap(ctx, slide.title.toUpperCase(), maxW);
  while (lines.length > 4 && size > 60) {
    size -= 5; ctx.font = `800 ${size}px ${FONT.x}`;
    lines = wrap(ctx, slide.title.toUpperCase(), maxW);
  }
  const lh = size * 1.07;
  let ty = CARD.y + 290;
  for (const ln of lines) { drawLS(ctx, ln, W / 2, ty, -size * 0.006, 'center'); ty += lh; }

  // subtitle
  let sBottom = ty - lh + size * 0.2;
  if (slide.subtitle) {
    ctx.fillStyle = PALETTE.sub;
    ctx.font = `600 35px ${FONT.sb}`;
    const sl = wrap(ctx, slide.subtitle, maxW - 40);
    let sy = ty + 34;
    for (const ln of sl) { drawLS(ctx, ln, W / 2, sy, 0.2, 'center'); sy += 50; }
    sBottom = sy - 50;
  }

  // busy scene fills the lower half (hero tile + floating chips)
  const regionTop = sBottom + 40;
  const regionBottom = CARD.y + CARD.h - 70;
  const cy = (regionTop + regionBottom) / 2;
  const scale = Math.min(1.02, (regionBottom - regionTop) / 470);
  drawCoverScene(ctx, W / 2, cy, slide.motif || 'sparkle', scale);
}

const pad2 = (n) => String(n).padStart(2, '0');

// arrow bullet marker at (x, midY); returns nothing
function arrowMark(ctx, x, midY, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x, midY); ctx.lineTo(x + 20, midY);
  ctx.moveTo(x + 12, midY - 7); ctx.lineTo(x + 21, midY); ctx.lineTo(x + 12, midY + 7);
  ctx.stroke();
}

// Left-aligned editorial layout — carries a tag, a fuller description and two
// takeaways so the card reads dense, like a.png (not one short line).
function renderItem(ctx, slide) {
  const LX = CARD.x + PAD, RX = CARD.x + CARD.w - PAD, innerW = RX - LX;
  const topY = CARD.y + 190;
  ctx.textBaseline = 'alphabetic';

  // icon tile, pinned top-right
  iconTile(ctx, RX - 66, topY + 66, 132, slide.motif || 'sparkle');

  // ordinal + tag (top-left)
  ctx.fillStyle = PALETTE.faint;
  ctx.font = `600 22px ${FONT.sb}`;
  drawLS(ctx, `${pad2(slide.index)} / ${pad2(slide.total)}`, LX, topY + 22, 4, 'left');
  if (slide.tag) {
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `800 26px ${FONT.x}`;
    drawLS(ctx, slide.tag.toUpperCase(), LX, topY + 64, 3, 'left');
  }

  // tool name
  ctx.fillStyle = PALETTE.white;
  const ns = 70; ctx.font = `800 ${ns}px ${FONT.x}`;
  const nameLines = wrap(ctx, slide.name, innerW);
  let y = topY + 182;
  for (const ln of nameLines) { drawLS(ctx, ln, LX, y, -0.5, 'left'); y += ns * 1.04; }

  // divider
  y += 14;
  ctx.strokeStyle = PALETTE.hairline; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(LX, y); ctx.lineTo(RX, y); ctx.stroke();

  // description (fuller and bolder — big, heavy body like a.png)
  ctx.fillStyle = PALETTE.white;
  ctx.font = `600 37px ${FONT.sb}`;
  const dl = wrap(ctx, slide.desc, innerW);
  y += 62;
  for (const ln of dl) { drawLS(ctx, ln, LX, y, 0, 'left'); y += 50; }

  // two takeaways with arrow bullets
  if (slide.points?.length) {
    y += 26;
    ctx.font = `700 31px ${FONT.b}`;
    for (const p of slide.points) {
      arrowMark(ctx, LX, y - 11, PALETTE.accent);
      ctx.fillStyle = PALETTE.sub;
      const pl = wrap(ctx, p, innerW - 48);
      for (let i = 0; i < pl.length; i++) { drawLS(ctx, pl[i], LX + 46, y, 0, 'left'); y += 44; }
      y += 18;
    }
  }

  drawPageDots(ctx, slide.index, slide.total + 2); // +cover +closing
}

function renderClosing(ctx, slide) {
  const { W } = CANVAS;
  const maxW = CARD.w - PAD * 2;

  eyebrow(ctx, slide.eyebrow || 'That is the list', CARD.y + 250);

  ctx.fillStyle = PALETTE.white;
  ctx.font = `800 74px ${FONT.x}`;
  ctx.textBaseline = 'alphabetic';
  const lines = wrap(ctx, (slide.title || 'Save this\nfor later').toUpperCase(), maxW);
  const lh = 82;
  let ty = CARD.y + 360;
  for (const ln of lines) { drawLS(ctx, ln, W / 2, ty, 0.005 * 74, 'center'); ty += lh; }

  if (slide.subtitle) {
    ctx.fillStyle = PALETTE.sub;
    ctx.font = `500 30px ${FONT.m}`;
    const sl = wrap(ctx, slide.subtitle, maxW - 40);
    let sy = ty + 20;
    for (const ln of sl) { drawLS(ctx, ln, W / 2, sy, 0.3, 'center'); sy += 44; }
  }

  // big URL CTA (no box, just typography + arrow) — a.md close style
  iconTile(ctx, W / 2, CARD.y + CARD.h * 0.63, 150, slide.motif || 'sparkle');
  ctx.fillStyle = PALETTE.white;
  ctx.font = `800 52px ${FONT.x}`;
  const cy2 = CARD.y + CARD.h * 0.82;
  const url = 'nodeflare.tech';
  const uw = ctx.measureText(url).width;
  drawLS(ctx, url, W / 2 - 24, cy2, 0.2, 'center');
  // arrow after url
  const ax = W / 2 + uw / 2 + 6, ay = cy2 - 16;
  ctx.strokeStyle = PALETTE.white; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 26, ay); ctx.moveTo(ax + 15, ay - 11); ctx.lineTo(ax + 27, ay); ctx.lineTo(ax + 15, ay + 11); ctx.stroke();

  drawPageDots(ctx, slide.total + 1, slide.total + 2);
}

// ---------------------------------------------------------------------------
// public
// ---------------------------------------------------------------------------

export function renderSlide(slide) {
  registerFonts();
  const { W, H } = CANVAS;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  drawShell(ctx, slide.seed ?? 7);
  drawBrand(ctx);
  drawArrowCircle(ctx); // fixed on every slide (a.png chrome)

  if (slide.kind === 'cover') renderCover(ctx, slide);
  else if (slide.kind === 'closing') renderClosing(ctx, slide);
  else renderItem(ctx, slide);

  return canvas.encode('png');
}

export { CANVAS };
