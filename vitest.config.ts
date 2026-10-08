import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Server actions log failures on purpose; keep the test output readable.
    silent: "passed-only",
    // next-auth imports "next/server" without a file extension, which Node's own ESM loader
    // can't resolve. Letting Vite bundle it fixes that.
    server: { deps: { inline: ["next-auth"] } },
  },
});
