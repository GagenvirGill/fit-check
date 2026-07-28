import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["api/test/**/*.test.ts"],
    exclude: ["apps/**", "dist/**", "node_modules/**"],
  },
});
