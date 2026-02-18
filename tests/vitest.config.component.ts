import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    name: "component",
    include: ["tests/component/**/*.test.tsx"],
    exclude: ["node_modules", "dist"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/setup/component.ts"],
    css: false,
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../packages/shared"),
      "@": path.resolve(__dirname, "../apps/app/client/src"),
    },
  },
});
