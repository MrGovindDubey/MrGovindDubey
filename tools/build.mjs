// Renders the monochrome images in assets/, dark to match the Gitly and GitSkins cards. No dependencies; text is vector paths.
// Static: run by hand when the content changes. Live cards on the page come from Gitly and GitSkins.
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const FONTS = JSON.parse(readFileSync(new URL('glyphs.json', import.meta.url)));

// GitHub's own neutral greys. Hierarchy comes from weight and contrast, never from hue.
const THEMES = {
  dark: { key: 'dark', panel: '#131313', line: '#30363d', ink: '#f0f6fc', dim: '#9198a1', faint: '#656c76' },
};
const REDUCE = '@media (prefers-reduced-motion:reduce){*{animation:none!important}}';

class Svg {
  constructor(w, h, title) { Object.assign(this, { w, h, title, used: new Set(), css: '', body: '' }); }
  width(s, font, size, track = 0) {
    const f = FONTS[font];
    return [...s].reduce((t, c) => t + f.glyphs[c].a, 0) * (size / f.upm) + track * (s.length - 1);
  }
  text(s, x, y, size, font, fill, { anchor = 'start', track = 0, attrs = '' } = {}) {
    const f = FONTS[font], k = size / f.upm, w = this.width(s, font, size, track);
    const left = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
    let at = 0, uses = '';
    for (const c of s) {
      const g = f.glyphs[c];
      if (!g) throw new Error(`no glyph ${c} in font ${font}: extend tools/make_glyphs.py`);
      if (g.d) { this.used.add(font + c); uses += `<use href="#${font}${c.codePointAt(0)}" x="${Math.round(at)}"/>`; }
      at += g.a + track / k;
    }
    return `<g transform="translate(${+left.toFixed(2)} ${+y.toFixed(2)}) scale(${+k.toFixed(5)})" fill="${fill}" ${attrs}>${uses}</g>`;
  }
  add(s) { this.body += s; return this; }
  toString() {
    const glyphs = [...this.used].map((u) => `<path id="${u[0]}${u.slice(1).codePointAt(0)}" d="${FONTS[u[0]].glyphs[u.slice(1)].d}"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" role="img"><title>${this.title}</title><style>${this.css}${REDUCE}</style><defs>${glyphs}</defs>${this.body}</svg>\n`;
  }
}
const save = (name, t, svg) => writeFileSync(`${root}assets/${name}-${t.key}.svg`, String(svg));
// Panel with registration marks at the corners and one light travelling the edge.
function panel(s, t, { flow = true } = {}) {
  const { w: W, h: H } = s, b = 10, m = 7;
  const perim = 2 * (W + H - 4);
  s.add(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="${t.panel}" stroke="${t.line}"/>`);
  if (flow) {
    s.css += `.flow{stroke-dasharray:${Math.round(perim * 0.05)} ${Math.round(perim * 0.95)};animation:flow 12s linear infinite}@keyframes flow{to{stroke-dashoffset:${-Math.round(perim)}}}`;
    s.add(`<rect class="flow" x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="${t.ink}" stroke-width="1.4"/>`);
  }
  s.add(`<path d="M${m} ${m + b}V${m}H${m + b}M${W - m - b} ${m}H${W - m}V${m + b}M${W - m} ${H - m - b}V${H - m}H${W - m - b}M${m + b} ${H - m}H${m}V${H - m - b}" fill="none" stroke="${t.faint}"/>`);
}

// ---------- name banner, dark so it reads on both GitHub themes ----------
function banner(t) {
  const W = 860, H = 120;
  const s = new Svg(W, H, 'Govind Dubey');
  panel(s, t, { flow: false });
  s.add(s.text('Govind Dubey', W / 2, 80, 62, 's', t.ink, { anchor: 'middle', track: -1 }));
  save('name', t, s);
}

// ---------- PQBlocks box, with small Anatomy-kit structures ----------
function pqblocks(t) {
  const W = 860, H = 150;
  const s = new Svg(W, H, 'PQBlocks: verified building blocks for the post-quantum transition');
  panel(s, t);
  const blocks = readFileSync(new URL('blocks.svg', import.meta.url), 'utf8').replace('<svg ', `<svg x="${W - 280}" y="19" width="250" height="112" `);
  s.add(blocks);
  s.add(s.text('PQBLOCKS', 34, 62, 36, 's', t.ink, { track: 1.5 }));
  s.add(s.text('Verified building blocks for the post-quantum transition.', 34, 92, 16, 'b', t.dim));
  s.add(s.text('29 open-source packages / Apache-2.0 / pqblocks.github.io', 34, 118, 12.5, 'm', t.ink));
  save('pqblocks', t, s);
}

for (const t of Object.values(THEMES)) {
  banner(t);
  pqblocks(t);
}
console.log('built pqblocks box');
