import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["tests/setup/db.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/types/**/*.ts", "src/db/schema.ts"],
    },
    hookTimeout: 30000, // DB container can take a few seconds to start
  },
});
