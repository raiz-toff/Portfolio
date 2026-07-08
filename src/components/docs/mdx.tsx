import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import {
  StarlightCard,
  StarlightLinkCard,
  StarlightCardGrid,
  StarlightLinkButton,
  StarlightSteps,
} from './starlight-compat';
import { Mermaid } from './mermaid';
import { Topology } from './topology';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    // Starlight compatibility: content authored for the old site keeps working.
    Card: StarlightCard,
    LinkCard: StarlightLinkCard,
    CardGrid: StarlightCardGrid,
    LinkButton: StarlightLinkButton,
    Steps: StarlightSteps,
    Mermaid,
    Topology,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
