"use client";

import { useState } from "react";
import { topoNodes, topoLinks, type TopoNode } from "@/data/profile";
import { useClickSound } from "@/hooks/use-click-sound";

const NODE_W = 118;
const NODE_H = 42;

const kindTag: Record<TopoNode["kind"], string> = {
  cloud: "wan",
  firewall: "fw",
  switch: "l2/l3",
  host: "hv",
  vm: "vm",
  endpoint: "mon",
};

function nodeById(id: string) {
  const n = topoNodes.find((n) => n.id === id);
  if (!n) throw new Error(`unknown topology node: ${id}`);
  return n;
}

export default function Topology() {
  const [activeId, setActiveId] = useState("pve");
  const active = nodeById(activeId);
  const [click] = useClickSound();

  return (
    <div>
      <svg
        viewBox="0 0 900 320"
        className="block w-full"
        role="img"
        aria-label="Diagram of the home lab: ISP into a firewall, into a core switch, into a Proxmox hypervisor running EVE-NG, Cisco CML, GitLab and monitoring"
      >
        {/* links first, so packets slide underneath the nodes */}
        {topoLinks.map((l) => {
          const a = nodeById(l.from);
          const b = nodeById(l.to);
          return (
            <line
              key={`${l.from}-${l.to}`}
              className="topo-link"
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
            />
          );
        })}

        {/* packets */}
        {topoLinks.map((l, i) => {
          const a = nodeById(l.from);
          const b = nodeById(l.to);
          const path = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
          const back = `M ${b.x} ${b.y} L ${a.x} ${a.y}`;
          return (
            <g key={`p-${l.from}-${l.to}`}>
              {/* hidden until motion begins, so delayed packets don't flash at the origin */}
              <circle r="2.5" opacity="0" className="packet">
                <animateMotion
                  dur={`${2.2 + (i % 3) * 0.7}s`}
                  begin={`${i * 0.55}s`}
                  repeatCount="indefinite"
                  path={path}
                />
                <set attributeName="opacity" to="1" begin={`${i * 0.55}s`} />
              </circle>
              {i % 2 === 0 && (
                <circle r="2.5" opacity="0" className="packet-return">
                  <animateMotion
                    dur={`${2.8 + (i % 2) * 0.9}s`}
                    begin={`${0.9 + i * 0.4}s`}
                    repeatCount="indefinite"
                    path={back}
                  />
                  <set
                    attributeName="opacity"
                    to="1"
                    begin={`${0.9 + i * 0.4}s`}
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* nodes */}
        {topoNodes.map((n) => {
          const isActive = n.id === activeId;
          return (
            <g
              key={n.id}
              className="topo-node cursor-pointer"
              onMouseEnter={() => setActiveId(n.id)}
              onClick={() => {
                click();
                setActiveId(n.id);
              }}
            >
              {n.kind === "cloud" ? (
                <ellipse
                  className="node-shape"
                  cx={n.x}
                  cy={n.y}
                  rx={NODE_W / 2 - 6}
                  ry={NODE_H / 2 + 4}
                  strokeDasharray="4 3"
                  style={isActive ? { stroke: "var(--foreground)" } : undefined}
                />
              ) : (
                <rect
                  className="node-shape"
                  x={n.x - NODE_W / 2}
                  y={n.y - NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  strokeDasharray={n.kind === "vm" ? "4 3" : undefined}
                  style={isActive ? { stroke: "var(--foreground)" } : undefined}
                />
              )}
              <text
                x={n.x}
                y={n.y - NODE_H / 2 - 6}
                textAnchor="middle"
                className="font-mono uppercase"
                fontSize="8"
              >
                {kindTag[n.kind]}
              </text>
              <text
                x={n.x}
                y={n.y + 3.5}
                textAnchor="middle"
                className="font-mono"
                fontSize="11"
                style={isActive ? { fill: "var(--foreground)" } : undefined}
              >
                {n.label}
              </text>
              {isActive && (
                <circle
                  cx={n.x - NODE_W / 2 + (n.kind === "cloud" ? 14 : 8)}
                  cy={n.y - NODE_H / 2 + (n.kind === "cloud" ? 10 : 8)}
                  r="2.5"
                  fill="var(--led-green)"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* readout */}
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1 pt-1 font-mono text-xs">
        <span className="text-foreground">
          {active.label.toLowerCase().replace(/\s+/g, "-")}
        </span>
        <span className="text-muted-foreground">{active.detail}</span>
      </p>
    </div>
  );
}
