// Flat line-art icon library, drawn in a.png's illustration language:
//   fills: white / light blue (#E8EDF9, #7C9BE3), lines: card blue (#3159BC),
//   ~2px strokes, rounded joins, no shadows or gradients.
// Every drawer paints inside a square box centered at (cx,cy) with side `s`.
// Icons are meant to sit on a WHITE tile (see render.js), so lines are blue.
import { PALETTE } from './config.js';

const BLUE = PALETTE.card;
const ACC = PALETTE.accent;
const SHADE = PALETTE.shade;

function setup(ctx, s, lw = 0.05) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2.2, s * lw);
  ctx.strokeStyle = BLUE;
  ctx.fillStyle = '#fff';
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
const P = (cx, cy, s) => (fx, fy) => [cx + fx * s, cy + fy * s]; // fractional -> px

// --- motifs -----------------------------------------------------------------

function robot(ctx, cx, cy, s) {
  setup(ctx, s);
  rr(ctx, cx - s * 0.3, cy - s * 0.22, s * 0.6, s * 0.5, s * 0.12);
  ctx.fillStyle = SHADE; ctx.fill(); ctx.stroke();
  // eyes
  for (const dx of [-0.12, 0.12]) {
    ctx.beginPath(); ctx.arc(cx + dx * s, cy - s * 0.02, s * 0.055, 0, 7); ctx.fillStyle = BLUE; ctx.fill();
  }
  // mouth
  ctx.beginPath(); ctx.moveTo(cx - s * 0.1, cy + s * 0.14); ctx.lineTo(cx + s * 0.1, cy + s * 0.14); ctx.stroke();
  // antenna
  ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.22); ctx.lineTo(cx, cy - s * 0.34); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy - s * 0.38, s * 0.045, 0, 7); ctx.fillStyle = ACC; ctx.fill(); ctx.stroke();
  // ears
  for (const dx of [-0.3, 0.3]) { ctx.beginPath(); ctx.moveTo(cx + dx * s, cy - s * 0.05); ctx.lineTo(cx + dx * s * 1.18, cy - s * 0.05); ctx.lineTo(cx + dx * s * 1.18, cy + s * 0.08); ctx.stroke(); }
}

function chat(ctx, cx, cy, s) {
  setup(ctx, s);
  rr(ctx, cx - s * 0.32, cy - s * 0.3, s * 0.64, s * 0.44, s * 0.1);
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.12, cy + s * 0.14); ctx.lineTo(cx - s * 0.02, cy + s * 0.28); ctx.lineTo(cx + s * 0.06, cy + s * 0.14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  for (const dx of [-0.14, 0, 0.14]) { ctx.beginPath(); ctx.arc(cx + dx * s, cy - s * 0.08, s * 0.035, 0, 7); ctx.fillStyle = ACC; ctx.fill(); }
}

function image(ctx, cx, cy, s) {
  setup(ctx, s);
  rr(ctx, cx - s * 0.32, cy - s * 0.26, s * 0.64, s * 0.52, s * 0.08);
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx - s * 0.12, cy - s * 0.08, s * 0.06, 0, 7); ctx.fillStyle = ACC; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.3, cy + s * 0.18); ctx.lineTo(cx - s * 0.06, cy - s * 0.04); ctx.lineTo(cx + s * 0.08, cy + s * 0.1); ctx.lineTo(cx + s * 0.18, cy); ctx.lineTo(cx + s * 0.32, cy + s * 0.18); ctx.stroke();
}

function video(ctx, cx, cy, s) {
  setup(ctx, s);
  rr(ctx, cx - s * 0.32, cy - s * 0.2, s * 0.46, s * 0.4, s * 0.08);
  ctx.fillStyle = SHADE; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + s * 0.16, cy - s * 0.06); ctx.lineTo(cx + s * 0.32, cy - s * 0.16); ctx.lineTo(cx + s * 0.32, cy + s * 0.16); ctx.lineTo(cx + s * 0.16, cy + s * 0.06); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.12, cy - s * 0.02); ctx.lineTo(cx - s * 0.12, cy + s * 0.06); ctx.lineTo(cx - s * 0.04, cy + s * 0.02); ctx.closePath(); ctx.fillStyle = BLUE; ctx.fill();
}

function code(ctx, cx, cy, s) {
  setup(ctx, s);
  rr(ctx, cx - s * 0.34, cy - s * 0.26, s * 0.68, s * 0.52, s * 0.09);
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.06, cy - s * 0.08); ctx.lineTo(cx - s * 0.16, cy + s * 0.02); ctx.lineTo(cx - s * 0.06, cy + s * 0.12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + s * 0.06, cy - s * 0.08); ctx.lineTo(cx + s * 0.16, cy + s * 0.02); ctx.lineTo(cx + s * 0.06, cy + s * 0.12); ctx.stroke();
}

function search(ctx, cx, cy, s) {
  setup(ctx, s);
  ctx.beginPath(); ctx.arc(cx - s * 0.06, cy - s * 0.06, s * 0.2, 0, 7); ctx.fillStyle = SHADE; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + s * 0.1, cy + s * 0.1); ctx.lineTo(cx + s * 0.28, cy + s * 0.28); ctx.lineWidth = Math.max(3, s * 0.07); ctx.stroke();
}

function brain(ctx, cx, cy, s) {
  setup(ctx, s);
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.26, 0, 7); ctx.fillStyle = SHADE; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.26); ctx.lineTo(cx, cy + s * 0.26); ctx.stroke();
  for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.1); ctx.quadraticCurveTo(cx + sgn * s * 0.16, cy - s * 0.06, cx + sgn * s * 0.1, cy + s * 0.08); ctx.stroke(); }
}

function wand(ctx, cx, cy, s) {
  setup(ctx, s);
  ctx.beginPath(); ctx.moveTo(cx - s * 0.24, cy + s * 0.24); ctx.lineTo(cx + s * 0.14, cy - s * 0.14); ctx.lineWidth = Math.max(3, s * 0.08); ctx.stroke();
  ctx.lineWidth = Math.max(2.2, s * 0.05);
  const star = (px, py, r) => { ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r); } ctx.stroke(); };
  star(cx + s * 0.18, cy - s * 0.2, s * 0.1); star(cx + s * 0.02, cy - s * 0.26, s * 0.06); star(cx + s * 0.26, cy + s * 0.02, s * 0.06);
}

function mic(ctx, cx, cy, s) {
  setup(ctx, s);
  rr(ctx, cx - s * 0.1, cy - s * 0.3, s * 0.2, s * 0.36, s * 0.1);
  ctx.fillStyle = SHADE; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.22, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.22); ctx.lineTo(cx, cy + s * 0.32); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.1, cy + s * 0.32); ctx.lineTo(cx + s * 0.1, cy + s * 0.32); ctx.stroke();
}

function pen(ctx, cx, cy, s) {
  setup(ctx, s);
  ctx.beginPath(); ctx.moveTo(cx - s * 0.24, cy + s * 0.26); ctx.lineTo(cx + s * 0.14, cy - s * 0.12); ctx.lineTo(cx + s * 0.26, cy); ctx.lineTo(cx - s * 0.12, cy + s * 0.38); ctx.lineTo(cx - s * 0.26, cy + s * 0.26); ctx.closePath(); ctx.fillStyle = SHADE; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.24, cy + s * 0.26); ctx.lineTo(cx - s * 0.3, cy + s * 0.34); ctx.lineTo(cx - s * 0.2, cy + s * 0.38); ctx.closePath(); ctx.fillStyle = BLUE; ctx.fill();
}

function doc(ctx, cx, cy, s) {
  setup(ctx, s);
  ctx.beginPath(); ctx.moveTo(cx - s * 0.22, cy - s * 0.3); ctx.lineTo(cx + s * 0.1, cy - s * 0.3); ctx.lineTo(cx + s * 0.24, cy - s * 0.16); ctx.lineTo(cx + s * 0.24, cy + s * 0.3); ctx.lineTo(cx - s * 0.22, cy + s * 0.3); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  for (let i = 0; i < 3; i++) { const y = cy - s * 0.06 + i * s * 0.12; ctx.beginPath(); ctx.moveTo(cx - s * 0.12, y); ctx.lineTo(cx + s * 0.12, y); ctx.strokeStyle = ACC; ctx.stroke(); ctx.strokeStyle = BLUE; }
}

function chart(ctx, cx, cy, s) {
  setup(ctx, s);
  ctx.beginPath(); ctx.moveTo(cx - s * 0.28, cy - s * 0.28); ctx.lineTo(cx - s * 0.28, cy + s * 0.28); ctx.lineTo(cx + s * 0.3, cy + s * 0.28); ctx.stroke();
  const bars = [0.12, 0.24, 0.16, 0.32];
  bars.forEach((h, i) => { const x = cx - s * 0.18 + i * s * 0.13; rr(ctx, x, cy + s * 0.28 - s * h, s * 0.08, s * h, s * 0.02); ctx.fillStyle = i % 2 ? ACC : SHADE; ctx.fill(); ctx.stroke(); });
}

function cloud(ctx, cx, cy, s) {
  setup(ctx, s);
  ctx.beginPath();
  ctx.arc(cx - s * 0.14, cy + s * 0.02, s * 0.14, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(cx - s * 0.02, cy - s * 0.1, s * 0.16, Math.PI, Math.PI * 2);
  ctx.arc(cx + s * 0.16, cy + s * 0.0, s * 0.13, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath(); ctx.fillStyle = SHADE; ctx.fill(); ctx.stroke();
}

function plug(ctx, cx, cy, s) {
  setup(ctx, s);
  rr(ctx, cx - s * 0.34, cy - s * 0.24, s * 0.3, s * 0.48, s * 0.06);
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx - s * 0.26, cy - s * 0.12 + i * s * 0.12, s * 0.028, 0, 7); ctx.fillStyle = ACC; ctx.fill(); }
  ctx.beginPath(); ctx.arc(cx + s * 0.16, cy, s * 0.15, 0, 7); ctx.fillStyle = SHADE; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.04, cy); ctx.lineTo(cx + s * 0.02, cy); ctx.stroke();
}

function shield(ctx, cx, cy, s) {
  setup(ctx, s);
  ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.3); ctx.lineTo(cx + s * 0.24, cy - s * 0.18); ctx.lineTo(cx + s * 0.24, cy + s * 0.06); ctx.quadraticCurveTo(cx + s * 0.24, cy + s * 0.3, cx, cy + s * 0.34); ctx.quadraticCurveTo(cx - s * 0.24, cy + s * 0.3, cx - s * 0.24, cy + s * 0.06); ctx.lineTo(cx - s * 0.24, cy - s * 0.18); ctx.closePath(); ctx.fillStyle = SHADE; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.1, cy); ctx.lineTo(cx - s * 0.02, cy + s * 0.1); ctx.lineTo(cx + s * 0.12, cy - s * 0.1); ctx.lineWidth = Math.max(3, s * 0.06); ctx.stroke();
}

function bolt(ctx, cx, cy, s) {
  setup(ctx, s);
  ctx.beginPath(); ctx.moveTo(cx + s * 0.08, cy - s * 0.3); ctx.lineTo(cx - s * 0.18, cy + s * 0.04); ctx.lineTo(cx, cy + s * 0.04); ctx.lineTo(cx - s * 0.06, cy + s * 0.3); ctx.lineTo(cx + s * 0.2, cy - s * 0.06); ctx.lineTo(cx + s * 0.02, cy - s * 0.06); ctx.closePath(); ctx.fillStyle = ACC; ctx.fill(); ctx.stroke();
}

function globe(ctx, cx, cy, s) {
  setup(ctx, s);
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.26, 0, 7); ctx.fillStyle = SHADE; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, cy, s * 0.1, s * 0.26, 0, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.26, cy); ctx.lineTo(cx + s * 0.26, cy); ctx.stroke();
}

function calendar(ctx, cx, cy, s) {
  setup(ctx, s);
  rr(ctx, cx - s * 0.28, cy - s * 0.24, s * 0.56, s * 0.5, s * 0.06); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.28, cy - s * 0.08); ctx.lineTo(cx + s * 0.28, cy - s * 0.08); ctx.stroke();
  for (const dx of [-0.18, 0.18]) { ctx.beginPath(); ctx.moveTo(cx + dx * s, cy - s * 0.3); ctx.lineTo(cx + dx * s, cy - s * 0.18); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(cx - s * 0.08, cy + s * 0.1, s * 0.04, 0, 7); ctx.fillStyle = ACC; ctx.fill();
}

function mail(ctx, cx, cy, s) {
  setup(ctx, s);
  rr(ctx, cx - s * 0.3, cy - s * 0.2, s * 0.6, s * 0.4, s * 0.06); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.3, cy - s * 0.18); ctx.lineTo(cx, cy + s * 0.06); ctx.lineTo(cx + s * 0.3, cy - s * 0.18); ctx.stroke();
}

function database(ctx, cx, cy, s) {
  setup(ctx, s);
  for (let i = 0; i < 3; i++) { const y = cy - s * 0.18 + i * s * 0.16; ctx.beginPath(); ctx.ellipse(cx, y, s * 0.22, s * 0.08, 0, 0, 7); ctx.fillStyle = i === 0 ? SHADE : '#fff'; ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(cx - s * 0.22, cy - s * 0.18); ctx.lineTo(cx - s * 0.22, cy + s * 0.14); ctx.moveTo(cx + s * 0.22, cy - s * 0.18); ctx.lineTo(cx + s * 0.22, cy + s * 0.14); ctx.stroke();
}

function terminal(ctx, cx, cy, s) {
  setup(ctx, s);
  rr(ctx, cx - s * 0.32, cy - s * 0.24, s * 0.64, s * 0.48, s * 0.07); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.16, cy - s * 0.06); ctx.lineTo(cx - s * 0.06, cy + s * 0.02); ctx.lineTo(cx - s * 0.16, cy + s * 0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + s * 0.0, cy + s * 0.1); ctx.lineTo(cx + s * 0.16, cy + s * 0.1); ctx.strokeStyle = ACC; ctx.stroke();
}

function gear(ctx, cx, cy, s) {
  setup(ctx, s);
  const teeth = 8, ro = s * 0.26, ri = s * 0.18;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) { const a = (i / (teeth * 2)) * Math.PI * 2; const r = i % 2 ? ri : ro; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath(); ctx.fillStyle = SHADE; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.08, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
}

function rocket(ctx, cx, cy, s) {
  setup(ctx, s);
  ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.32); ctx.quadraticCurveTo(cx + s * 0.16, cy - s * 0.05, cx + s * 0.12, cy + s * 0.16); ctx.lineTo(cx - s * 0.12, cy + s * 0.16); ctx.quadraticCurveTo(cx - s * 0.16, cy - s * 0.05, cx, cy - s * 0.32); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy - s * 0.06, s * 0.06, 0, 7); ctx.fillStyle = ACC; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - s * 0.12, cy + s * 0.06); ctx.lineTo(cx - s * 0.24, cy + s * 0.2); ctx.lineTo(cx - s * 0.1, cy + s * 0.16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + s * 0.12, cy + s * 0.06); ctx.lineTo(cx + s * 0.24, cy + s * 0.2); ctx.lineTo(cx + s * 0.1, cy + s * 0.16); ctx.stroke();
}

function palette(ctx, cx, cy, s) {
  setup(ctx, s);
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.26, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  const cols = [ACC, PALETTE.accent2, SHADE, BLUE];
  cols.forEach((c, i) => { const a = (i / 4) * Math.PI * 2 - 0.6; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * s * 0.12, cy + Math.sin(a) * s * 0.12, s * 0.045, 0, 7); ctx.fillStyle = c; ctx.fill(); });
}

function sparkle(ctx, cx, cy, s) {
  setup(ctx, s);
  const star = (px, py, r) => { ctx.beginPath(); ctx.moveTo(px, py - r); ctx.quadraticCurveTo(px + r * 0.16, py - r * 0.16, px + r, py); ctx.quadraticCurveTo(px + r * 0.16, py + r * 0.16, px, py + r); ctx.quadraticCurveTo(px - r * 0.16, py + r * 0.16, px - r, py); ctx.quadraticCurveTo(px - r * 0.16, py - r * 0.16, px, py - r); ctx.closePath(); ctx.fillStyle = ACC; ctx.fill(); ctx.stroke(); };
  star(cx - s * 0.04, cy - s * 0.02, s * 0.22); star(cx + s * 0.2, cy + s * 0.16, s * 0.1);
}

function magnet(ctx, cx, cy, s) {
  setup(ctx, s);
  ctx.beginPath(); ctx.arc(cx, cy - s * 0.02, s * 0.24, Math.PI, 0); ctx.lineTo(cx + s * 0.24, cy + s * 0.2); ctx.lineTo(cx + s * 0.1, cy + s * 0.2); ctx.lineTo(cx + s * 0.1, cy - s * 0.02); ctx.arc(cx, cy - s * 0.02, s * 0.1, 0, Math.PI, true); ctx.lineTo(cx - s * 0.24, cy + s * 0.2); ctx.lineTo(cx - s * 0.1, cy + s * 0.2); ctx.closePath(); ctx.fillStyle = SHADE; ctx.fill(); ctx.stroke();
}

// --- mini decorations for the busy cover scene (a.png style) ----------------

function miniHeart(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.28);
  ctx.bezierCurveTo(cx - s * 0.5, cy - s * 0.05, cx - s * 0.2, cy - s * 0.38, cx, cy - s * 0.12);
  ctx.bezierCurveTo(cx + s * 0.2, cy - s * 0.38, cx + s * 0.5, cy - s * 0.05, cx, cy + s * 0.28);
  ctx.closePath(); ctx.fillStyle = BLUE; ctx.fill();
}
function miniStar(ctx, cx, cy, s) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? s * 0.16 : s * 0.34; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath(); ctx.fillStyle = ACC; ctx.fill();
}
function miniCheck(ctx, cx, cy, s) {
  ctx.lineWidth = Math.max(3, s * 0.14); ctx.strokeStyle = BLUE; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(cx - s * 0.22, cy); ctx.lineTo(cx - s * 0.04, cy + s * 0.18); ctx.lineTo(cx + s * 0.26, cy - s * 0.2); ctx.stroke();
}
function miniBars(ctx, cx, cy, s) {
  const hs = [0.24, 0.4, 0.3]; hs.forEach((h, i) => { const x = cx - s * 0.28 + i * s * 0.24; rr(ctx, x, cy + s * 0.22 - s * h, s * 0.14, s * h, s * 0.04); ctx.fillStyle = i === 1 ? ACC : BLUE; ctx.fill(); });
}
function miniDots(ctx, cx, cy, s) {
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(cx + i * s * 0.28, cy, s * 0.1, 0, 7); ctx.fillStyle = i === 0 ? ACC : BLUE; ctx.fill(); }
}
const MINIS = [miniHeart, miniStar, miniCheck, miniBars, miniDots];

// A small white rounded chip holding a mini icon.
function chip(ctx, cx, cy, s, mini) {
  ctx.save();
  rr(ctx, cx - s / 2, cy - s / 2, s, s, s * 0.28);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(8,24,80,0.28)'; ctx.shadowBlur = s * 0.22; ctx.shadowOffsetY = s * 0.06;
  ctx.fill(); ctx.shadowColor = 'transparent';
  mini(ctx, cx, cy, s * 0.62);
  ctx.restore();
}

// Busy cover scene: a hero tile plus floating chips, like a.png's lower half.
export function drawCoverScene(ctx, cx, cy, hook, scale = 1) {
  const T = 260 * scale; // hero tile
  const c = 104 * scale; // chip size
  // two connective faint rings behind for depth
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, cy, 372 * scale, 250 * scale, 0, 0, 7); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.beginPath(); ctx.ellipse(cx, cy, 300 * scale, 196 * scale, 0, 0, 7); ctx.stroke();
  ctx.restore();
  // floating chips spread across the frame like a.png's busy lower half
  const spots = [
    [cx - 330 * scale, cy - 138 * scale, 0],
    [cx + 328 * scale, cy - 168 * scale, 1],
    [cx + 360 * scale, cy + 78 * scale, 2],
    [cx - 356 * scale, cy + 104 * scale, 3],
    [cx + 168 * scale, cy + 214 * scale, 4],
    [cx - 156 * scale, cy + 224 * scale, 0],
  ];
  for (const [x, y, mi] of spots) chip(ctx, x, y, c, MINIS[mi % MINIS.length]);
  // hero
  ctx.save();
  rr(ctx, cx - T / 2, cy - T / 2, T, T, T * 0.22);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(8,24,80,0.32)'; ctx.shadowBlur = T * 0.15; ctx.shadowOffsetY = T * 0.05;
  ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.restore();
  drawMotif(ctx, hook, cx, cy, T * 0.6);
}

export const MOTIFS = {
  robot, chat, image, video, code, search, brain, wand, mic, pen, doc, chart,
  cloud, plug, shield, bolt, globe, calendar, mail, database, terminal, gear,
  rocket, palette, sparkle, magnet,
};

export function drawMotif(ctx, name, cx, cy, s) {
  ctx.save();
  (MOTIFS[name] || sparkle)(ctx, cx, cy, s);
  ctx.restore();
}

export const MOTIF_NAMES = Object.keys(MOTIFS);
