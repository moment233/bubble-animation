import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
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
