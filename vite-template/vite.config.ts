import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@PhaserBox2D": path.resolve(__dirname, "src/lib/PhaserBox2D.js"),
      "@constants": path.resolve(__dirname, "src/lib/constants.ts"),
      "@gameState": path.resolve(__dirname, "src/lib/gameState.ts"),
      // Add other aliases from tsconfig.json here if needed in the future
      // Example:
      // '@': path.resolve(__dirname, './src'),
    },
  },
  // Optional: Configure server options if needed
  // server: {
  //   port: 3000,
  // },
  // Optional: Configure build options if needed
  // build: {
  //   outDir: 'dist',
  // },
});
