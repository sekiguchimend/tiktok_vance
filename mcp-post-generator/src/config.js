// Geometry + palette — a faithful, code-only reproduction of a.png.
//
// a.png measured at 608x743 (ratio 0.8183):
//   paper background  #F5F6F7 with subtle per-corner drift (paper texture)
//   rounded card      #3159BC, bbox x60..540 y54..684, radius ~28
//   margins           l60 r68 t54 b59
// We rebuild it at production scale (~1.78x) so it is crisp for TikTok/IG.

export const CANVAS = { W: 1080, H: 1320 }; // ratio 0.818, same as a.png

// Rounded blue card, inset in the paper like the original.
export const CARD = { x: 104, y: 96, w: 872, h: 1128, r: 52 };
export const PAD = 78; // inner padding of the card (a.md: 74 @ scale)

export const PALETTE = {
  paper: '#F5F6F7',
  card: '#3159BC',
  cardDeep: '#274CA6', // slightly darker for tiles/insets
  white: '#FFFFFF',
  sub: 'rgba(255,255,255,0.90)',
  sub2: 'rgba(255,255,255,0.72)',
  faint: 'rgba(255,255,255,0.42)',
  hairline: 'rgba(255,255,255,0.22)',
  accent: '#7C9BE3',
  accent2: '#5C82D8',
  shade: '#E8EDF9',
};

export const BRAND = 'www.nodeflare.tech';

// Font family names as registered in fonts.js
export const FONT = {
  r: 'InterR', // 400
  m: 'InterM', // 500
  sb: 'InterSB', // 600
  b: 'InterB', // 700
  x: 'InterX', // 800
  mono: 'DejaVu Sans Mono',
};
