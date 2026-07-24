// Single source of truth for the front-face content.
// Everything here is real — pulled from labs, posts, and certs.

export const identity = {
  name: "Rajkumar Neupane",
  role: "Network Engineer",
  location: "Toronto, Canada",
  origin: "Kathmandu, Nepal",
  timeZone: "America/Toronto",
  status: "open for roles",
  email: "me@rajkumarneupane.com",
  // base64 — kept out of plaintext to deter trivial scraping; decoded client-side.
  phoneB64: "KzE0Mzc2NjUzMzkw",
  pronouns: "he/him",
  flipSentences: [
    "Network engineer. Labs every day.",
    "CCNA · CCST certified.",
    "300+ labs to muscle memory.",
    "It's always DNS.",
    "Broke it, fixed it, wrote it down.",
    "Rides bikes. Fixes them too.",
  ],
  // Short teaser for the homepage panel. The full narrative lives at /story.
  aboutTeaser:
    "I learned tech at the board level — a year of soldering components, reading schematics, and bringing dead circuits back to life in Kathmandu. A detour through healthcare logistics taught me why any of it has to matter. Now it's Toronto, a networking diploma, and a home lab that never sleeps.",
};

// ── The full story, told chapter by chapter, for /story ─────────────────
export type StoryChapter = {
  id: string;
  title: string;
  paragraphs: string[];
};

export const story: StoryChapter[] = [
  {
    id: "foundation",
    title: "The Foundation",
    paragraphs: [
      "Before the CCNA, before Canada, before the home lab — there was a small institute in Kathmandu and a soldering iron.",
      "During COVID, after finishing school, I enrolled in a technical training program at Kantipur Technical Institute covering chip-level laptop repair, Android mobile repair, and desktop/laptop hardware and networking. It ran for about 8 to 10 months, and it was one of the most hands-on things I've ever done.",
      "I remember waking up early every morning and walking to the institute. In the beginning, even opening a laptop case felt like a big deal. By the end, I was diagnosing dead boards, reading schematic diagrams, and repairing real customer laptops — not just practice units.",
      "The thing that surprised me most was schematic reading. Understanding how power flows through a board, tracing circuits, finding a fault — it changed how I think about hardware entirely. That foundation quietly shows up in everything I do now.",
      "It wasn't glamorous. But it was real, practical, and taught me how to think about broken things — which turns out to be the most useful skill in IT.",
    ],
  },
  {
    id: "detour",
    title: "The Detour That Mattered",
    paragraphs: [
      "Before networking took over, I coordinated operations at Nepamed Healthcare — logistics and supply chains. That experience permanently changed how I think about infrastructure: technology that doesn't solve a real problem for a real person is just expensive noise.",
    ],
  },
  {
    id: "now",
    title: "Now",
    paragraphs: [
      "Toronto. A Computer Systems Networking diploma from Canadore College; CCNA, CCST, and Google IT Support in hand. The goal is network architecture — not just moving packets, but understanding the business problems those packets are supposed to solve.",
    ],
  },
  {
    id: "off-the-clock",
    title: "Off the Clock",
    paragraphs: [
      "Photoshop and Illustrator since Nepal, still in regular use. For photography — just a phone, Lightroom, and Snapseed. If the light's right, I shoot it.",
      "I used to maintain and customize my own bike. There's a particular satisfaction in knowing a machine from the inside out — and that habit carries into everything else: welding, grinding, soldering, and now the home lab. I learn by breaking things and putting them back together.",
    ],
  },
];

// Workshop photos accompanying the "Off the Clock" chapter — real shots, Kathmandu.
export const workshopPhotos: { src: string; alt: string; caption: string }[] = [
  { src: "/img/welding.jpg", alt: "Welding on a rooftop in Kathmandu", caption: "welding" },
  { src: "/img/grinding.jpg", alt: "Grinding steel for a rooftop railing", caption: "grinding" },
  { src: "/img/soldering.jpg", alt: "Soldering a circuit board", caption: "soldering" },
];

export const links = {
  // The docs merged into this site — lab notes live at /docs now.
  labs: "/docs",
  projects: "/docs/projects",
  blog: "/blog",
  github: "https://github.com/raiz-toff",
  linkedin: "https://www.linkedin.com/in/rjneupane",
  credly: "https://www.credly.com/users/rajkumarneupane",
  gallery: "https://gallery.rajkumarneupane.com",
  resume: "/resume/RajkumarNeupaneSingle.pdf",
};

export const socialLinks: { name: string; handle: string; href: string }[] = [
  { name: "GitHub", handle: "raiz-toff", href: links.github },
  { name: "LinkedIn", handle: "rjneupane", href: links.linkedin },
  { name: "Credly", handle: "rajkumarneupane", href: links.credly },
  { name: "Lab Notes", handle: "rajkumarneupane.com/docs", href: links.labs },
  { name: "Gallery", handle: "gallery.rajkumarneupane.com", href: links.gallery },
];

// ── Experience, oldest chapter last ─────────────────────────────────────
// Structured company → positions, styled after chanhdai.com's WorkExperience.
// `kind` maps to an icon inside the WorkExperience component (data stays JSX-free).
export type ExperiencePosition = {
  title: string;
  /** Shown verbatim, so the narrative periods stay intact. */
  period: string;
  employmentType?: string;
  kind: "server" | "grad" | "briefcase" | "wrench";
  notes: string[];
  skills?: string[];
  /** Start expanded on load. */
  expanded?: boolean;
};

export type ExperienceCompany = {
  id: string;
  org: string;
  where: string;
  website?: string;
  /** URL to the company/school logo. Falls back to a neutral dot when omitted. */
  logo?: string;
  current?: boolean;
  positions: ExperiencePosition[];
};

export const experience: ExperienceCompany[] = [
  {
    id: "home-lab",
    org: "The lab in the corner of the room",
    where: "Toronto",
    current: true,
    positions: [
      {
        title: "Home Lab Operator",
        period: "2024 — present",
        employmentType: "Self-directed",
        kind: "server",
        expanded: true,
        notes: [
          "Proxmox VE hosting EVE-NG, Cisco CML, GitLab, and Zabbix/Grafana — broken, rebuilt, and documented daily.",
          "Passed CCNA 200-301 after a one-month sprint: 19 days of 10-hour study sessions, 300+ labs.",
          "Lab configs versioned in a local GitLab instance with CI/CD pipelines.",
        ],
        skills: [
          "Proxmox VE",
          "EVE-NG",
          "Cisco CML",
          "GitLab CI/CD",
          "Zabbix",
          "Grafana",
          "CCNA 200-301",
        ],
      },
    ],
  },
  {
    id: "canadore",
    org: "Canadore College",
    where: "Toronto",
    website:
      "https://www.canadorecollege.ca/programs/computer-systems-networking-technician",
    logo: "/img/canadore-college-logo.png",
    positions: [
      {
        title: "Computer Systems Networking, Diploma",
        period: "2023 — 2025",
        employmentType: "Diploma",
        kind: "grad",
        notes: [
          "Routing & switching from Packet Tracer through real racks — CST 115, 215, 250.",
          "Windows Server, Active Directory, and Linux administration coursework.",
        ],
        skills: [
          "Routing & Switching",
          "Windows Server",
          "Active Directory",
          "Linux",
          "Packet Tracer",
        ],
      },
    ],
  },
  {
    id: "nepamed",
    org: "Nepamed Healthcare",
    where: "Kathmandu",
    positions: [
      {
        title: "Operations Coordinator",
        period: "before the move",
        employmentType: "Full-time",
        kind: "briefcase",
        notes: [
          "Coordinated logistics and supply chains.",
          "Learned that technology which doesn't solve a real problem for a real person is just expensive noise.",
        ],
        skills: ["Logistics", "Supply Chain", "Operations"],
      },
    ],
  },
  {
    id: "kantipur",
    org: "Kantipur Technical Institute",
    where: "Kathmandu",
    website: "https://www.kantipurtechnical.com",
    logo: "/img/kantipur-technical-institute-logo.png",
    positions: [
      {
        title: "Chip-Level Repair Technician (Trainee)",
        period: "the foundation",
        employmentType: "Trainee",
        kind: "wrench",
        notes: [
          "A year of soldering components, reading schematics, and bringing dead circuits back to life.",
          "Where I learned how broken things actually work.",
        ],
        skills: ["Soldering", "Schematics", "Board Repair"],
      },
    ],
  },
];

// ── Certifications, rendered as an interface-status table ──────────────
export type Issuer =
  | "google"
  | "cisco"
  | "nvidia"
  | "redhat"
  | "packt"
  | "yonsei"
  | "illinois-tech";

export type Interface = {
  port: string;
  desc: string;
  status: "up" | "in progress";
  proto: string;
  issuer: Issuer;
  date?: string;
  href?: string;
  courses?: string[];
};

export const certInterfaces: Interface[] = [
  {
    port: "Gi0/0",
    desc: "CCNA — Cisco Certified Network Associate",
    status: "up",
    proto: "200-301",
    issuer: "cisco",
    date: "Expires Nov 2028",
    href: "https://www.credly.com/badges/af584e8e-7709-4027-9042-183d9a6a4c23/public_url",
  },
  {
    port: "Gi0/1",
    desc: "CCST Networking — Cisco Certified Support Technician (Lifetime)",
    status: "up",
    proto: "Cisco",
    issuer: "cisco",
    date: "Issued Apr 2025",
    href: "https://www.credly.com/badges/35041e90-14b2-41e3-8d26-e31f2317213f/public_url",
  },
  {
    port: "Gi0/2",
    desc: "Google IT Support Professional Certificate (v.3)",
    status: "up",
    proto: "Coursera",
    issuer: "google",
    date: "Issued Jan 2026",
    href: "https://coursera.org/share/01739919e78041c627c40fd2766a2c88",
    courses: [
      "Technical Support Fundamentals",
      "The Bits and Bytes of Computer Networking",
      "Operating Systems and You: Becoming a Power User",
      "System Administration and IT Infrastructure Services",
      "IT Security: Defense Against the Digital Dark Arts",
    ],
  },
  {
    port: "Gi0/3",
    desc: "Computer Hardware Basics",
    status: "up",
    proto: "Cisco",
    issuer: "cisco",
    date: "Issued Apr 2025",
    href: "https://www.credly.com/badges/ae26f07f-56b8-4eb3-85b8-14ce71ec9936/public_url",
  },
  {
    port: "Gi0/4",
    desc: "Network Support and Security",
    status: "up",
    proto: "Cisco",
    issuer: "cisco",
    date: "Issued Apr 2025",
    href: "https://www.credly.com/badges/470e4a41-3b5b-427b-8406-1a6d44322428/public_url",
  },
  {
    port: "Gi0/5",
    desc: "Network Technician Career Path",
    status: "up",
    proto: "Cisco",
    issuer: "cisco",
    date: "Issued Apr 2025",
    href: "https://www.credly.com/badges/4464f1dd-e535-4e2b-ac32-7e0d72d8d68d/public_url",
  },
  {
    port: "Gi0/6",
    desc: "Network Addressing and Basic Troubleshooting",
    status: "up",
    proto: "Cisco",
    issuer: "cisco",
    date: "Issued Apr 2025",
    href: "https://www.credly.com/badges/78c5da1c-347d-4690-9fc1-b0e3bdd49f66/public_url",
  },
  {
    port: "Gi0/7",
    desc: "Networking Devices and Initial Configuration",
    status: "up",
    proto: "Cisco",
    issuer: "cisco",
    date: "Issued Mar 2025",
    href: "https://www.credly.com/badges/14162eb8-3da3-4893-b468-6be6dfc9f366/public_url",
  },
  {
    port: "Gi0/8",
    desc: "Google AI Essentials V1",
    status: "up",
    proto: "Coursera",
    issuer: "google",
    date: "Issued Mar 2025",
    href: "https://www.credly.com/badges/805bec21-040c-4723-85d2-8dd60040965f/public_url",
  },
  {
    port: "Gi0/9",
    desc: "Google Prompting Essentials V1",
    status: "up",
    proto: "Coursera",
    issuer: "google",
    date: "Issued Mar 2025",
    href: "https://www.credly.com/badges/d494f4ae-43e6-4e97-90bb-21b7fc96f1dd/public_url",
  },
  {
    port: "Gi0/10",
    desc: "Networking Basics",
    status: "up",
    proto: "Cisco",
    issuer: "cisco",
    date: "Issued Mar 2025",
    href: "https://www.credly.com/badges/8fddda40-7de5-4727-bff2-812f710b8bb3/public_url",
  },
  {
    port: "Gi0/11",
    desc: "Introduction to Packet Tracer",
    status: "up",
    proto: "Cisco",
    issuer: "cisco",
    date: "Issued Feb 2025",
    href: "https://www.credly.com/badges/818a4d0d-c1d3-4e99-b08a-46617e4a29b0/public_url",
  },
  {
    port: "Gi0/12",
    desc: "CCST Networking — Video Training Series",
    status: "up",
    proto: "Packt",
    issuer: "packt",
    href: "https://www.coursera.org/account/accomplishments/records/BKGMWSCWVI2I",
  },
  {
    port: "Gi0/13",
    desc: "Introduction to TCP/IP",
    status: "up",
    proto: "Yonsei University",
    issuer: "yonsei",
    href: "https://www.coursera.org/account/accomplishments/records/3IQEMUUOGVFY",
  },
  {
    port: "Gi0/14",
    desc: "Introduction to Contemporary Operating Systems and Hardware 1b",
    status: "up",
    proto: "Illinois Tech",
    issuer: "illinois-tech",
    href: "https://www.coursera.org/account/accomplishments/records/27R3T6P8YGOQ",
  },
  {
    port: "Gi0/15",
    desc: "Introduction to Networking",
    status: "up",
    proto: "NVIDIA",
    issuer: "nvidia",
    href: "https://www.coursera.org/account/accomplishments/records/ZNNLUMXB5PS6",
  },
];

// ── The home lab, rendered as a live topology ──────────────────────────
export type TopoNode = {
  id: string;
  label: string;
  kind: "cloud" | "firewall" | "switch" | "host" | "vm" | "endpoint";
  detail: string;
  x: number;
  y: number;
};

export type TopoLink = {
  from: string;
  to: string;
};

export const topoNodes: TopoNode[] = [
  { id: "wan", label: "ISP / WAN", kind: "cloud", detail: "the outside world", x: 60, y: 150 },
  { id: "fw", label: "Firewall", kind: "firewall", detail: "FortiGate — policies, VPN tunnels, ACLs", x: 235, y: 150 },
  { id: "sw", label: "Core Switch", kind: "switch", detail: "VLANs, trunking, inter-VLAN routing", x: 410, y: 150 },
  { id: "pve", label: "Proxmox VE", kind: "host", detail: "Type-1 hypervisor — the lab's beating heart", x: 610, y: 150 },
  { id: "eve", label: "EVE-NG", kind: "vm", detail: "Multi-vendor topologies, daily practice", x: 800, y: 48 },
  { id: "cml", label: "Cisco CML", kind: "vm", detail: "CCNA prep, automated provisioning", x: 820, y: 150 },
  { id: "git", label: "GitLab", kind: "vm", detail: "Local CI/CD, lab configs as code", x: 800, y: 252 },
  { id: "mon", label: "Zabbix + Grafana", kind: "endpoint", detail: "Watching the watchers", x: 610, y: 268 },
];

export const topoLinks: TopoLink[] = [
  { from: "wan", to: "fw" },
  { from: "fw", to: "sw" },
  { from: "sw", to: "pve" },
  { from: "pve", to: "eve" },
  { from: "pve", to: "cml" },
  { from: "pve", to: "git" },
  { from: "pve", to: "mon" },
];

// ── Lab log — real entries, each with its cover ─────────────────────────
export type LogEntry = {
  date: string;
  title: string;
  blurb: string;
  href: string;
  image: string;
};

export const labLog: LogEntry[] = [
  {
    date: "jan 2026",
    title: "Inter-VLAN routing",
    blurb: "Traditional router-on-a-stick, both verified end to end with passing pings.",
    href: "/docs/labs/vlan-labs/intervlan-routing",
    image: "/img/lab-log/intervlan-routing.svg",
  },
  {
    date: "nov 2025",
    title: "Access port VLANs",
    blurb: "VLANs configured on a Cisco 2960, access ports assigned, segmentation verified.",
    href: "/docs/labs/vlan-labs/access-vlan",
    image: "/img/lab-log/access-vlan.png",
  },
  {
    date: "jan 2026",
    title: "CDP & LLDP across vendors",
    blurb: "Discovery protocols traced across Cisco and non-Cisco gear in EVE-NG.",
    href: "/docs/labs/multi-vendor",
    image: "/img/lab-log/multi-vendor.jpg",
  },
  {
    date: "nov 2025",
    title: "CCNA 200-301 — passed",
    blurb: "300+ labs in one month; the Mega Lab completed three times.",
    href: "/blog/ccna-journey",
    image: "/img/lab-log/ccna.jpg",
  },
  {
    date: "feb 2026",
    title: "PowerShell remoting at scale",
    blurb: "Software deployed to domain-joined hosts; AD user lifecycle scripted end to end.",
    href: "/docs/labs/windows-powershell/centralized-deployment",
    image: "/img/lab-log/remoting.jpg",
  },
  {
    date: "jul 2026",
    title: "Comma: an earnings tracker for gig workers",
    blurb: "A privacy-first PWA that tracks shifts, mileage, expenses, and taxes — all on-device.",
    href: "/blog/comma",
    image: "/blog/covers/comma.png",
  },
  {
    date: "apr 2026",
    title: "A local GitLab for the lab",
    blurb: "Lab configs versioned, CI/CD pipelines running against the rack.",
    href: "/blog/setting-up-gitlab",
    image: "/img/lab-log/gitlab.jpg",
  },
  {
    date: "dec 2025",
    title: "Router-on-a-stick",
    blurb: "802.1Q subinterfaces routing between VLANs over a single trunk.",
    href: "/docs/labs/office-setup",
    image: "/img/lab-log/office-setup-topology.svg",
  },
];

// ── Tech stack — what the lab actually runs on ─────────────────────────
export type StackItem = {
  name: string;
  role: string;
  href: string;
};

export const techStack: StackItem[] = [
  { name: "Cisco IOS", role: "routing & switching", href: "https://www.cisco.com/site/us/en/products/networking/switches-routers/networking-software/ios/index.html" },
  { name: "EVE-NG", role: "multi-vendor emulation", href: "https://www.eve-ng.net/" },
  { name: "Cisco CML", role: "topology validation", href: "https://www.cisco.com/site/us/en/products/networking/cisco-modeling-labs/index.html" },
  { name: "Packet Tracer", role: "where it started", href: "https://www.netacad.com/cisco-packet-tracer" },
  { name: "Proxmox VE", role: "type-1 hypervisor", href: "https://www.proxmox.com/en/proxmox-virtual-environment/overview" },
  { name: "Wireshark", role: "packet analysis", href: "https://www.wireshark.org/" },
  { name: "FortiGate", role: "firewall & vpn", href: "https://www.fortinet.com/products/next-generation-firewall" },
  { name: "Linux", role: "ubuntu · fedora", href: "https://www.linux.org/" },
  { name: "Windows Server", role: "ad ds · gpo · dhcp", href: "https://www.microsoft.com/en-us/windows-server" },
  { name: "Python", role: "automation", href: "https://www.python.org/" },
  { name: "PowerShell", role: "ad · remoting", href: "https://learn.microsoft.com/en-us/powershell/" },
  { name: "Ansible", role: "config management", href: "https://www.ansible.com/" },
  { name: "Zabbix", role: "monitoring", href: "https://www.zabbix.com/" },
  { name: "Grafana", role: "dashboards", href: "https://grafana.com/" },
  { name: "Docker", role: "containers", href: "https://www.docker.com/" },
  { name: "Git / GitLab", role: "configs as code", href: "https://about.gitlab.com/" },
];

// ── Open source ─────────────────────────────────────────────────────────
export type Project = {
  name: string;
  kind: string;
  stack: string;
  description: string;
  source?: string;
  docs?: string;
};

export const projects: Project[] = [
  {
    name: "Starlight Glide",
    kind: "plugin",
    stack: "starlight · astro",
    description:
      "A plugin that builds a beautiful table-of-contents section for the Starlight documentation framework.",
    docs: "/docs/projects/starlight-glide",
  },
  {
    name: "Starlight Theme",
    kind: "theme",
    stack: "starlight · fumadocs",
    description: "A Fumadocs-inspired theme for Starlight, designed and built from scratch.",
    docs: "/docs/projects/starlight-theme",
  },
  {
    name: "Comma",
    kind: "app",
    stack: "pwa · indexeddb · android",
    description:
      "An offline-first earnings tracker for gig workers. Runs entirely in the browser — no server, all data stays on the device.",
    source: "https://github.com/raiz-toff/comma",
  },
  {
    name: "JobTracker",
    kind: "app",
    stack: "python · desktop",
    description:
      "A lightweight desktop app to track and visualize daily job applications, with progress dials and persistent local storage.",
    source: "https://github.com/raiz-toff/jobtracker",
  },
];
