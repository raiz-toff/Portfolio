// RN monogram — "initials punched down in T568B order".
// 8 strokes = 8 conductors: wo o wg bl wbl g wbr br (striped/solid alternating).
import sharp from "sharp";
import { writeFileSync } from "fs";
const OUT = process.env.SCRATCH;

// ── palette (vintage-signal tuning of the T568 insulation colors) ──
export const C = {
  orange: "#D9711F",
  blue:   "#2B5799",
  green:  "#2E7D46",
  brown:  "#63452E",
  cream:  "#F1EBDE", // the "white" conductor
  paper:  "#E8E4DA", // card / favicon ground
  ink:    "#18181b", // zinc-950 for lockup text
};

// ── geometry ────────────────────────────────────────────────────────
const W = 64, H = 400;
const RW = 256, GAP = 72, NX = RW + GAP, BW = NX + RW; // 584 x 400

const v = (x, y) => [x, y];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, s) => [a[0] * s, a[1] * s];
const len = (a) => Math.hypot(a[0], a[1]);
const norm = (a) => mul(a, 1 / len(a));
const perp = (a) => [-a[1], a[0]];

function rectBar(x, y, w, h) {
  const poly = [v(x, y), v(x + w, y), v(x + w, y + h), v(x, y + h)];
  return h >= w
    ? { poly, p1: v(x + w / 2, y), p2: v(x + w / 2, y + h) }
    : { poly, p1: v(x, y + h / 2), p2: v(x + w, y + h / 2) };
}
// diagonal bar, horizontal top/bottom edges, perpendicular width forced to W
function diagBar(xtc, y0, xbc, y1) {
  const ang = Math.atan(Math.abs(xbc - xtc) / (y1 - y0));
  const hw = W / Math.cos(ang);
  const poly = [v(xtc - hw / 2, y0), v(xtc + hw / 2, y0), v(xbc + hw / 2, y1), v(xbc - hw / 2, y1)];
  return { poly, p1: v(xtc, y0), p2: v(xbc, y1) };
}

// Draw order = the weave. Striped verticals sit UNDER the solid
// horizontals (the R's bars cross over its uprights, like the
// reference); the leg tucks under the mid bar; the N's striped
// diagonal lays OVER both uprights.
// bands: {from,to} = visible run along the axis, phase-controlled so
// the visible window alternates cleanly against neighbouring solids.
function bars() {
  return [
    { id: "stem", pin: 1, color: C.orange, striped: true, ...rectBar(0, 0, W, H),
      bands: { from: W, to: H, startColor: false } },          // cream first (under orange bar), color at baseline
    { id: "bowl", pin: 3, color: C.green, striped: true, ...rectBar(RW - W, 0, W, 232),
      bands: { from: W, to: 168, startColor: true } },         // green–cream–green window
    { id: "leg",  pin: 5, color: C.blue, striped: true, ...diagBar(112, 208, RW - 46, H),
      bands: { from: 24, to: null, startColor: false } },      // emerges cream below mid bar, blue at baseline
    { id: "top",  pin: 2, color: C.orange, striped: false, ...rectBar(0, 0, RW, W) },
    { id: "mid",  pin: 4, color: C.blue,   striped: false, ...rectBar(0, 168, RW, W) },
    { id: "nL",   pin: 6, color: C.green,  striped: false, ...rectBar(NX, 0, W, H) },
    { id: "nR",   pin: 8, color: C.brown,  striped: false, ...rectBar(NX + RW - W, 0, W, H) },
    { id: "nDiag",pin: 7, color: C.brown, striped: true, ...diagBar(NX + W - 10, 0, NX + RW - W + 10, H),
      bands: { from: 0, to: null, startColor: true } },        // free-standing: color at both ends
  ];
}

// ── svg emit ────────────────────────────────────────────────────────
const P = (poly) => poly.map((p) => p.map((n) => +n.toFixed(2)).join(",")).join(" ");

// hairline boundary that defines a bar's silhouette on backgrounds the
// cream would otherwise dissolve into (white pages, near-paper grounds);
// ink at low alpha vanishes on dark, whispers on paper, defines on white
function edgeStroke(poly, edge, edgeWidth) {
  if (!edge) return "";
  return `<polygon points="${P(poly)}" fill="none" stroke="${C.ink}" stroke-opacity="${edge}" stroke-width="${edgeWidth}"/>`;
}

function stripedFill(bar, idp, target, edge, edgeWidth) {
  const axis = sub(bar.p2, bar.p1), L = len(axis);
  const u = norm(axis), n = perp(u);
  const from = bar.bands.from ?? 0, to = bar.bands.to ?? L;
  const run = to - from;
  // segment count: ends of the visible run controlled by startColor and
  // "end on color" (k parity). startColor + color-end → odd k; else even.
  let k = Math.max(2, Math.round(run / target));
  if (bar.bands.startColor && k % 2 === 0) k += 1;       // color…color → odd
  if (!bar.bands.startColor && k % 2 === 1) k += 1;      // cream…color → even
  const seg = run / k;
  let out = `<clipPath id="c${idp}"><polygon points="${P(bar.poly)}"/></clipPath>`;
  out += `<g clip-path="url(#c${idp})"><polygon points="${P(bar.poly)}" fill="${C.cream}"/>`;
  const first = bar.bands.startColor ? 0 : 1;
  for (let i = first; i < k; i += 2) {
    const c0 = add(bar.p1, mul(u, from + seg * i)), c1 = add(bar.p1, mul(u, from + seg * (i + 1)));
    const e = mul(n, W);
    out += `<polygon points="${P([add(c0, e), sub(c0, e), sub(c1, e), add(c1, e)])}" fill="${bar.color}"/>`;
  }
  return out + `</g>` + edgeStroke(bar.poly, edge, edgeWidth);
}

export function markSvgInner(opts = {}) {
  const {
    band = 46, solidOnly = false, idp = "m",
    edge = 0,          // stroke-opacity of the striped bars' silhouette line
    edgeAll = false,   // also outline solid bars (print-registration look)
    edgeWidth = 3,
  } = opts;
  let out = "";
  bars().forEach((b, i) => {
    if (b.striped && !solidOnly) out += stripedFill(b, `${idp}${i}`, band, edge, edgeWidth);
    else out += `<polygon points="${P(b.poly)}" fill="${b.color}"/>` +
      (edgeAll ? edgeStroke(b.poly, edge, edgeWidth) : "");
  });
  return out;
}
export const BLOCK = { w: BW, h: H };

export function markSvg(size, opts = {}) {
  const pad = opts.pad ?? 0.09;
  const s = (1 - 2 * pad) * size / Math.max(BW, H);
  const tx = (size - BW * s) / 2, ty = (size - H * s) / 2;
  // darkTile: browsers honor the media query when this svg is a favicon;
  // raster pipelines (librsvg) ignore it and render the light tile.
  const style = opts.bg && opts.darkTile
    ? `<style>@media (prefers-color-scheme: dark){.tile{fill:${opts.darkTile}}}</style>` : "";
  const bg = opts.bg ? `<rect class="tile" width="${size}" height="${size}" rx="${(size * (opts.rx ?? 0)).toFixed(1)}" fill="${opts.bg}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${style}${bg}` +
    `<g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${s.toFixed(4)})">` +
    markSvgInner(opts) + `</g></svg>`;
}

// ── preview run ─────────────────────────────────────────────────────
if (process.argv[2] === "preview") {
  const variants = [
    ["band46",  { band: 46 }],
    ["band64",  { band: 64 }],
    ["band100", { band: 100 }],
    ["solid",   { solidOnly: true }],
  ];
  for (const [name, o] of variants) {
    writeFileSync(`${OUT}/${name}.svg`, markSvg(640, o));
    await sharp(`${OUT}/${name}.svg`, { density: 300 })
      .resize(512, 512, { fit: "contain", background: C.paper })
      .flatten({ background: C.paper }).png().toFile(`${OUT}/v-${name}-512.png`);
  }
  // 80px = header at 40 CSS px on a retina screen; 40 = non-retina header
  const sizes = [96, 80, 40, 32];
  const cells = [];
  for (const [name] of variants)
    for (const s of sizes)
      cells.push(await sharp(`${OUT}/${name}.svg`, { density: 300 })
        .resize(s, s, { fit: "contain", background: C.paper })
        .flatten({ background: C.paper })
        .extend({ top: Math.floor((108 - s) / 2), bottom: Math.ceil((108 - s) / 2), left: Math.floor((116 - s) / 2), right: Math.ceil((116 - s) / 2), background: C.paper })
        .toBuffer());
  await sharp({ create: { width: 116 * sizes.length, height: 108 * variants.length, channels: 3, background: C.paper } })
    .composite(cells.map((b, i) => ({ input: b, left: 116 * (i % sizes.length), top: 108 * Math.floor(i / sizes.length) })))
    .png().toFile(`${OUT}/v-sheet-small.png`);
  console.log("preview ok");
}
