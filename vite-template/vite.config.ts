import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@PhaserBox2D": path.resolve(__dirname, "src/lib/PhaserBox2D.js"),
      "@constants": path.resolve(__dirname, "src/lib/constants.ts"),
      "@gameState": path.resolve(__dirname, "src/lib/gameState.ts"),
      "@entities": path.resolve(__dirname, "src/entities"),
      "@scenes": path.resolve(__dirname, "src/scenes"),
      "@ui": path.resolve(__dirname, "src/ui"),
    },
  },
});
