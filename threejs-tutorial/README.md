# Three.js 从入门到气泡 - 15 步实战教程

> 从零开始学习 Three.js 和着色器编程，最终实现真实的气泡效果

## 📚 教程内容

本教程包含 15 个循序渐进的练习步骤：

### 基础篇 (1-6)

1. **静态立方体** - Scene、Camera、Renderer 三要素
2. **旋转立方体** - requestAnimationFrame 动画循环
3. **球体几何体** - 不同几何体类型
4. **透明材质** - transparent 和 opacity 属性
5. **垂直浮动** - Math.sin() 周期运动
6. **复合动画** - 多轴运动组合

### 着色器篇 (7-10)

7. **纯色着色器** - ShaderMaterial 和 GLSL 入门
8. **uniform 变量** - JavaScript 传数据到着色器
9. **位置渐变** - varying 变量和插值
10. **法向量可视化** - 理解表面朝向

### 高级篇 (11-15)

11. **基础菲涅耳** - 边缘检测（dot product）
12. **进阶菲涅耳** - 边缘发光（pow 函数）
13. **薄膜干涉** - 彩虹色原理
14. **环境映射** - HDR 反射效果
15. **完整气泡** - 综合所有技术 + 物理动画

## 🚀 快速开始

### 方法一：使用 npm serve

```bash
# 安装依赖并启动（推荐）
npm start
# 或
npm run dev
```

然后访问：http://localhost:3000

### 方法二：使用 Python 服务器

```bash
python -m http.server 3000
# 或 Python 3
python3 -m http.server 3000
```

然后访问：http://localhost:3000

### 方法三：直接打开

也可以直接用浏览器打开 `index.html`，但 Step 14 和 15 的 HDR 环境映射可能无法加载（需要 HTTP 服务器）。

## 📁 文件结构

```
threejs-tutorial/
├── index.html                    # 主教程页面（15个交互式Demo）
├── radial_ramp_01.hdr           # HDR 环境贴图
├── package.json                 # npm 配置
├── README.md                    # 项目说明
│
├── LEARNING_ROADMAP.md          # 📚 学习路线图（从这里开始！）
├── SHADER_LEARNING_GUIDE.md     # 🎯 着色器实战指南（19个实验）
├── EXPERIMENT_LOG.md            # 📝 实验记录模板
└── GLSL_QUICK_REFERENCE.md      # ⚡ GLSL 快速参考卡片
```

## ✨ 特性

- ✅ **完全独立** - 单个 HTML 文件，所有依赖从 CDN 加载
- ✅ **15 个实时示例** - 每个练习都有可运行的 Canvas 预览
- ✅ **代码高亮** - 使用 Prism.js 语法高亮
- ✅ **详细注释** - 每行关键代码都有中文注释
- ✅ **渐进式学习** - 从基础到高级，循序渐进
- ✅ **响应式设计** - 适配不同屏幕尺寸
- ✅ **现代化 UI** - 深色主题，清晰易读

## 📖 完整学习资料

本教程提供了**系统化的学习路径**，包含交互式 Demo 和深度学习指南：

### 🗺️ 从这里开始

**第一步：阅读学习路线图**  
📄 打开 [`LEARNING_ROADMAP.md`](./LEARNING_ROADMAP.md)

这是你的**学习导航**，包含：

- 🎯 清晰的学习目标和期望
- 📅 5 天学习计划（每天 3-5 小时）
- ✅ 详细的学习检查清单
- 💡 高效学习技巧和建议
- 🔗 扩展阅读和进阶方向

---

### 🎯 核心学习材料

#### 1️⃣ 主教程页面（index.html）

**访问：** http://localhost:62388

- **15 个交互式 Demo** - 从基础到高级
- **实时代码预览** - 所见即所得
- **详细注释** - 每步都有解释

**适合：** 快速浏览和理解整体流程

---

#### 2️⃣ 着色器实战指南

📄 [`SHADER_LEARNING_GUIDE.md`](./SHADER_LEARNING_GUIDE.md)

**这是主要学习材料！** 包含：

- **19 个动手实验** 分 5 个阶段
- 每个实验都有详细步骤和预期效果
- 练习题和调试技巧
- 常见错误解决方案

**学时：** 12-17 小时  
**适合：** 深入理解着色器编程

**5 个学习阶段：**

1. 理解数据流动（5 个实验）
2. 理解 varying 插值（3 个实验）
3. 理解 uniform 变量（3 个实验）
4. 理解数学函数（5 个实验）
5. 理解复杂效果（3 个实验）

---

#### 3️⃣ 实验记录模板

📄 [`EXPERIMENT_LOG.md`](./EXPERIMENT_LOG.md)

用这个模板记录你的学习过程：

- ✍️ 记录每个实验的完成日期
- 💭 写下你的理解和发现
- 🐛 保存错误和解决方法
- 📊 追踪学习进度

**建议：** 每完成一个实验就填写

---

#### 4️⃣ GLSL 快速参考卡片

📄 [`GLSL_QUICK_REFERENCE.md`](./GLSL_QUICK_REFERENCE.md)

做实验时随时查阅的速查手册：

- 📦 数据类型和向量操作
- 🧮 常用数学函数
- 🎨 颜色和插值
- 🔧 调试技巧
- ⚠️ 常见陷阱

**建议：** 打印出来或在第二屏幕打开

---

### 📅 推荐学习流程

```
第1天 (3-4h)  → 浏览主教程 + 阶段1实验（数据流动）
第2天 (3-4h)  → 阶段2+3实验（varying和uniform）
第3天 (4-5h)  → 阶段4实验（数学函数）
第4天 (4-5h)  → 阶段5实验（复杂效果）
第5天 (3-4h)  → 自由创作 + 总结
```

详细计划请参考 [`LEARNING_ROADMAP.md`](./LEARNING_ROADMAP.md)

---

## 💡 快速学习建议

1. **按顺序学习** - 每个步骤都建立在前一个基础上
2. **动手实验** - 尝试修改代码参数，观察效果变化
3. **记录笔记** - 使用 `EXPERIMENT_LOG.md` 记录过程
4. **理解原理** - 不要死记硬背代码
5. **查阅参考** - 善用 `GLSL_QUICK_REFERENCE.md`
6. **实践项目** - 完成教程后，尝试创建自己的效果

## 🎯 学习目标

完成本教程后，你将能够：

- ✅ 掌握 Three.js 的核心概念和 API
- ✅ 理解 WebGL 渲染管线
- ✅ 编写 GLSL 着色器程序
- ✅ 实现复杂的视觉效果（菲涅耳、薄膜干涉等）
- ✅ 使用 HDR 环境贴图
- ✅ 创建物理动画效果
- ✅ 独立开发 3D Web 项目

## 🔗 相关资源

- [Three.js 官方文档](https://threejs.org/docs/)
- [Three.js 示例](https://threejs.org/examples/)
- [The Book of Shaders](https://thebookofshaders.com/) - 着色器入门
- [WebGL Fundamentals](https://webglfundamentals.org/) - WebGL 基础

## 💡 常见问题

### Q: 为什么 Step 14 和 15 看不到环境反射？

A: 这两个步骤需要加载 HDR 文件，必须通过 HTTP 服务器运行。使用 `npm start` 或 Python 服务器即可。

### Q: 可以修改代码吗？

A: 当然可以！这是学习的最好方式。打开浏览器开发者工具，直接在 Console 中尝试修改参数。

### Q: 性能问题怎么办？

A: 如果遇到卡顿，可以：

- 降低球体分段数（64 → 32）
- 减少同时运行的动画数量
- 使用性能更好的浏览器（Chrome/Edge）

## 📝 License

MIT

---

**祝你学习愉快！** 🎈✨

如有问题或建议，欢迎提 Issue 或 PR。
