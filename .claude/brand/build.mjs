import sharp from "sharp";
import { writeFileSync } from "fs";
import { C, markSvgInner, markSvg, BLOCK } from "./gen.mjs";
const OUT = process.env.SCRATCH;

// Striped bars carry a hairline ink edge (opacity .2) so the cream
// conductors hold their silhouette on white pages — invisible on dark,
// a whisper on paper. Chosen against no-edge/.12/.28 variants by eye.
const EDGE = { edge: 0.2, edgeWidth: 3.5 };
// Icon tiles outline every bar a touch harder: at 16–96px the extra
// definition is what keeps the letters apart.
const TILE_EDGE = { edge: 0.3, edgeAll: true, edgeWidth: 4 };

// ── tight master (also the CSS-mask source, so no padding) ──────────
const tight = (opts) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BLOCK.w} ${BLOCK.h}">` +
  markSvgInner(opts) + `</svg>`;
writeFileSync("public/logo.svg", tight({ band: 46, ...EDGE, idp: "lg" }));

// ── favicon.svg — paper card, solid conductors (stripes ≤32px = noise);
// tile swaps to warm charcoal for dark-scheme tabs via embedded media query
const faviconTile = (extra = {}) =>
  markSvg(128, { solidOnly: true, bg: C.paper, rx: 28 / 128, pad: 0.11, ...TILE_EDGE, ...extra });
writeFileSync("public/favicon.svg", faviconTile({ darkTile: "#201e1a" }));

// ── React header mark (striped; header renders 40px CSS ≈ 80px retina)
const jsx = markSvgInner({ band: 46, ...EDGE, idp: "rnm" })
  .replaceAll("clip-path=", "clipPath=")
  .replaceAll("stroke-opacity=", "strokeOpacity=")
  .replaceAll("stroke-width=", "strokeWidth=");
writeFileSync("src/components/rn-mark.tsx",
`// Rajkumar's "RN" brand mark — the initials built from the 8 conductors
// of a twisted pair in T568B pin order: wht/org, org, wht/grn, blu,
// wht/blu, grn, wht/brn, brn. Striped conductors carry perpendicular
// ring-bands like real ring-marked insulation; solids cross over them.
// Generated geometry — regenerate via the brand script rather than
// editing coordinates by hand.
export default function RNMark(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${BLOCK.w} ${BLOCK.h}"
      aria-hidden
      {...props}
    >
      ${jsx}
    </svg>
  );
}
`);

// ── PNG set ─────────────────────────────────────────────────────────
const png = (svg, size, file) =>
  sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(file);
await png(markSvg(512, { band: 46, ...EDGE, bg: C.paper, rx: 0.208, pad: 0.11 }), 96, "public/favicon-96x96.png");
await png(markSvg(512, { band: 46, ...EDGE, bg: C.paper, pad: 0.14 }), 180, "public/apple-touch-icon.png");            // iOS masks its own radius
await png(markSvg(512, { band: 46, ...EDGE, bg: C.paper, pad: 0.18 }), 192, "public/web-app-manifest-192x192.png");    // maskable safe zone
await png(markSvg(512, { band: 46, ...EDGE, bg: C.paper, pad: 0.18 }), 512, "public/web-app-manifest-512x512.png");
// "any"-purpose launcher icons: rounded card, transparent corners
await png(markSvg(512, { band: 46, ...EDGE, bg: C.paper, rx: 0.208, pad: 0.11 }), 192, "public/icon-192x192.png");
await png(markSvg(512, { band: 46, ...EDGE, bg: C.paper, rx: 0.208, pad: 0.11 }), 512, "public/icon-512x512.png");
await sharp(Buffer.from(tight({ band: 46, ...EDGE, idp: "lp" })), { density: 300 })
  .resize(1024, Math.round(1024 * BLOCK.h / BLOCK.w)).png().toFile("public/logo.png");

// ── favicon.ico — PNG-encoded entries (16/32/48), solid variant ─────
const icoSizes = [16, 32, 48];
const blobs = [];
for (const s of icoSizes)
  blobs.push(await sharp(Buffer.from(faviconTile()), { density: 300 })
    .resize(s, s).png().toBuffer());
const hdr = Buffer.alloc(6 + 16 * icoSizes.length);
hdr.writeUInt16LE(0, 0); hdr.writeUInt16LE(1, 2); hdr.writeUInt16LE(icoSizes.length, 4);
let off = hdr.length;
icoSizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  hdr.writeUInt8(s === 256 ? 0 : s, e); hdr.writeUInt8(s === 256 ? 0 : s, e + 1);
  hdr.writeUInt16LE(1, e + 4); hdr.writeUInt16LE(32, e + 6);
  hdr.writeUInt32LE(blobs[i].length, e + 8); hdr.writeUInt32LE(off, e + 12);
  off += blobs[i].length;
});
writeFileSync("src/app/favicon.ico", Buffer.concat([hdr, ...blobs]));

// ── social card 2848×1504 — mark + pixel wordmark (hero's 5×7 glyphs)
const G = {
  R: ["11110","10001","10001","11110","10100","10010","10001"],
  A: ["01110","10001","10001","11111","10001","10001","10001"],
  J: ["00111","00010","00010","00010","00010","10010","01100"],
  K: ["10001","10010","10100","11000","10100","10010","10001"],
  U: ["10001","10001","10001","10001","10001","10001","01110"],
  M: ["10001","11011","10101","10101","10001","10001","10001"],
  N: ["10001","11001","10101","10011","10001","10001","10001"],
  E: ["11111","10000","10000","11110","10000","10000","11111"],
  P: ["11110","10001","10001","11110","10000","10000","10000"],
  T: ["11111","00100","00100","00100","00100","00100","00100"],
  W: ["10001","10001","10001","10101","10101","10101","01010"],
  O: ["01110","10001","10001","10001","10001","10001","01110"],
  G: ["01110","10001","10000","10111","10001","10001","01110"],
  I: ["11111","00100","00100","00100","00100","00100","11111"],
  " ": ["00000","00000","00000","00000","00000","00000","00000"],
};
function pixelText(text, x, y, cell, fill) {
  let out = "", cx = x;
  const sq = cell * 0.88;
  for (const ch of text) {
    const g = G[ch]; if (!g) { cx += cell * 3; continue; }
    g.forEach((row, ry) => [...row].forEach((b, rx) => {
      if (b === "1") out += `<rect x="${(cx + rx * cell).toFixed(1)}" y="${(y + ry * cell).toFixed(1)}" width="${sq.toFixed(1)}" height="${sq.toFixed(1)}" fill="${fill}"/>`;
    }));
    cx += cell * 6;
  }
  return out;
}
const SW = 1424, SH = 752, mh = 320, ms = mh / BLOCK.h;
const social =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SW} ${SH}">` +
  `<rect width="${SW}" height="${SH}" fill="${C.paper}"/>` +
  `<g transform="translate(96,${(SH - mh) / 2}) scale(${ms})">${markSvgInner({ band: 46, ...EDGE, idp: "sc" })}</g>` +
  pixelText("RAJKUMAR", 648, 228, 14, C.ink) +
  pixelText("NEUPANE", 648, 352, 14, C.ink) +
  `<rect x="648" y="482" width="560" height="2" fill="#18181b" opacity="0.18"/>` +
  pixelText("NETWORK ENGINEER", 648, 508, 6, "#77705f") +
  // bottom edge: the cable cross-section — 8 conductors in T568B pin
  // order; striped pins rendered as cream-over-color split pairs.
  [C.orange, C.orange, C.green, C.blue, C.blue, C.green, C.brown, C.brown]
    .map((col, i) => {
      const w = SW / 8, x = i * w, striped = i % 2 === 0;
      if (!striped) return `<rect x="${x}" y="${SH - 12}" width="${w}" height="12" fill="${col}"/>`;
      // ring-marked pin: color–cream–color–cream–color along its length
      const sub = w / 5;
      return [col, C.cream, col, C.cream, col]
        .map((f, j) => `<rect x="${(x + j * sub).toFixed(1)}" y="${SH - 12}" width="${sub.toFixed(1)}" height="12" fill="${f}"/>`)
        .join("");
    }).join("") +
  `</svg>`;
await sharp(Buffer.from(social), { density: 300 }).resize(2848, 1504).png().toFile("public/social.png");
console.log("build ok");
