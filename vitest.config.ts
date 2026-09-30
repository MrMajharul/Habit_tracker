import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "cn": path.resolve(__dirname, "./src/lib/utils"),
    },
  },
  test: {
    environment: "node",
  },
});
