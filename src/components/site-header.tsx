import { links } from "@/data/profile";
import CommandMenu from "./command-menu";
import { GitHubIcon } from "./icons";
import RNMark from "./rn-mark";
import SoundLink from "./sound-link";
import ThemeToggle from "./theme-toggle";

const nav = [
  { href: "#about", label: "About" },
  { href: "#stack", label: "Stack" },
  { href: "#experience", label: "Experience" },
  { href: "#certs", label: "Certs" },
  { href: "#lab-log", label: "Lab Log" },
];

function VerticalSeparator({ className = "" }: { className?: string }) {
  return <span className={`h-5 w-px self-center bg-border ${className}`} aria-hidden />;
}

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 max-w-screen overflow-x-clip bg-background px-2">
      <div className="screen-line-top screen-line-bottom mx-auto flex h-(--header-height) items-center gap-2 border-r border-line pr-2 sm:gap-4 md:max-w-3xl">
        <a href="#top" aria-label="Home">
          <RNMark className="size-10 shrink-0" />
        </a>

        <div className="flex-1" />

        <nav className="flex items-center gap-4 max-sm:hidden">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium tracking-wide text-muted-foreground transition-[color] hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center">
          <VerticalSeparator className="mr-2 max-sm:hidden" />
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
