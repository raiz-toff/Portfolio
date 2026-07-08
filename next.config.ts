import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

// Static export was dropped when the docs merged in: search (/api/search),
// markdown content negotiation (proxy.ts), and OG generation need a server.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Allow remote images (e.g. badges/diagrams pasted from the web) so
    // next/image doesn't throw on unconfigured hosts.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default withMDX(nextConfig);
