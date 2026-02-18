import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    name: "api",
    include: ["tests/api/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    environment: "node",
    globals: true,
    setupFiles: ["tests/setup/api.ts"],
    testTimeout: 15000,
    hookTimeout: 20000,
    sequence: {
      concurrent: false,
    },
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage/api",
      include: ["apps/api/**/*.ts"],
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../packages/shared"),
      "@api": path.resolve(__dirname, "../apps/api"),
    },
  },
});
