import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  // Components are rendered to static markup in a few tests; Next.js compiles JSX itself, vitest needs telling (Vite 8 uses oxc, not esbuild).
  oxc: { jsx: { runtime: "automatic" } },
  // The graph, background and topic checks take over 5s when the CI runner loads 50 workers at once; they pass alone in seconds.
  test: { testTimeout: 30_000, exclude: [...configDefaults.exclude, ".claude/**"] },
  resolve: { alias: { "@": path.resolve(__dirname) } },
});
