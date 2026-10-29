import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./lib/securityHeaders";

const nextConfig: NextConfig = {
  devIndicators: false,
  // `npm run search:index` builds into its own folder so it can run while
  // `npm run dev` is using .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Production only: the dev server's refresh runtime evaluates code, which the policy forbids.
  // Browsers still ask for /favicon.ico; point them at the 32px icon.
  redirects: async () => [{ source: "/favicon.ico", destination: "/icon-32.png", permanent: true }],
  headers: async () => (process.env.NODE_ENV === "production" ? [{ source: "/:path*", headers: SECURITY_HEADERS }] : []),
};

export default nextConfig;
