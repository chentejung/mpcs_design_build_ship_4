import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Pure logic only (AGENTS.md → Testing); what a visitor sees is Playwright's, in tests/e2e.
// server-only throws outside a React Server bundle; its react-server build is an empty module.
export default defineConfig({
  resolve: { alias: { "@": here("."), "server-only": here("node_modules/server-only/empty.js") } },
  test: { include: ["lib/**/*.test.ts"] },
});
