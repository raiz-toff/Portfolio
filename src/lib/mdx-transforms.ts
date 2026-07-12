// The previous Starlight content contains raw HTML with string `style="..."`
// attributes. React (MDX) requires `style` to be an object, so convert them at
// build time. This keeps the source documents authorable in Obsidian as-is.
export function cssStringToObject(css: string) {
  const style: Record<string, string> = {};
  for (const decl of css.split(';')) {
    const idx = decl.indexOf(':');
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (!prop || !value) continue;
    // custom properties (--foo) keep their name; others camelCase
    const key = prop.startsWith('--')
      ? prop
      : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    style[key] = value;
  }
  return style;
}

// Convert an HTML/SVG attribute name to its React/JSX equivalent:
//  - class -> className, for -> htmlFor
//  - keep data-* / aria-* hyphenated (React expects them that way)
//  - camelCase every other hyphenated/namespaced name
//    (stroke-width -> strokeWidth, xlink:href -> xlinkHref, ...)
export function normalizeAttrName(name: string): string {
  if (name === 'class') return 'className';
  if (name === 'for') return 'htmlFor';
  if (/^(data|aria)-/.test(name)) return name;
  if (name.includes('-') || name.includes(':')) {
    return name.replace(/[-:]([a-z])/g, (_, c: string) => c.toUpperCase());
  }
  return name;
}

// Old Starlight paths omit the `/docs` base (e.g. /labs/vlan-labs/). Prefix
// them and drop the trailing slash so internal links resolve under Fumadocs.
export const INTERNAL_SECTION_RE = /^\/(labs|projects|ccna-labs)(\/|$|#|\?)/;
export function rewriteInternalPath(url: string): string {
  if (typeof url !== 'string' || !INTERNAL_SECTION_RE.test(url)) return url;
  const pathOnly = url.split(/[#?]/)[0];
  // leave static assets alone (e.g. /projects/network-map/ROAS.html, images)
  if (/\.[a-zA-Z0-9]+$/.test(pathOnly)) return url;
  const match = url.match(/^([^#?]*)([#?].*)?$/);
  if (!match) return url;
  let path = '/docs' + match[1];
  const rest = match[2] ?? '';
  if (path.endsWith('/')) path = path.slice(0, -1);
  return path + rest;
}
