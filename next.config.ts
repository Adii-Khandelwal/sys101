import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // `npm run search:index` builds into its own folder so it can run while
  // `npm run dev` is using .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
