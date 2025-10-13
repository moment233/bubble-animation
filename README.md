# 🫧 气泡动画项目

一个基于 Three.js 和 WebGL Shader 的彩虹气泡动画效果。

## ✨ 特性

- 17 个独特的气泡，每个都有不同的形状和动画参数
- 薄膜干涉效果，呈现自然的彩虹色渐变
- 平滑的边缘透明度和立体感
- 响应式设计，适配各种屏幕尺寸

## 🚀 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📦 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 自动部署完成！

## 🎨 技术栈

- Three.js - 3D 图形库
- WebGL Shaders (GLSL) - 自定义视觉效果
- Vite - 构建工具
- Simplex Noise - 形变动画

## 📝 文件说明

- `bubbles.html` - 主页面
- `bubbles.js` - 气泡配置和逻辑
- `bubbleShader.js` - 自定义 Shader（顶点和片段着色器）
- `vite.config.js` - Vite 配置
- `vercel.json` - Vercel 部署配置

---

Made with ❤️ using Three.js
