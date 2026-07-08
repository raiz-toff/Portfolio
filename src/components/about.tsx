import Link from "next/link";
import { identity } from "@/data/profile";
import { Greeting } from "./greeting";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "./panel";

export default function About() {
  return (
    <Panel id="about">
      <PanelHeader>
        <PanelTitle>
          <Greeting />
        </PanelTitle>
      </PanelHeader>
      <PanelContent className="space-y-4">
        <p className="text-pretty text-base leading-relaxed text-foreground/90">
          I&apos;m {identity.name} — a {identity.role.toLowerCase()} who got
          here the hard way: a year of chip-level repair in Kathmandu,
          soldering iron in hand, before a single router ever crossed my
          desk.
        </p>

        <p className="text-pretty text-base leading-relaxed text-foreground/90">
          {identity.aboutTeaser}
        </p>

        <p className="text-pretty text-base leading-relaxed text-foreground/90">
          CCNA and CCST in hand, and a home lab in{" "}
          {identity.location} that runs Proxmox, EVE-NG, and Cisco CML —
          300+ labs deep and still breaking things on purpose.
        </p>

        <Link
          href="/about"
          className="link-underline inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground"
        >
          Read the full story
          <span aria-hidden>→</span>
        </Link>
      </PanelContent>
    </Panel>
  );
}
