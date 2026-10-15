import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Components are rendered to static markup in a few tests; Next.js compiles JSX itself, vitest needs telling (Vite 8 uses oxc, not esbuild).
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": path.resolve(__dirname) } },
});
