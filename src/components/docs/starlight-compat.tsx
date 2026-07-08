import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { Steps } from 'fumadocs-ui/components/steps';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

// lucide-react v1 dropped brand icons, so inline a GitHub mark.
function Github(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.23 0 4.63-2.8 5.65-5.48 5.95.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

/**
 * Compatibility shims so MDX authored for Astro Starlight keeps rendering
 * under Fumadocs without editing every document. Only the components that
 * actually appear in the content are mapped: Card, CardGrid, LinkCard,
 * LinkButton, Steps.
 */

type StarlightCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  href?: string;
  // Starlight passes icon names as strings (its own icon set); Fumadocs
  // expects a ReactNode. Ignore string icons to avoid rendering raw text.
  icon?: unknown;
  children?: ReactNode;
};

export function StarlightCard({ title, description, href, children }: StarlightCardProps) {
  return (
    <Card title={title ?? ''} href={href} description={description}>
      {children}
    </Card>
  );
}

// <LinkCard title description href /> — same shape as a Fumadocs linked Card.
export const StarlightLinkCard = StarlightCard;

// <CardGrid> / <CardGrid stagger> — drop Starlight-only props, render a grid.
export function StarlightCardGrid({ children }: { children?: ReactNode }) {
  return <Cards>{children}</Cards>;
}

const linkButtonIcons: Record<string, ComponentType<{ className?: string }>> = {
  github: Github,
  external: ExternalLink,
  'right-arrow': ArrowRight,
};

type StarlightLinkButtonProps = {
  href?: string;
  variant?: 'primary' | 'secondary' | 'minimal';
  icon?: string;
  iconPlacement?: 'start' | 'end';
  size?: 'small' | 'medium' | 'large';
  children?: ReactNode;
};

export function StarlightLinkButton({
  href,
  variant = 'primary',
  icon,
  iconPlacement = 'end',
  size = 'medium',
  children,
}: StarlightLinkButtonProps) {
  const Icon = icon ? linkButtonIcons[icon] : undefined;
  const external = href?.startsWith('http');
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer noopener' : undefined}
      className={cn(
        'not-prose inline-flex items-center gap-2 rounded-lg font-medium no-underline transition-colors',
        size === 'large' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-sm',
        variant === 'secondary' || variant === 'minimal'
          ? 'border border-fd-border bg-fd-secondary text-fd-secondary-foreground hover:bg-fd-accent'
          : 'bg-fd-primary text-fd-primary-foreground hover:opacity-90',
      )}
    >
      {Icon && iconPlacement === 'start' ? <Icon className="size-4" /> : null}
      {children}
      {Icon && iconPlacement === 'end' ? <Icon className="size-4" /> : null}
    </a>
  );
}

export { Steps as StarlightSteps };
