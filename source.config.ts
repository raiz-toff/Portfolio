import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';

// The previous Starlight content contains raw HTML with string `style="..."`
// attributes. React (MDX) requires `style` to be an object, so convert them at
// build time. This keeps the source documents authorable in Obsidian as-is.
function cssStringToObject(css: string) {
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

function objectToEstree(obj: Record<string, string>): any {
  return {
    type: 'Program',
    sourceType: 'module',
    body: [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'ObjectExpression',
          properties: Object.entries(obj).map(([key, value]) => ({
            type: 'Property',
            method: false,
            shorthand: false,
            computed: false,
            kind: 'init',
            key: /^[A-Za-z_$][\w$]*$/.test(key)
              ? { type: 'Identifier', name: key }
              : { type: 'Literal', value: key },
            value: { type: 'Literal', value: String(value) },
          })),
        },
      },
    ],
  };
}

// Convert fenced ```mermaid code blocks into <Mermaid chart="..." /> so the
// diagrams render via the client component instead of showing as raw code.
function remarkMermaid() {
  const visit = (node: any, parent: any, index: number | null) => {
    if (node?.type === 'code' && node.lang === 'mermaid' && parent && index !== null) {
      parent.children[index] = {
        type: 'mdxJsxFlowElement',
        name: 'Mermaid',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'chart', value: node.value },
        ],
        children: [],
      };
      return;
    }
    if (Array.isArray(node?.children)) {
      node.children.forEach((child: any, i: number) => visit(child, node, i));
    }
  };
  return (tree: any) => visit(tree, null, null);
}

// Convert an HTML/SVG attribute name to its React/JSX equivalent:
//  - class -> className, for -> htmlFor
//  - keep data-* / aria-* hyphenated (React expects them that way)
//  - camelCase every other hyphenated/namespaced name
//    (stroke-width -> strokeWidth, xlink:href -> xlinkHref, ...)
function normalizeAttrName(name: string): string {
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
const INTERNAL_SECTION_RE = /^\/(labs|projects|ccna-labs)(\/|$|#|\?)/;
function rewriteInternalPath(url: string): string {
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

// Fix raw HTML authored for Starlight so it is valid React/JSX:
//  - raw <p> -> <div> so markdown paragraphs inside don't nest <p> in <p>
//  - normalize attribute names (class, stroke-width, etc.)
//  - rewrite internal links to the /docs base (raw <a> and markdown links)
function remarkFixJsxHtml() {
  const visit = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'link' && typeof node.url === 'string') {
      node.url = rewriteInternalPath(node.url);
    }
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (node.name === 'p') node.name = 'div';
      if (Array.isArray(node.attributes)) {
        for (const attr of node.attributes) {
          if (attr.type !== 'mdxJsxAttribute') continue;
          if (attr.name === 'href' && typeof attr.value === 'string') {
            attr.value = rewriteInternalPath(attr.value);
          }
          attr.name = normalizeAttrName(attr.name);
        }
      }
    }
    if (Array.isArray(node.children)) node.children.forEach(visit);
  };
  return (tree: any) => visit(tree);
}

function remarkStyleStringToObject() {
  const visit = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (
      (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
      Array.isArray(node.attributes)
    ) {
      for (const attr of node.attributes) {
        if (attr.type === 'mdxJsxAttribute' && attr.name === 'style' && typeof attr.value === 'string') {
          const obj = cssStringToObject(attr.value);
          attr.value = {
            type: 'mdxJsxAttributeValueExpression',
            value: JSON.stringify(obj),
            data: { estree: objectToEstree(obj) },
          };
        }
      }
    }
    if (Array.isArray(node.children)) node.children.forEach(visit);
  };
  return (tree: any) => visit(tree);
}

// Custom frontmatter fields carried over from the previous Starlight site.
// Kept tolerant on purpose so no existing document fails validation.
// See https://fumadocs.dev/docs/mdx/collections
// `.nullish()` everywhere: empty YAML keys (e.g. `tech_stack:` with no value)
// parse to null, and many documents carry blank fields.
const customFrontmatter = pageSchema.extend({
  // media
  image: z.string().nullish(),
  cover: z.string().nullish(),
  sticker: z.string().nullish(),
  // taxonomy
  tags: z.array(z.string()).nullish(),
  categories: z.array(z.string()).nullish(),
  featured: z.boolean().nullish(),
  draft: z.boolean().nullish(),
  pagefind: z.boolean().nullish(),
  // ordering / routing carried from Starlight (translated to meta.json where needed)
  weight: z.number().nullish(),
  slug: z.string().nullish(),
  sidebar: z.any().nullish(),
  // project metadata
  status: z.string().nullish(),
  summary: z.string().nullish(),
  website: z.string().nullish(),
  demo: z.string().nullish(),
  github: z.string().nullish(),
  tech_stack: z.union([z.array(z.string()), z.string()]).nullish(),
  links: z.any().nullish(),
  // dates: YAML may parse these as Date or leave as string
  date: z.union([z.string(), z.date()]).nullish(),
  // diagrams / misc
  topology: z.string().nullish(),
  timeline: z
    .array(
      z.object({
        date: z.string(),
        title: z.string(),
        summary: z.string(),
        steps: z.array(z.string()),
        tags: z.array(z.string()),
      }),
    )
    .nullish(),
});

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: customFrontmatter,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// Blog lives outside the docs tree (standalone /blog routes, no sidebar) —
// same tolerant frontmatter, same MDX pipeline.
export const blogPosts = defineDocs({
  dir: 'content/blog',
  docs: {
    schema: customFrontmatter,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMermaid, remarkFixJsxHtml, remarkStyleStringToObject],
  },
});
