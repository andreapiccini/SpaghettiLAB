import { defineConfig } from "vitest/config";

// Placeholder package (see src/index.ts) — no tests yet until S014 adds real content.
// passWithNoTests keeps `npm run test` green across the workspace instead of
// treating "nothing to test yet" as a failure.
export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: true,
  },
});
