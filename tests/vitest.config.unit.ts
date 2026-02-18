import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    name: "unit",
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    environment: "node",
    globals: true,
    setupFiles: ["tests/setup/unit.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage/unit",
      include: [
        "packages/shared/**/*.ts",
        "apps/app/client/src/design-system/**/*.ts",
        "apps/app/client/src/lib/**/*.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../packages/shared"),
    },
  },
});
