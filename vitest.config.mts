import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    // Mirrors the `@/*` path mapping in tsconfig.json. Without it, anything under
    // src/app is untestable: those files import via `@/`, so a test that imported a
    // route handler failed to resolve rather than failing an assertion. That is why
    // sitemap.ts and robots.ts had no coverage.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
