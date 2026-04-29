import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@aivo/aac-bridge": "../../packages/aac-bridge/src/index.ts",
    },
  },
});
