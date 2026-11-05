// Renders the monochrome images in assets/, dark to match the Gitly and GitSkins cards. No dependencies; text is vector paths.
// Static: run by hand when the content changes. Live cards on the page come from Gitly and GitSkins.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const FONTS = JSON.parse(readFileSync(new URL('glyphs.json', import.meta.url)));

// GitHub's own neutral greys. Hierarchy comes from weight and contrast, never from hue.
const THEMES = {
  dark: { key: 'dark', panel: '#0d1117', line: '#30363d', ink: '#f0f6fc', dim: '#9198a1', faint: '#656c76' },
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

// ---------- a real TLS 1.3 hybrid handshake, played in order ----------
const FLIGHT = [
  ['ClientHello', 'key_share: X25519MLKEM768', 1],
  ['ServerHello', 'key_share: X25519 + ML-KEM ciphertext', -1],
  ['{Certificate}', 'chain of trust', -1],
  ['{CertificateVerify}', 'sig: ML-DSA-65', -1],
  ['{Finished}', 'server transcript MAC', -1],
  ['{Finished}', 'client transcript MAC', 1],
];
function handshake(t) {
  const W = 860, rowH = 42, top = 74, H = top + rowH * FLIGHT.length + 56, xa = 110, xb = W - 110;
  const s = new Svg(W, H, 'A TLS 1.3 handshake with hybrid post-quantum key exchange');
  const T = 14, n = FLIGHT.length, slot = 80 / n;
  panel(s, t, { flow: false });
  s.add(s.text('CLIENT', xa, 46, 13, 'm', t.ink, { anchor: 'middle', track: 2 }));
  s.add(s.text('SERVER', xb, 46, 13, 'm', t.ink, { anchor: 'middle', track: 2 }));
  s.add(`<path d="M${xa} 58V${H - 50}M${xb} 58V${H - 50}" stroke="${t.faint}" stroke-dasharray="3 4"/>`);
  FLIGHT.forEach(([msg, note, dir], i) => {
    const y = top + rowH * i + 22, a = (slot * i).toFixed(1), b = (slot * i + slot).toFixed(1);
    const [from, to] = dir > 0 ? [xa, xb] : [xb, xa];
    s.css += `.m${i}{animation:m${i} ${T}s linear infinite}@keyframes m${i}{0%,${a}%{opacity:.18}${(+a + 1).toFixed(1)}%,97%{opacity:1}100%{opacity:.18}}`;
    s.css += `.p${i}{opacity:0;animation:p${i} ${T}s linear infinite}@keyframes p${i}{0%,${a}%{opacity:0;transform:translateX(0)}${(+a + .5).toFixed(1)}%{opacity:1;transform:translateX(0)}${b}%{opacity:1;transform:translateX(${to - from}px)}${(+b + .5).toFixed(1)}%,100%{opacity:0;transform:translateX(${to - from}px)}}`;
    s.add(`<g class="m${i}"><line x1="${xa + 2}" y1="${y}" x2="${xb - 2}" y2="${y}" stroke="${t.dim}"/><path d="M${to} ${y}l${-10 * dir} -5v10z" fill="${t.ink}"/>`);
    const wm = s.width(msg, 'm', 14.5), wn = s.width(note, 'm', 12.5), lx = W / 2 - (wm + 14 + wn) / 2;
    s.add(s.text(msg, lx, y - 8, 14.5, 'm', t.ink));
    s.add(s.text(note, lx + wm + 14, y - 8, 12.5, 'm', t.dim));
    s.add(`</g><circle class="p${i}" cx="${from}" cy="${y}" r="5" fill="${t.ink}"/>`);
  });
  s.css += `.ok{animation:ok ${T}s linear infinite}@keyframes ok{0%,80%{opacity:0}82%,97%{opacity:1}100%{opacity:0}}`;
  s.add(s.text('QUANTUM-RESISTANT CHANNEL ESTABLISHED', W / 2, H - 22, 13, 'm', t.ink, { anchor: 'middle', track: 2, attrs: 'class="ok"' }));
  save('handshake', t, s);
}

// ---------- signature seal ----------
function seal(t) {
  const pub = Buffer.from(readFileSync(`${root}identity.pub`, 'utf8').trim(), 'base64');
  const fp = createHash('sha256').update(pub).digest('hex');
  const W = 860, H = 128;
  const s = new Svg(W, H, `This README is signed with ML-DSA-65. Key fingerprint ${fp}`);
  panel(s, t);
  s.css += `.sp{animation:sp 12s linear infinite;transform-origin:68px 64px}@keyframes sp{to{transform:rotate(360deg)}}`;
  s.add(`<g class="sp"><circle cx="68" cy="64" r="34" fill="none" stroke="${t.dim}" stroke-dasharray="6 5"/></g><circle cx="68" cy="64" r="25" fill="none" stroke="${t.ink}"/><path d="M57 65l8 8 14-17" fill="none" stroke="${t.ink}" stroke-width="3"/>`);
  s.add(s.text('Post-quantum signed', 124, 46, 22, 's', t.ink));
  s.add(s.text(`ML-DSA-65 (FIPS 204) / public key ${pub.length} bytes`, 124, 70, 12.5, 'm', t.dim));
  s.add(s.text(`SHA-256 ${fp.slice(0, 32)}`, 124, 92, 12.5, 'm', t.ink));
  s.add(s.text(`        ${fp.slice(32)}`, 124, 108, 12.5, 'm', t.ink));
  save('seal', t, s);
}

for (const t of Object.values(THEMES)) {
  handshake(t);
  seal(t);
}
console.log('built handshake, seal');
