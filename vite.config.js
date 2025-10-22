import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        perfectSphere: "perfect-sphere.html",
        realisticBubble: "realistic-bubble.html",
      },
    },
    outDir: "dist",
  },
  server: {
    open: "/index.html",
  },
  resolve: {
    extensions: [".js", ".ts", ".json"],
  },
});
