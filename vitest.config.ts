import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Components are rendered to static markup in a few tests; Next.js compiles JSX itself, vitest needs telling.
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": path.resolve(__dirname) } },
});
