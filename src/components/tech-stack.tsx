import { techStack } from "@/data/profile";
import { Panel, PanelContent, PanelHeader, PanelTitle, PanelTitleSup } from "./panel";

const GROUPS: { label: string; index: string; names: string[] }[] = [
  {
    index: "01",
    label: "Network & Systems",
    names: [
      "Cisco IOS",
      "EVE-NG",
      "Cisco CML",
      "Packet Tracer",
      "Proxmox VE",
      "Wireshark",
      "FortiGate",
      "Linux",
      "Windows Server",
    ],
  },
  {
    index: "02",
    label: "Automation & Tooling",
    names: [
      "Python",
      "PowerShell",
      "Ansible",
      "Zabbix",
      "Grafana",
      "Docker",
      "Git / GitLab",
    ],
  },
];

export default function TechStack() {
  return (
    <Panel id="stack">
      <PanelHeader>
        <PanelTitle>
          Stack
          <PanelTitleSup>({techStack.length})</PanelTitleSup>
        </PanelTitle>
      </PanelHeader>
      <PanelContent className="p-0">
        {GROUPS.map((group, gi) => (
          <div
            key={group.label}
            className={`grid gap-y-3 p-4 sm:grid-cols-[12rem_1fr] ${
              gi < GROUPS.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <p className="font-mono text-sm text-muted-foreground">
              <span className="mr-2 text-foreground/40">{group.index}</span>
              {group.label}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {group.names.map((name) => {
                const item = techStack.find((t) => t.name === name);
                return (
                  <li key={name}>
                    <a
                      href={item?.href}
                      title={item?.role}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-6 items-center gap-1.5 rounded-full bg-zinc-50/80 px-2.5 font-mono text-xs inset-ring-1 inset-ring-border transition-colors hover:bg-zinc-100 dark:bg-zinc-900/80 dark:hover:bg-zinc-800"
                    >
                      {name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </PanelContent>
    </Panel>
  );
}
