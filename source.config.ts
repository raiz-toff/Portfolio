import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';
import {
  cssStringToObject,
  normalizeAttrName,
  rewriteInternalPath,
} from '@/lib/mdx-transforms';

// Minimal structural view of the mdast / mdx-jsx nodes these plugins touch.
type MdxJsxAttribute = {
  type: string;
  name: string;
  value?: unknown;
};

type Node = {
  type?: string;
  lang?: string | null;
  value?: string;
  url?: string;
  name?: string | null;
  attributes?: MdxJsxAttribute[];
  children?: Node[];
};

type EstreeProgram = {
  type: 'Program';
  sourceType: 'module';
  body: unknown[];
};

function objectToEstree(obj: Record<string, string>): EstreeProgram {
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
  const visit = (node: Node | null, parent: Node | null, index: number | null) => {
    if (node?.type === 'code' && node.lang === 'mermaid' && parent?.children && index !== null) {
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
      node.children.forEach((child, i) => visit(child, node, i));
    }
  };
  return (tree: Node) => visit(tree, null, null);
}

// Fix raw HTML authored for Starlight so it is valid React/JSX:
//  - raw <p> -> <div> so markdown paragraphs inside don't nest <p> in <p>
//  - normalize attribute names (class, stroke-width, etc.)
//  - rewrite internal links to the /docs base (raw <a> and markdown links)
function remarkFixJsxHtml() {
  const visit = (node: Node | null) => {
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
  return (tree: Node) => visit(tree);
}

function remarkStyleStringToObject() {
  const visit = (node: Node | null) => {
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
  return (tree: Node) => visit(tree);
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
