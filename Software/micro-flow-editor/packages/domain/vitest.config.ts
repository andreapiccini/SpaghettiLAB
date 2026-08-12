import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      // Port interface files (src/ports/*.ts, excluding fakes/) declare types only —
      // no executable statements, so they have nothing meaningful to cover.
      exclude: [
        "src/**/__tests__/**",
        "src/index.ts",
        "src/ports/index.ts",
        "src/ports/*.ts",
      ],
    },
  },
});
