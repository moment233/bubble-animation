import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // 设置 bubbles.html 为入口页面
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "bubbles.html"),
      },
    },
    outDir: "dist",
  },
  // 开发服务器配置
  server: {
    open: "/bubbles.html",
  },
  // 优化依赖处理
  optimizeDeps: {
    include: ["three"],
  },
});
