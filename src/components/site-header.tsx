import Link from "next/link";
import { cn } from "@/lib/cn";
import { links } from "@/data/profile";
import CommandMenu from "./command-menu";
import { GitHubIcon } from "./icons";
import RNMark from "./rn-mark";
import SoundLink from "./sound-link";
import ThemeToggle from "./theme-toggle";

// Path-qualified hashes so the nav works from /about and other routes,
// not just the homepage.
const nav = [
  { href: "/#about", label: "About" },
  { href: "/#stack", label: "Stack" },
  { href: "/#experience", label: "Experience" },
  { href: "/#certs", label: "Certs" },
  { href: "/#lab-log", label: "Lab Log" },
];

function VerticalSeparator({ className = "" }: { className?: string }) {
  return <span className={`h-5 w-px self-center bg-border ${className}`} aria-hidden />;
}

export default function SiteHeader({
  /**
   * Set on pages that render <SectionNav />, whose left rail replaces these
   * links at xl and up. Pages without the rail (e.g. /about) keep them at every
   * width above sm, so they are never left with no navigation at all.
   */
  hasSectionNav = false,
}: {
  hasSectionNav?: boolean;
}) {
  // Both the links and the divider that sets them off go together.
  const railReplaces = hasSectionNav && "xl:hidden";

  return (
    <header className="sticky top-0 z-50 max-w-screen overflow-x-clip bg-background px-2">
      <div className="screen-line-top screen-line-bottom mx-auto flex h-(--header-height) items-center gap-2 border-r border-line pr-2 sm:gap-4 md:max-w-3xl">
        <Link href="/" aria-label="Home">
          <RNMark className="h-9 w-auto shrink-0" />
        </Link>

        <div className="flex-1" />

        <nav className={cn("flex items-center gap-4 max-sm:hidden", railReplaces)}>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium tracking-wide text-muted-foreground transition-[color] hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center">
          <VerticalSeparator className={cn("mr-2 max-sm:hidden", railReplaces)} />
          <CommandMenu />
          <VerticalSeparator className="mx-2 max-sm:hidden" />
          <SoundLink
            href={links.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub — raiz-toff"
            className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground transition-[color,scale] duration-150 ease-out after:absolute after:-inset-1.5 after:content-[''] hover:text-foreground active:scale-[0.96]"
          >
            <GitHubIcon className="size-4.5" />
          </SoundLink>
          <VerticalSeparator className="mx-2" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
