// Dev-only: draws the original Anatomy-style figures. Usage: node figures.mjs <path to anatomy/kit/iso-kit.mjs> <out dir>
// Kit: https://github.com/wheresryan22/anatomy (MIT). Pages are captured to GIF; the blocks fragment is inlined by build.mjs.
import { writeFileSync } from 'node:fs';
const [KIT, OUT] = process.argv.slice(2);
const k = await import(KIT);
const S = (p, s) => k.solidSvg(p, s), L = (d, s) => k.lineSvg(d, s), D = (p, s) => k.dotsSvg(p, s);
const W = 620, H = 443; // every figure shares this canvas
const page = (name, title, body) => writeFileSync(`${OUT}/${name}.html`, k.pageHtml({ title, theme: 'dark', width: W, body: `<style>html,body{background:#131313!important}</style><div style="width:${W}px">${k.figureSvg({ width: W, height: H, label: title, body: body.join('') })}</div>` }));
const parts = (P) => { const a = []; return { add: (x, y, html) => a.push({ d: k.depthOf([x, y, 0], P), html }), flush: () => a.sort((p, q) => p.d - q.d).map((p) => p.html) }; };

// ---------- post-quantum: a populated four-layer board ----------
{
  const BOARD = { x: -170, y: -115, w: 340, d: 230, r: 6 }, T = 3;
  const P = k.fitProjection([...k.boxCorners(BOARD, -9, 0), [0, 0, 32]], W, H, { pad: 18, azimuth: 42 });
  const o = [`<path class="iso-halo" d="${k.haloOf(BOARD, -9, T, P)}"/>`];
  for (const [x, y] of k.corners(BOARD, 10)) o.push(S(k.cylinder(x, y, 5, -9, 6, P, 16), { tone: 'lo' }));
  o.push(S(k.slabOf(BOARD, -3, 3, P, 6, 1), { tone: 'mid' }));
  o.push(L(k.planOutline(k.insetPlan(BOARD, 5), 0, P), { tone: 'faint' }));
  const traces = [];
  const tr = (pts, flow = false) => traces.push(L(k.onTop(pts, 0, P), { tone: flow ? 'lit' : 'lo', flow }));
  // buses from the SoC to memory, power and I/O
  for (let i = 0; i < 8; i++) {
    const y = -26 + i * 7.4;
    tr([[-34, y], [-62, y], [-62 - i * 3, -66 + i * 2], [-128, -66 + i * 2]], i % 3 === 0);
    tr([[34, y], [66, y], [78 + i * 3, 40 + i * 5], [150, 40 + i * 5]], i % 3 === 1);
  }
  for (let i = 0; i < 7; i++) {
    const x = -24 + i * 8;
    tr([[x, -34], [x, -58], [x + 30, -86], [x + 72, -86]], i % 3 === 2);
    tr([[x, 34], [x, 62], [x - 30, 92], [x - 92, 92]], i % 3 === 0);
  }
  o.push(...traces);
  const vias = [];
  for (let i = 0; i < 26; i++) vias.push([-150 + (i * 47) % 300, -100 + (i * 83) % 200, 0]);
  o.push(D(k.pointsAt(vias, P), { size: 0.9, tone: 'mid' }));
  const items = [];
  const add = (x, y, html) => items.push({ d: k.depthOf([x, y, 0], P), html });
  const chip = (plan, h, tone = 'mid', pins = 0) => {
    const c = [plan.x + plan.w / 2, plan.y + plan.d / 2];
    let s = S(k.slabOf(plan, 0, h, P, 3, 0.5), { tone });
    if (pins) for (let i = 0; i < pins; i++) {
      const px = plan.x + 3 + (i * (plan.w - 6)) / (pins - 1);
      s = L(k.lineOnTop([px, plan.y - 3], [px, plan.y], 0.3, P), { tone: 'hi' }) + L(k.lineOnTop([px, plan.y + plan.d], [px, plan.y + plan.d + 3], 0.3, P), { tone: 'hi' }) + s;
    }
    add(c[0], c[1], s);
  };
  // SoC: BGA substrate, die lid, heat spreader fins
  add(0, 0, S(k.slabOf({ x: -38, y: -38, w: 76, d: 76, r: 2 }, 0, 3, P, 3, 0.6), { tone: 'lo' })
    + S(k.slabOf({ x: -28, y: -28, w: 56, d: 56, r: 2 }, 3, 5, P, 3, 0.8), { tone: 'mid' })
    + Array.from({ length: 9 }, (_, i) => S(k.slabOf({ x: -26 + i * 6, y: -25, w: 2.2, d: 50, r: 0.4 }, 8, 12, P, 2), { tone: 'hi' })).join(''));
  // memory, flash, PMIC, crystal
  for (let i = 0; i < 4; i++) chip({ x: -158 + i * 40, y: -104, w: 32, d: 22, r: 1 }, 5, 'mid', 8);
  chip({ x: 88, y: -100, w: 56, d: 34, r: 1 }, 6, 'mid', 12);
  chip({ x: 90, y: 92 - 90, w: 34, d: 26, r: 1 }, 5, 'lo', 7);
  chip({ x: -150, y: 60, w: 46, d: 40, r: 1 }, 7, 'mid', 10);
  // capacitors and inductors
  for (let i = 0; i < 10; i++) { const [x, y] = [-90 + i * 14, 60]; add(x, y, S(k.cylinder(x, y, 4.2, 0, 11, P, 16, 0.4), { tone: i % 2 ? 'hi' : 'mid' })); }
  for (let i = 0; i < 6; i++) { const [x, y] = [58 + i * 14, -26]; add(x, y, S(k.cylinder(x, y, 3.2, 0, 7, P, 14, 0.3), { tone: 'lo' })); }
  for (let i = 0; i < 18; i++) chip({ x: -92 + i * 7, y: -66, w: 4.4, d: 2.4, r: 0.2 }, 1.4, 'hi');
  for (let i = 0; i < 4; i++) add(-44 + i * 24, 92, S(k.slabOf({ x: -54 + i * 24, y: 82, w: 20, d: 20, r: 2 }, 0, 8, P, 3, 0.6), { tone: 'lo' }) + L(k.ring(-44 + i * 24, 92, 6, 8, P), { tone: 'mid' }));
  // connectors: USB-C shell, pin header, Ethernet jack
  add(150, 84, S(k.slabOf({ x: 134, y: 74, w: 36, d: 22, r: 3 }, 0, 12, P, 4, 0.6), { tone: 'hi' }));
  add(155, 30, S(k.slabOf({ x: 140, y: 6, w: 30, d: 44, r: 1 }, 0, 20, P, 3, 0.8), { tone: 'mid' }));
  for (let i = 0; i < 20; i++) { const [x, y] = [-160 + i * 7, -112 + 218]; add(x, y, S(k.slabOf({ x: x - 2, y: y - 2, w: 4, d: 4, r: 0.3 }, 0, 3, P, 2), { tone: 'lo' }) + L(k.rise([x, y], 3, 11, P), { tone: 'hi' })); }
  o.push(...items.sort((a, b) => a.d - b.d).map((p) => p.html));
  page('pq-board', 'Populated circuit board', o);
}

// ---------- circuits: an IoT sensor node ----------
{
  const B = { x: -170, y: -115, w: 340, d: 230, r: 6 };
  const P = k.fitProjection([...k.boxCorners(B, -9, 0), [140, -90, 74]], W, H, { pad: 16, azimuth: 42 });
  const o = [`<path class="iso-halo" d="${k.haloOf(B, -9, 3, P)}"/>`];
  for (const [x, y] of k.corners(B, 10)) o.push(S(k.cylinder(x, y, 5, -9, 6, P, 16), { tone: 'lo' }));
  o.push(S(k.slabOf(B, -3, 3, P, 6, 1), { tone: 'mid' }), L(k.planOutline(k.insetPlan(B, 5), 0, P), { tone: 'faint' }));
  const tr = (pts, flow = false) => o.push(L(k.onTop(pts, 0, P), { tone: flow ? 'lit' : 'lo', flow }));
  for (let i = 0; i < 8; i++) {
    const y = -20 + i * 6;
    tr([[-24, y], [-56, y], [-74 - i * 3, -56 + i * 3], [-120, -56 + i * 3]], i % 3 === 0);
    tr([[24, y], [50, y], [64 + i * 3, 42 + i * 4], [106, 42 + i * 4]], i % 3 === 1);
    tr([[-18 + i * 5, 24], [-18 + i * 5, 60], [-66 + i * 5, 78], [-96 + i * 5, 78]], i % 4 === 2);
  }
  // meander PCB antenna on the keep-out corner
  const ant = [[62, -26], [96, -26]]; for (let i = 0; i < 9; i++) ant.push([96 + i * 7, i % 2 ? -106 : -40], [96 + (i + 1) * 7, i % 2 ? -106 : -40]);
  o.push(L(k.onTop(ant, 0, P), { tone: 'lit', flow: true }));
  const vias = []; for (let i = 0; i < 30; i++) vias.push([-160 + (i * 47) % 320, -105 + (i * 83) % 210, 0]);
  o.push(D(k.pointsAt(vias, P), { size: 0.8, tone: 'mid' }));
  const q = parts(P);
  const chip = (x, y, w, d, h, tone, pins) => {
    let s = '';
    for (let i = 0; i < pins; i++) { const px = x + 3 + (i * (w - 6)) / (pins - 1); s += L(k.lineOnTop([px, y - 3], [px, y], 0.3, P), { tone: 'hi' }) + L(k.lineOnTop([px, y + d], [px, y + d + 3], 0.3, P), { tone: 'hi' }); }
    q.add(x + w / 2, y + d / 2, s + S(k.slabOf({ x, y, w, d, r: 1 }, 0, h, P, 3, 0.5), { tone }));
  };
  // MCU with exposed die lid, radio under a vented shield can, flash, sensors
  q.add(0, 0, S(k.slabOf({ x: -28, y: -28, w: 56, d: 56, r: 2 }, 0, 4, P, 3, 0.7), { tone: 'lo' }) + S(k.slabOf({ x: -18, y: -18, w: 36, d: 36, r: 1 }, 4, 3, P, 2, 0.6), { tone: 'hi' }));
  q.add(-130, -60, S(k.slabOf({ x: -162, y: -104, w: 76, d: 72, r: 2 }, 0, 14, P, 3, 0.8), { tone: 'mid' }) + D(k.dotGrid(-152, -96, 9, 8, 7, 14, P), { size: 0.9, tone: 'lo' }));
  chip(-154, -14, 40, 28, 5, 'mid', 8);
  chip(40, -20, 30, 22, 4, 'lo', 6);
  chip(116, 30, 42, 30, 5, 'mid', 8);
  q.add(-130, 70, S(k.cylinder(-130, 70, 30, 0, 6, P, 48, 0.6), { tone: 'hi' }) + L(k.ring(-130, 70, 22, 6, P), { tone: 'faint' }));
  for (let i = 0; i < 4; i++) { const x = -58 + i * 26; q.add(x, 92, S(k.slabOf({ x: x - 10, y: 82, w: 20, d: 20, r: 2 }, 0, 7, P, 3, 0.6), { tone: 'lo' }) + L(k.ring(x, 92, 6, 7, P), { tone: 'mid' })); }
  for (let i = 0; i < 9; i++) { const [x, y] = [-40 + i * 11, 46]; q.add(x, y, S(k.cylinder(x, y, 3.8, 0, i % 2 ? 11 : 7, P, 16, 0.4), { tone: i % 2 ? 'hi' : 'mid' })); }
  for (let i = 0; i < 14; i++) { const x = -60 + i * 8; q.add(x, -46, S(k.slabOf({ x: x - 2, y: -48, w: 4.4, d: 2.4, r: 0.2 }, 0, 1.4, P, 2), { tone: 'hi' })); }
  for (let i = 0; i < 10; i++) { const [x, y] = [64 + i * 10, 104]; q.add(x, y, S(k.slabOf({ x: x - 3, y: y - 3, w: 6, d: 6, r: 0.4 }, 0, 3, P, 2), { tone: 'lo' }) + L(k.rise([x, y], 3, 13, P), { tone: 'hi' })); }
  q.add(150, 78, S(k.slabOf({ x: 138, y: 68, w: 32, d: 20, r: 3 }, 0, 10, P, 4, 0.6), { tone: 'hi' }));
  q.add(140, -90, S(k.cylinder(140, -90, 6, 0, 6, P, 18, 0.4), { tone: 'mid' }) + L(k.rise([140, -90], 6, 74, P), { tone: 'hi' }));
  o.push(...q.flush());
  page('circuit', 'IoT sensor node board', o);
}

// ---------- linux: a server rack with a KVM drawer ----------
{
  const R = { x: -60, y: -55, w: 120, d: 110, r: 3 }, TOP = 300, U = 28;
  const P = k.fitProjection([[-130, -105, 0], [130, 105, 0], [-130, 105, TOP + 44], [130, -105, TOP + 44]], W, H, { pad: 14 });
  const o = [];
  const base = { x: -120, y: -100, w: 240, d: 200, r: 6 };
  o.push(`<path class="iso-halo" d="${k.haloOf(base, 0, 6, P)}"/>`, S(k.slabOf(base, 0, 6, P, 6, 1), { tone: 'lo' }));
  for (const [x, y] of k.corners(base, 10)) o.push(S(k.cylinder(x, y, 3.5, 6, 2, P, 12), { tone: 'mid' }));
  o.push(D(k.dotGrid(-110, 66, 34, 4, 6.4, 6, P), { size: 0.6, tone: 'faint' }));
  o.push(S(k.slabOf(R, 6, 8, P, 3, 0.6), { tone: 'mid' }));
  const leds = [];
  for (let u = 0; u < 9; u++) {
    const z = 14 + u * U, drawer = u === 3;
    const s = drawer ? { x: -56, y: -51, w: 112, d: 150, r: 1 } : { x: -56, y: -51, w: 112, d: 102, r: 1 };
    o.push(S(k.slabOf(s, z, U - 3, P, 2, 0.4), { tone: u % 2 ? 'mid' : 'hi' }));
    const f = s.y + s.d, zm = z + (U - 3) / 2;
    if (drawer) {
      for (let r = 0; r < 4; r++) for (let c = 0; c < 15; c++) { const [x, y] = [-48 + c * 6.4, 58 + r * 7]; o.push(S(k.slabOf({ x, y, w: 5, d: 5.2, r: 0.5 }, z + U - 3, 1.2, P, 2), { tone: 'lo' })); }
    } else {
      for (let v = 0; v < 18; v++) o.push(L(k.segment([-22 + v * 3.6, f, z + 6], [-22 + v * 3.6, f, z + U - 9], P), { tone: 'lo' }));
      for (let d = 0; d < 4; d++) o.push(L(k.segment([-50 + d * 7, f, z + 5], [-50 + d * 7, f, z + U - 8], P), { tone: 'faint' }));
      leds.push([46, f, zm + 4], [50.5, f, zm + 4], [46, f, zm - 4]);
    }
  }
  o.push(D(k.pointsAt(leds, P), { size: 1.3, tone: 'hi', pulse: true }));
  for (const [x, y] of [[-60, 55], [60, 55], [60, -55]]) o.push(L(k.rise([x, y], 14, TOP - 6, P), { tone: 'hi' }));
  o.push(S(k.slabOf(R, TOP - 6, 8, P, 3, 0.8), { tone: 'hi' }));
  for (let i = 0; i < 5; i++) o.push(S(k.cylinder(-36 + i * 18, 0, 5, TOP + 2, 4, P, 14, 0.3), { tone: 'mid' }));
  page('linux', 'Linux server rack', o);
}

// ---------- gen ai: an accelerator with stacked HBM around a large die ----------
{
  const B = { x: -165, y: -125, w: 330, d: 250, r: 6 };
  const P = k.fitProjection([...k.boxCorners(B, -9, 0), [0, 0, 44]], W, H, { pad: 16, azimuth: 42 });
  const o = [`<path class="iso-halo" d="${k.haloOf(B, -9, 3, P)}"/>`];
  for (const [x, y] of k.corners(B, 10)) o.push(S(k.cylinder(x, y, 5, -9, 6, P, 16), { tone: 'lo' }));
  o.push(S(k.slabOf(B, -3, 3, P, 6, 1), { tone: 'mid' }), L(k.planOutline(k.insetPlan(B, 5), 0, P), { tone: 'faint' }));
  for (let i = 0; i < 12; i++) {
    const t = -66 + i * 12;
    o.push(L(k.onTop([[t, -72], [t, -92], [t * 1.5, -116]], 0, P), { tone: i % 3 ? 'lo' : 'lit', flow: !(i % 3) }));
    o.push(L(k.onTop([[t, 72], [t, 92], [t * 1.5, 116]], 0, P), { tone: i % 3 === 1 ? 'lit' : 'lo', flow: i % 3 === 1 }));
  }
  const q = parts(P);
  // power stages down both flanks
  for (let i = 0; i < 9; i++) for (const x of [-150, 134]) { const y = -96 + i * 24; q.add(x + 8, y + 8, S(k.slabOf({ x, y, w: 16, d: 16, r: 1 }, 0, 6, P, 2, 0.5), { tone: i % 2 ? 'mid' : 'lo' }) + L(k.ring(x + 8, y + 8, 4.4, 6, P), { tone: 'faint' })); }
  for (let i = 0; i < 12; i++) for (const x of [-120, 108]) { const y = -88 + i * 15; q.add(x, y, S(k.cylinder(x, y, 3.2, 0, 7, P, 14, 0.3), { tone: 'hi' })); }
  o.push(...q.flush());
  // interposer, HBM towers behind and in front of the die
  o.push(S(k.slabOf({ x: -94, y: -70, w: 188, d: 140, r: 2 }, 0, 6, P, 3, 0.8), { tone: 'lo' }));
  const hbm = (x, y) => { let s = ''; for (let z = 0; z < 8; z++) s += S(k.slabOf({ x, y, w: 30, d: 22, r: 0.8 }, 6 + z * 3.2, 2.8, P, 2, 0.2), { tone: z === 7 ? 'hi' : 'mid' }); return s; };
  for (const x of [-84, -15, 54]) o.push(hbm(x, -62));
  o.push(S(k.slabOf({ x: -68, y: -32, w: 136, d: 64, r: 1 }, 6, 7, P, 2, 0.8), { tone: 'mid' }));
  const cores = [];
  for (let i = 0; i < 12; i++) for (let j = 0; j < 5; j++) { const [x, y] = [-60 + i * 10.9, -24 + j * 12]; o.push(L(k.planOutline({ x, y, w: 8, d: 9, r: 0.4 }, 13, P, 2), { tone: 'hi' })); cores.push([x + 4, y + 4.5, 13]); }
  o.push(D(k.pointsAt(cores, P), { size: 1.1, tone: 'hi', pulse: true }));
  for (const x of [-84, -15, 54]) o.push(hbm(x, 40));
  page('genai', 'AI accelerator with stacked memory', o);
}

// ---------- small structures for the name and PQBlocks boxes ----------
const fragment = (file, w, h, label, P, html) => writeFileSync(`${OUT}/${file}.svg`, k.figureSvg({ width: w, height: h, label, standalone: true, body: html.join('') }));
{
  // PQBlocks: a base plate carrying a stepped field of blocks, with traces between them
  const w = 340, h = 150, C = 15, G = 2.5, B = { x: -52, y: -52, w: 104, d: 104, r: 3 };
  const P = k.fitProjection([...k.boxCorners(B, -4, 0), [-52, 52, 66], [52, -52, 66]], w, h, { pad: 4 });
  const o = [S(k.slabOf(B, -4, 4, P, 4, 0.7), { tone: 'lo' }), L(k.planOutline(k.insetPlan(B, 3), 0, P), { tone: 'faint' })];
  const H = [[4, 3, 2, 1, 2], [3, 2, 1, 2, 1], [2, 1, 3, 1, 2], [1, 2, 1, 2, 3], [2, 1, 2, 3, 4]];
  const q = parts(P);
  H.forEach((row, i) => row.forEach((n, j) => {
    const [x, y] = [-44 + i * (C + G), -44 + j * (C + G)];
    let c = ''; for (let z = 0; z < n; z++) c += S(k.slabOf({ x, y, w: C, d: C, r: 0.8 }, z * 12, 10.8, P, 2, 0.4), { tone: z === n - 1 ? 'hi' : 'mid' });
    q.add(x, y, c);
  }));
  fragment('blocks', w, h, 'A field of stacked building blocks', P, [...o, ...q.flush()]);
}
{
  // Name: a GitHub repository as a working machine: file tree, branches, merges, PR gate, CI rack, object store, release
  const w = 480, h = 196, B = { x: -170, y: -82, w: 340, d: 164, r: 3 }, INK = '#f0f6fc';
  const P = k.fitProjection([...k.boxCorners(B, -5, 0), [150, -70, 54], [-20, -60, 34]], w, h, { pad: 2, azimuth: 40 });
  const o = [`<style>
    @keyframes gl{0%,35%{opacity:.12}45%,80%{opacity:1}100%{opacity:.12}}
    @keyframes tw{0%,100%{opacity:.15}50%{opacity:1}}
    .seq{opacity:.12;animation:gl 6s linear infinite}.tw{opacity:.15;animation:tw 3.4s ease-in-out infinite}
    @media (prefers-reduced-motion:reduce){.seq,.tw{animation:none;opacity:1}}
  </style>`];
  o.push(S(k.slabOf(B, -5, 2, P, 3, 0.4), { tone: 'lo' }), S(k.slabOf(k.insetPlan(B, 1), -3, 3, P, 3, 0.5), { tone: 'mid' }), L(k.planOutline(k.insetPlan(B, 4), 0, P), { tone: 'faint' }));
  const q = parts(P), over = [], light = (x, y, z, r, cls, delay) => over.push(`<circle class="${cls}" style="animation-delay:${delay}s" cx="${k.iso([x, y, z], P)[0].toFixed(1)}" cy="${k.iso([x, y, z], P)[1].toFixed(1)}" r="${r}" fill="${INK}"/>`);

  // file tree: folders and files as tiles joined by connectors
  const tree = [[0, 0, 12], [1, 1, 9], [2, 2, 7], [2, 3, 7], [1, 4, 9], [2, 5, 7], [2, 6, 7], [0, 7, 12], [1, 8, 9], [1, 9, 9]];
  tree.forEach(([d, r, wd]) => {
    const [x, y] = [-162 + d * 7, -74 + r * 8];
    if (d) o.push(L(k.onTop([[x - 4, y - 4], [x - 4, y + 2.6], [x, y + 2.6]], 0, P), { tone: 'lo' }));
    q.add(x, y, S(k.slabOf({ x, y, w: wd, d: 5.4, r: 0.4 }, 0, d ? 1.3 : 2.4, P, 2, 0.2), { tone: d ? 'mid' : 'hi' }));
  });
  // contribution grid along the front edge
  for (let i = 0; i < 40; i++) for (let j = 0; j < 4; j++) {
    const [x, y] = [-160 + i * 5.6, 56 + j * 5.6], n = (i * 7 + j * 13) % 5;
    q.add(x, y, S(k.slabOf({ x, y, w: 4.4, d: 4.4, r: 0.3 }, 0, 0.5 + n * 0.75, P, 2), { tone: n > 2 ? 'hi' : n ? 'mid' : 'lo' }));
    if (n > 3) light(x + 2.2, y + 2.2, 0.5 + n * 0.75, 1, 'tw', ((i * 3 + j) % 17) * 0.2);
  }
  // branches: each is a track with commits on it and packets travelling along it
  const MAIN = 0, TRACKS = [
    { pts: [[-104, MAIN], [122, MAIN]], c: [-96, -84, -72, -40, -22, 2, 24, 44, 62, 84, 104], dur: 7, n: 3 },
    { pts: [[-76, MAIN], [-62, -28], [18, -28], [34, MAIN]], c: [-52, -38, -24, -10, 6], dur: 6, n: 2 },
    { pts: [[-44, -28], [-32, -48], [-4, -48], [8, -28]], c: [-24, -13, -3], dur: 5, n: 1 },
    { pts: [[-30, MAIN], [-16, 28], [50, 28], [66, MAIN]], c: [-4, 10, 24, 38], dur: 6.5, n: 2 },
    { pts: [[70, MAIN], [82, -24], [102, -24], [114, MAIN]], c: [88, 98], dur: 4, n: 1 },
  ];
  const packets = [];
  TRACKS.forEach((t, ti) => {
    const y0 = (p) => p; o.push(L(k.onTop(t.pts.map(([x, y]) => [x, y - 1.4]), 0, P), { tone: 'mid' }), L(k.onTop(t.pts.map(([x, y]) => [x, y + 1.4]), 0, P), { tone: 'lo' }));
    for (let n = 0; n < t.n; n++) packets.push(`<circle r="2.1" fill="${INK}"><animateMotion dur="${t.dur}s" begin="${-(n * t.dur) / t.n - ti * 0.7}s" repeatCount="indefinite" path="${k.onTop(t.pts, 3, P)}"/></circle>`);
    const yAt = (x) => { for (let i = 1; i < t.pts.length; i++) { const [a, b] = [t.pts[i - 1], t.pts[i]]; if (x >= a[0] && x <= b[0]) return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0] || 1); } return t.pts[0][1]; };
    t.c.forEach((x, ci) => {
      const y = yAt(x), tall = ti ? 3 : 4.2;
      q.add(x, y, S(k.cylinder(x, y, 3.8, 0, 1, P, 12, 0.2), { tone: 'lo' }) + S(k.cylinder(x, y, 2.6, 1, tall, P, 12, 0.2), { tone: ti ? 'mid' : 'hi' }));
      light(x, y, 1 + tall, 1.1, 'seq', ((ci + ti) * 0.45).toFixed(2));
    });
  });
  // merge junctions
  for (const [x, y] of [[34, MAIN], [66, MAIN], [114, MAIN], [8, -28]]) q.add(x, y, S(k.slabOf({ x: x - 5.5, y: y - 5.5, w: 11, d: 11, r: 0.8 }, 0, 1.8, P, 2, 0.3), { tone: 'lo' }) + S(k.slabOf({ x: x - 3.6, y: y - 3.6, w: 7.2, d: 7.2, r: 0.6 }, 1.8, 6, P, 2, 0.4), { tone: 'hi' }));
  // PR gate: a gantry over the merge point with its required checks
  const gx = 34;
  q.add(gx - 1, -14, L(k.rise([gx - 10, -14], 0, 30, P), { tone: 'hi' }) + L(k.rise([gx + 10, -14], 0, 30, P), { tone: 'hi' }) + S(k.slabOf({ x: gx - 13, y: -17, w: 26, d: 6, r: 0.5 }, 30, 4, P, 2, 0.3), { tone: 'hi' }));
  for (let i = 0; i < 4; i++) light(gx - 9 + i * 6, -14, 34, 1.3, 'seq', (2 + i * 0.5).toFixed(1));
  // CI rack: pipeline stages with status lights running in order
  let rack = S(k.slabOf({ x: 56, y: -74, w: 34, d: 40, r: 0.8 }, 0, 2, P, 2, 0.3), { tone: 'lo' });
  for (let u = 0; u < 6; u++) { rack += S(k.slabOf({ x: 59, y: -71, w: 28, d: 34, r: 0.3 }, 2 + u * 7, 6.2, P, 2, 0.2), { tone: u % 2 ? 'mid' : 'hi' }); for (let l = 0; l < 3; l++) light(66 + l * 6, -37, 5 + u * 7, 0.9, 'seq', (u * 0.55 + l * 0.2).toFixed(2)); }
  q.add(73, -54, rack);
  // object store: pack drawers of blobs, trees and commits
  const towers = [[126, -74, 8], [126, -42, 6], [126, -10, 4], [148, -74, 5], [148, -42, 7]];
  towers.forEach(([x, y, n]) => { let c = S(k.slabOf({ x, y, w: 18, d: 28, r: 0.5 }, 0, 1.5, P, 2, 0.2), { tone: 'lo' }); for (let u = 0; u < n; u++) c += S(k.slabOf({ x: x + 1, y: y + 1, w: 16, d: 26, r: 0.3 }, 1.5 + u * 6, 5.2, P, 2, 0.2), { tone: u % 2 ? 'mid' : 'hi' }); q.add(x + 9, y + 14, c); });
  // original repository emblem: a raised plate carrying a branch-and-merge glyph
  {
    const E = { x: -116, y: -78, w: 46, d: 46, r: 3 }, Z = 6, cx = E.x + 23, cy = E.y + 23;
    q.add(cx, cy, S(k.slabOf(E, 0, 3, P, 3, 0.5), { tone: 'lo' }) + S(k.slabOf(k.insetPlan(E, 3), 3, 3, P, 3, 0.5), { tone: 'hi' })
      + L(k.planOutline(k.insetPlan(E, 6), Z, P), { tone: 'lo' })
      + L(k.lineOnTop([cx - 8, cy - 11], [cx - 8, cy + 11], Z, P), { tone: 'lit' })
      + L(k.onTop([[cx + 8, cy - 11], [cx + 8, cy - 3], [cx - 8, cy + 5]], Z, P), { tone: 'lit' })
      + S(k.cylinder(cx - 8, cy - 11, 3, Z, 2, P, 14, 0.2), { tone: 'mid' }) + S(k.cylinder(cx - 8, cy + 11, 3, Z, 2, P, 14, 0.2), { tone: 'mid' }) + S(k.cylinder(cx + 8, cy - 11, 3, Z, 2, P, 14, 0.2), { tone: 'mid' }));
    [[cx - 8, cy - 11], [cx - 8, cy + 11], [cx + 8, cy - 11]].forEach(([x, y], i) => light(x, y, Z + 2, 1.2, 'seq', (i * 0.6).toFixed(1)));
  }
  // original mascot: a small angular circuit-cat on its own plate, with trace whiskers
  {
    const E = { x: 84, y: 42, w: 32, d: 32, r: 2 }, Z = 5, cx = E.x + 16, cy = E.y + 16;
    const head = [[-8, -3], [-9, -10], [-3, -6], [3, -6], [9, -10], [8, -3], [8, 4], [3, 9], [-3, 9], [-8, 4]].map(([x, y]) => [cx + x, cy + y]);
    q.add(cx, cy, S(k.slabOf(E, 0, 2, P, 3, 0.4), { tone: 'lo' }) + S(k.slabOf(k.insetPlan(E, 2), 2, 3, P, 3, 0.4), { tone: 'mid' })
      + L(k.onTop(head, Z, P, true), { tone: 'lit' })
      + L(k.lineOnTop([cx - 8, cy + 1], [cx - 13, cy - 1], Z, P), { tone: 'hi' }) + L(k.lineOnTop([cx - 8, cy + 3], [cx - 13, cy + 4], Z, P), { tone: 'hi' })
      + L(k.lineOnTop([cx + 8, cy + 1], [cx + 13, cy - 1], Z, P), { tone: 'hi' }) + L(k.lineOnTop([cx + 8, cy + 3], [cx + 13, cy + 4], Z, P), { tone: 'hi' })
      + L(k.onTop([[cx - 1.5, cy + 3], [cx, cy + 4.5], [cx + 1.5, cy + 3]], Z, P), { tone: 'hi' }));
    light(cx - 3.5, cy - 1, Z, 1.1, 'seq', '0.3');
    light(cx + 3.5, cy - 1, Z, 1.1, 'seq', '0.3');
  }
  // release tag and HEAD marker on the newest commit of main
  q.add(122, 0, L(k.rise([122, 0], 0, 26, P), { tone: 'hi' }) + S(k.slabOf({ x: 122, y: -1.2, w: 15, d: 2.4, r: 0.3 }, 26, 7, P, 2, 0.2), { tone: 'hi' }));
  for (const x of [-84, -22, 62]) q.add(x, 9, L(k.rise([x, 9], 0, 14, P), { tone: 'hi' }) + S(k.slabOf({ x: x - 0.8, y: 8, w: 8, d: 2.2, r: 0.3 }, 14, 4, P, 2), { tone: 'mid' }));
  o.push(...q.flush(), ...over, ...packets);
  writeFileSync(`${OUT}/name-structures.svg`, k.figureSvg({ width: w, height: h, label: 'A GitHub repository as a working machine', standalone: true, body: o.join('') }));
}
console.log('figures written');
