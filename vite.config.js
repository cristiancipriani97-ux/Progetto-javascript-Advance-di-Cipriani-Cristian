import { defineConfig } from "vitest/config";

export default defineConfig({
  // Percorsi relativi: l'app funziona su qualsiasi hosting statico (Netlify, Firebase, ...).
  base: "./",
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
  },
});
