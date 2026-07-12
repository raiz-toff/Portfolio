import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

// Static export was dropped when the docs merged in: search (/api/search),
// markdown content negotiation (proxy.ts), and OG generation need a server.
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withMDX(nextConfig);
