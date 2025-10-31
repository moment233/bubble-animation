# Three-Nebula 几何体粒子瓦解效果 - NPM 版本

## 💥 项目说明

使用 npm 本地安装 three-nebula 粒子库，实现点击几何体后从点击位置向外波纹扩散瓦解的粒子效果。

## ✅ 优势

- ✅ 无 CORS 问题
- ✅ 本地依赖，加载更快
- ✅ 完整的模块支持
- ✅ 使用 Vite 开发服务器（热更新）

## 📦 已安装的依赖

- `three` - Three.js 3D 库
- `three-nebula` - 粒子系统库
- `vite` - 现代化开发服务器

## 🚀 运行项目

```bash
# 启动开发服务器
npm run dev

# 然后在浏览器打开显示的地址（通常是 http://localhost:5173）
```

## 🎨 效果特点

1. **点击交互** - 点击任意几何体触发瓦解效果
2. **波纹扩散** - 从点击位置开始向外扩散瓦解
3. **彩色渐变** - 粒子颜色自动循环变化（HSL）
4. **自动重生** - 瓦解完成后几何体自动重新生成
5. **多个几何体** - 5 个不同形状（立方体、球体、圆环、圆锥、圆柱）

## 📁 文件结构

```
nebula-particle-demo/
├── index.html          # 主HTML文件
├── main.js             # 主JavaScript文件（粒子效果）
├── package.json        # NPM配置文件
├── node_modules/       # 依赖包
└── README.md          # 说明文档
```

## 🎯 核心实现

### 点击检测

使用 Three.js Raycaster 检测点击的几何体和位置。

### 几何体采样

从几何体表面采样顶点，每个采样点将生成粒子。

### 波纹扩散

```javascript
// 计算每个采样点到点击位置的距离
const distance = point.distanceTo(clickPoint);
const delay = distance * 0.01; // 延迟发射

// 从点击位置指向采样点的方向
const direction = new THREE.Vector3().subVectors(point, clickPoint).normalize();
```

### 粒子发射器

```javascript
const emitter = new Emitter()
  .setRate(new Rate(new Span(1, 2), new Span(0.05)))
  .addInitializers([
    new Position(new PointZone(point.x, point.y, point.z)),
    new Velocity(new Vector3D(velocity.x, velocity.y, velocity.z)),
    new Life(1, 2),
  ])
  .addBehaviours([
    new Alpha(1, 0),
    new Scale(1, 0.2),
    new Color(color1, color2),
  ]);
```

## 🔧 开发命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
```
