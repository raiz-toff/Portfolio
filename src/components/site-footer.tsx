import { FluidGradientText } from "@/components/fluid-gradient-text";
import { identity, links } from "@/data/profile";

const RECORDS: [string, React.ReactNode][] = [
  [
    "crafted by",
    <a
      key="v"
      className="link-underline"
      href={links.github}
      target="_blank"
      rel="noopener noreferrer"
    >
      rajkumar neupane
    </a>,
  ],
  [
    "design",
    <a
      key="v"
      className="link-underline"
      href="https://github.com/ncdai/chanhdai.com"
      target="_blank"
      rel="noopener noreferrer"
    >
      adapted from chanhdai.com (MIT)
    </a>,
  ],
  [
    "contact",
    <a key="v" className="link-underline" href={`mailto:${identity.email}`}>
      {identity.email}
    </a>,
  ],
  [
    "lab notes",
    <a key="v" className="link-underline" href={links.labs}>
      rajkumarneupane.com/docs
    </a>,
  ],
  [
    "resume",
    <a key="v" className="link-underline" href={links.resume}>
      pdf ↓
    </a>,
  ],
  ["route", "kathmandu → toronto"],
];

export default function SiteFooter() {
  return (
    <footer id="contact" className="max-w-screen overflow-x-clip px-2">
      <div className="mx-auto border-x border-line md:max-w-3xl">
        <div className="stripe-divider h-12 w-full" aria-hidden />

        <dl className="screen-line-top grid grid-cols-1 gap-x-4 gap-y-2 p-4 font-mono text-xs sm:grid-cols-2">
          {RECORDS.map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-3">
              <dt className="shrink-0 text-muted-foreground/70">{k}:</dt>
              <dd className="min-w-0 break-all text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>

        <p className="screen-line-top flex items-center justify-between px-4 py-3 font-mono text-xs text-muted-foreground/70">
          <span>© 2026 rajkumar neupane</span>
          <span className="flex items-center gap-2">
            <span className="led led-green" aria-hidden />
            {identity.status}
          </span>
        </p>
      </div>

      <div className="screen-line-top aspect-[2550/560] w-full text-foreground">
        <FluidGradientText />
      </div>
    </footer>
  );
}
