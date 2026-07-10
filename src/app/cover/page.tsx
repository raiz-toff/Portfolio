import type { Metadata } from "next";
import Link from "next/link";
import ColdAisle from "@/components/cover/cold-aisle";
import CrossoverRack from "@/components/cover/crossover-rack";
import DcFloor from "@/components/cover/dc-floor";
import DualPatchPanel from "@/components/cover/dual-patch-panel";
import IsoLab from "@/components/cover/iso-lab";
import PatchPanel from "@/components/cover/patch-panel";
import StoryCover from "@/components/cover/story-cover";
import ThemeToggle from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Cover Lab — Rajkumar Neupane",
  description: "Design playground for the portfolio cover.",
  robots: { index: false },
};

function Candidate({
  id,
  file,
  note,
  children,
}: {
  id: string;
  file: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="screen-line-top screen-line-bottom border-x border-line">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-line px-4 py-2.5">
        <h2 className="text-base font-medium tracking-tight text-foreground">
          {id}
        </h2>
        <p className="rounded-full border border-line bg-muted/40 px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {file}
        </p>
      </header>
      {/* stage: same slot the profile-header figure uses (p-4, full column width) */}
      <div className="p-4">{children}</div>
      <p className="border-t border-line px-4 py-2.5 font-mono text-xs text-muted-foreground">
        {note}
      </p>
    </section>
  );
}

function Divider() {
  return <div className="stripe-divider h-8 w-full border-x border-line" aria-hidden />;
}

export default function CoverLab() {
  return (
    <div className="relative isolate flex-1">
      <header className="sticky top-0 z-50 max-w-screen overflow-x-clip bg-background px-2">
        <div className="screen-line-top screen-line-bottom mx-auto flex h-(--header-height) items-center justify-between border-x border-line px-4 md:max-w-3xl">
          <Link
            href="/"
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← back to front page
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-medium tracking-tight">
              COVER LAB
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-screen overflow-x-clip px-2 pb-24">
        <div className="mx-auto md:max-w-3xl">
          <div className="screen-line-bottom border-x border-line p-4">
            <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
              Workbench for the portfolio cover — the artwork that will sit in
              the profile header&apos;s figure slot (FIG_001). Each candidate
              below renders at the exact size and tokens the real slot uses.
              Add a component under{" "}
              <code className="rounded border bg-muted/50 px-1 font-mono text-xs">
                src/components/cover/
              </code>{" "}
              and drop it in here to compare.
            </p>
          </div>
          <Divider />

          <Candidate
            id="CANDIDATE A — the bench, isometric"
            file="cover/iso-lab.tsx"
            note="isometric wireframe of the lab: hypervisor slab, vm blocks, hatched zones, packets on the traces. no client js."
          >
            <IsoLab />
          </Candidate>

          <Divider />

          <Candidate
            id="CANDIDATE B — the patch panel"
            file="cover/patch-panel.tsx"
            note="24-port panel, 8 cables in real t568b color/stripe order, cables fade in staggered, three link leds blink out of sync. dashed rails, an unbuilt 1u and a future run echo the bench scene's wireframe language. no client js."
          >
            <PatchPanel />
          </Candidate>

          <Divider />

          <Candidate
            id="CANDIDATE C — the cross-connect"
            file="cover/dual-patch-panel.tsx"
            note="copy of candidate b, split into two: 568a left (cables exit above, sweep left), 568b right (cables exit below, sweep right), joined by a dark fiber trunk across the gap. dashed rails + an unbuilt 1u per rack in the background. no client js."
          >
            <DualPatchPanel />
          </Candidate>

          <Divider />

          <Candidate
            id="CANDIDATE D — the crossover"
            file="cover/crossover-rack.tsx"
            note="568a upper-left (exits up, sweeps left), 568b lower-right (exits down, sweeps right), joined by a dark fiber run with a service loop, plus a 1u switch uplinked into panel b. dashed rail stubs + off-canvas continuations in the background. staged reveal via smil, no client js."
          >
            <CrossoverRack />
          </Candidate>

          <Divider />

          <Candidate
            id="CANDIDATE E — the cold aisle"
            file="cover/cold-aisle.tsx"
            note="one-point-perspective server row: raised floor, ladder-rack ceiling, five depth layers of racks with flickering link leds. pointer/touch drives a lerped parallax; idle 2.6s and it drifts on its own. needs client js — genuinely interactive, unlike a-d."
          >
            <ColdAisle />
          </Candidate>

          <Divider />

          <Candidate
            id="CANDIDATE F — the floor, walkable"
            file="cover/dc-floor.tsx"
            note="isometric floor plan from above: four rack rows, hot/cold aisles, three crac units. waddle the resident tux with arrow keys / wasd or by tapping a tile — bfs pathfinding around racks, footstep audio per hop, nearby racks reveal their labels, hud reports the zone. dashed lattice, conduits and an unbuilt pad share the bench scene's wireframe language. needs client js — stateful (pathfinding + walk queue + depth-sorted z-order)."
          >
            <DcFloor />
          </Candidate>

          <Divider />

          <Candidate
            id="CANDIDATE G — the whole story"
            file="cover/story-cover.tsx"
            note="candidates a–f merged into one honest story: five hops from an imagined facility down to eight conductors, pulling back to the bench that actually runs it. traceroute-style hop rail with chapter plate, hotspot chips land staggered after each camera move, escape zooms out, smil reveals replay per visit. every candidate's interactivity preserved — walking, parallax, staged reveals."
          >
            <StoryCover />
          </Candidate>
        </div>
      </main>
    </div>
  );
}
