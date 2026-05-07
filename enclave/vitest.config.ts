import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Force Vite/Vitest to resolve the @0gfoundation/0g-storage-ts-sdk Node entry under
    // the "require" condition. The SDK's exports map gates "node" to ESM,
    // but our TS5.6 + module: commonjs config compiles to require-style
    // output. Without this, Vite throws "not exported under conditions"
    // when storage.spec.ts loads the SDK.
    server: {
      deps: {
        inline: ["@0gfoundation/0g-storage-ts-sdk"],
      },
    },
  },
  resolve: {
    conditions: ["require", "node"],
  },
});
