import { defineConfig } from "vitest/config";
import path from "node:path";

// Vitest config for the app/ workspace. Unit tests live under
// app/src/lib/__tests__/ alongside their source modules. Browser-DOM
// tests would need jsdom; the v0.5 test surface (verifyReceipt +
// ratelimit) is pure-module so we use the default node environment.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/__tests__/**/*.ts"],
    exclude: ["node_modules", "tests/e2e", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
