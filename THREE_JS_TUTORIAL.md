# Three.js 气泡效果完全教程

> 从零开始学习 Three.js，理解真实气泡的实现原理

---

## 目录

1. [Three.js 基础概念](#1-threejs-基础概念)
2. [React Three Fiber 简介](#2-react-three-fiber-简介)
3. [真实气泡实现分解](#3-真实气泡实现分解)
4. [关键技术详解](#4-关键技术详解)
5. [完整代码解析](#5-完整代码解析)
6. [学习建议](#6-学习建议)

---

## 1. Three.js 基础概念

### 1.1 什么是 Three.js？

Three.js 是一个 JavaScript 3D 库，它让你可以在浏览器中创建和显示 3D 图形，而不需要深入了解复杂的 WebGL API。

想象一下：

- **WebGL** = 汽车引擎（复杂、底层）
- **Three.js** = 方向盘和油门（简单、易用）

### 1.2 Three.js 的核心三要素

创建任何 3D 场景都需要三个基本元素：

```
┌─────────────────────────────────────┐
│         🎬 场景 (Scene)              │
│  ┌──────────────────────────────┐   │
│  │  📷 相机 (Camera)             │   │
│  │  ↓ 观察方向                   │   │
│  │  🔵 物体 (Mesh)               │   │
│  │    = 几何体 + 材质             │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
         ↓
    🖼️ 渲染器 (Renderer)
    （绘制到屏幕）
```

#### 场景 (Scene)

场景是 3D 世界的容器，所有物体都放在场景里。

```javascript
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // 黑色背景
```

#### 相机 (Camera)

相机决定了你从哪个角度看 3D 世界。最常用的是**透视相机**（近大远小）。

```javascript
const camera = new THREE.PerspectiveCamera(
  60, // fov: 视野角度（度数）
  window.innerWidth / window.innerHeight, // aspect: 宽高比
  0.1, // near: 最近能看到的距离
  100 // far: 最远能看到的距离
);
camera.position.set(0, 0, 30); // 设置相机位置 (x, y, z)
```

**相机参数可视化：**

```
            视野角 (fov = 60°)
               ╱│╲
              ╱ │ ╲
             ╱  │  ╲
            ╱   │   ╲
           ╱    │    ╲
        相机    │    物体
      (0,0,30)  │   (0,0,0)
                │
            30 个单位
```

#### 渲染器 (Renderer)

渲染器负责把 3D 场景绘制到网页上。

```javascript
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 渲染循环
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera); // 用相机渲染场景
}
animate();
```

### 1.3 创建一个 3D 物体

任何 3D 物体都由两部分组成：

#### 几何体 (Geometry) - 形状

定义物体的形状（顶点、面）。

```javascript
// 创建一个球体
const geometry = new THREE.SphereGeometry(
  1, // 半径
  64, // 水平分段数（越大越圆滑）
  64 // 垂直分段数（越大越圆滑）
);
```

**分段数的影响：**

```
widthSegments = 8        widthSegments = 32
    ___                      ___
   /   \                    /   \
  |  ◯  |                  |  ●  |
   \___/                    \___/
  棱角分明                  非常圆滑
```

#### 材质 (Material) - 外观

定义物体的颜色、透明度、反光等。

```javascript
// 基础材质（不受光照影响）
const material = new THREE.MeshBasicMaterial({
  color: 0x00ff00, // 绿色
  transparent: true, // 允许透明
  opacity: 0.5, // 50% 透明
});
```

#### 网格 (Mesh) - 组合

把几何体和材质组合成可见的物体。

```javascript
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh); // 添加到场景
```

### 1.4 坐标系统

Three.js 使用右手坐标系：

```
        Y (上)
        │
        │
        │
        └───────── X (右)
       ╱
      ╱
     Z (前)

- X 轴：左(-) → 右(+)
- Y 轴：下(-) → 上(+)
- Z 轴：后(-) → 前(+)
```

**位置示例：**

```javascript
mesh.position.set(5, 10, -3);
// x = 5:  向右移 5 个单位
// y = 10: 向上移 10 个单位
// z = -3: 向后移 3 个单位
```

---

## 2. React Three Fiber 简介

### 2.1 为什么用 React Three Fiber？

传统 Three.js 代码：

```javascript
// 命令式，繁琐
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(...);
const renderer = new THREE.WebGLRenderer();
const geometry = new THREE.SphereGeometry(1, 64, 64);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
// ... 还要处理生命周期、清理等
```

React Three Fiber (R3F) 代码：

```javascript
// 声明式，简洁
<Canvas>
  <mesh>
    <sphereGeometry args={[1, 64, 64]} />
    <meshBasicMaterial color="green" />
  </mesh>
</Canvas>
```

### 2.2 核心概念

#### Canvas 组件

Canvas 自动创建场景、相机、渲染器，并启动渲染循环。

```javascript
<Canvas
  camera={{ fov: 60, position: [0, 0, 30] }}
  dpr={[1, 2]} // 设备像素比（高清屏支持）
>
  {/* 3D 内容 */}
</Canvas>
```

#### 声明式 3D 对象

Three.js 对象可以直接写成 JSX：

```javascript
// Three.js 类名转小驼峰
<mesh>                          {/* new THREE.Mesh() */}
  <sphereGeometry args={[...]} /> {/* new THREE.SphereGeometry(...) */}
  <meshBasicMaterial />         {/* new THREE.MeshBasicMaterial() */}
</mesh>
```

**属性映射：**

```javascript
// Three.js 属性 → JSX 属性
mesh.position.set(1, 2, 3)  →  <mesh position={[1, 2, 3]} />
mesh.scale.set(2, 2, 2)     →  <mesh scale={2} />  // 或 [2, 2, 2]
mesh.rotation.x = Math.PI   →  <mesh rotation-x={Math.PI} />
material.color = "red"      →  <meshBasicMaterial color="red" />
```

### 2.3 重要的 Hooks

#### useFrame - 动画循环

在每一帧执行代码（约 60 次/秒）。

```javascript
import { useFrame } from "@react-three/fiber";

function AnimatedBox() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    // state: 包含 clock, camera, scene 等
    // delta: 距离上一帧的时间（秒）

    meshRef.current.rotation.y += delta; // 每帧旋转
    meshRef.current.position.y += 0.01; // 每帧向上移动
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshBasicMaterial color="orange" />
    </mesh>
  );
}
```

**useFrame 执行频率：**

```
时间轴: 0ms ──── 16ms ──── 32ms ──── 48ms ────>
执行:    ↓        ↓        ↓        ↓
       帧1      帧2      帧3      帧4
       (60 FPS ≈ 每 16.67ms 一帧)
```

#### useThree - 访问 Three.js 核心对象

获取场景、相机、渲染器等。

```javascript
import { useThree } from "@react-three/fiber";

function MyComponent() {
  const { camera, scene, gl } = useThree();
  // camera: 相机
  // scene: 场景
  // gl: 渲染器 (WebGLRenderer)

  return <mesh />;
}
```

#### useLoader - 加载资源

加载纹理、模型、HDR 等资源。

```javascript
import { useLoader } from "@react-three/fiber";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

function Scene() {
  const envMap = useLoader(RGBELoader, "/path/to/hdr.hdr");

  return <mesh material-envMap={envMap} />;
}
```

---

## 3. 真实气泡实现分解

现在我们来拆解 `react-bubble` 中真实气泡的实现。整个气泡效果由以下几部分组成：

```
真实气泡 = 形状 + 视觉效果 + 物理运动 + 交互
           ↓        ↓          ↓        ↓
         球体   着色器      动画循环    点击破裂
```

### 3.1 气泡的形状

#### 基础球体

```javascript
<sphereGeometry ref={geometryRef} args={[config.size, 64, 64]} />
```

- `config.size`：球体半径（1.2 ~ 2.0）
- `64, 64`：高分段数，让球体非常圆滑

#### 顶点形变（让气泡不规则）

真实气泡不是完美球体，表面会波动。通过修改顶点位置实现：

```javascript
const updateVertices = (time) => {
  const geometry = geometryRef.current;
  const positionAttribute = geometry.getAttribute("position");
  const vector = new THREE.Vector3();

  // 遍历所有顶点
  for (let i = 0; i < positionAttributeBase.current.count; i++) {
    // 获取原始顶点位置
    vector.fromBufferAttribute(positionAttributeBase.current, i);

    // 用 3D 噪声函数计算形变量
    const noise = simplex.noise3d(
      vector.x * config.spikes, // X 坐标影响
      vector.y * config.spikes, // Y 坐标影响
      vector.z * config.spikes + animTime // Z + 时间（产生动画）
    );

    // 缩放顶点（0.98 ~ 1.03 倍）
    const ratio = noise * (0.05 * config.processing) + 0.98;
    vector.multiplyScalar(ratio);

    // 更新顶点位置
    positionAttribute.setXYZ(i, vector.x, vector.y, vector.z);
  }

  geometry.attributes.position.needsUpdate = true; // 通知 Three.js 更新
  geometry.computeVertexNormals(); // 重新计算法向量（光照需要）
};
```

**形变原理可视化：**

```
原始球体:          添加噪声后:
    ●                  ◐
  /   \              /   \
 |  o  |     →     |  ∿  |  ← 表面波动
  \   /              \   /
    ●                  ◑

config.spikes: 控制波动频率（越大波动越密集）
config.processing: 控制波动幅度（越大波动越明显）
```

### 3.2 气泡的视觉效果（着色器）

这是气泡看起来真实的关键！使用自定义着色器模拟真实物理现象。

#### 什么是着色器？

着色器是运行在 GPU 上的小程序，决定每个像素的颜色。

```
CPU (JavaScript)          GPU (着色器)
     ↓                        ↓
  设置参数    →    顶点着色器 → 片段着色器 → 屏幕
  (uniforms)       (处理顶点)   (处理颜色)
```

#### 顶点着色器 (Vertex Shader)

处理每个顶点的位置，传递数据给片段着色器。

```glsl
varying vec3 vNormal;    // 传递给片段着色器的法向量
varying vec3 vPosition;  // 传递给片段着色器的位置

void main() {
  vNormal = normal;      // normal 是内置变量（顶点法向量）
  vPosition = position;  // position 是内置变量（顶点位置）

  // 计算最终顶点位置（投影到屏幕）
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  //            ↑                  ↑                     ↑
  //         投影矩阵          模型视图矩阵           顶点位置
  //       (相机投影)        (世界 → 相机空间)
}
```

#### 片段着色器 (Fragment Shader)

决定每个像素的颜色。这里实现了多种真实物理效果：

##### 1. 菲涅耳效应 (Fresnel Effect)

现实中，从侧面看气泡比从正面看更亮。

```glsl
vec3 viewDirection = normalize(uCameraPos - vPosition);
float NdotV = abs(dot(vNormal, viewDirection));
//            ↑
//   法向量与视线的夹角余弦值

// NdotV = 1.0: 正面看（垂直）
// NdotV = 0.0: 侧面看（平行）

float fresnel = pow(1.0 - NdotV, 1.8);
// fresnel = 0.0: 中心（暗）
// fresnel = 1.0: 边缘（亮）
```

**可视化：**

```
       正面看               侧面看
      (NdotV≈1)           (NdotV≈0)
    ┌─────────┐         ┌─────────┐
    │   ●●●   │         │█████████│
    │  ●   ●  │         │█████████│
    │   ●●●   │         │█████████│
    └─────────┘         └─────────┘
     中心暗              边缘亮
```

##### 2. 薄膜干涉 (Thin Film Interference)

气泡表面产生彩虹色的原理：光波在薄膜两侧反射后发生干涉。

```glsl
vec3 getThinFilmColor(float cosTheta, float thickness) {
  // 光程差 = 2 × 折射率 × 厚度 × cos(角度)
  float opticalPath = 2.0 * 1.33 * thickness * cosTheta;

  // 计算不同波长的干涉
  float phaseR = (2.0 * PI * opticalPath) / 650.0;  // 红光 650nm
  float phaseG = (2.0 * PI * opticalPath) / 550.0;  // 绿光 550nm
  float phaseB = (2.0 * PI * opticalPath) / 450.0;  // 蓝光 450nm

  // 干涉强度（相位相同时增强，相反时减弱）
  float intensityR = pow(0.5 + 0.5 * cos(phaseR), 1.2);
  float intensityG = pow(0.5 + 0.5 * cos(phaseG), 1.2);
  float intensityB = pow(0.5 + 0.5 * cos(phaseB), 1.2);

  // 混合成最终颜色
  vec3 color = vec3(intensityR, intensityG, intensityB);
  return color;
}
```

**干涉原理：**

```
入射光
  ↓
━━━━━━━  ← 薄膜表面
  ╱╲
 ╱  ╲     反射1
╱    ╲    反射2
━━━━━━━
  ↓
当两束光相位差 = 0, 2π, 4π, ... → 增强（亮）
当两束光相位差 = π, 3π, 5π, ... → 减弱（暗）

不同波长的光相位差不同 → 产生不同颜色
```

##### 3. 环境映射 (Environment Mapping)

反射周围环境，让气泡看起来有真实的反光。

```glsl
// 计算反射方向
vec3 reflected = reflect(-viewDirection, normalize(vNormal));

// 从 HDR 环境贴图采样
vec3 envColor = textureCube(envMap, reflected).rgb;
```

**反射原理：**

```
      相机
       ↑ viewDirection
       │
       │
    ●──┴──●  ← 气泡表面（法向量 ⊥）
    ↓ reflected
   环境
```

##### 4. 折射 (Refraction)

光线穿过气泡时发生弯曲。

```glsl
// 计算折射方向（空气 → 肥皂水，折射率 1.0 → 1.33）
vec3 refracted = refract(-viewDirection, normalize(vNormal), 1.0 / 1.33);

// 从环境贴图采样折射颜色
vec3 refractColor = textureCube(envMap, refracted).rgb;
```

**折射原理（斯涅尔定律）：**

```
空气 (n=1.0)
─────────────
   ↓   ╲
   ↓    ╲ ← 光线弯曲
   ↓     ↓
肥皂水 (n=1.33)

折射角度 = arcsin(1.0 / 1.33 × sin(入射角))
```

##### 5. 透明度控制

中心透明，边缘不透明，能看穿气泡。

```glsl
// 边缘遮罩
float edgeMask = smoothstep(0.2, 0.95, fresnel);
//                ↑          ↑    ↑     ↑
//            平滑过渡      起点  终点  输入值

// 透明度：中心 15%，边缘 95%
float alpha = edgeMask * 0.95 + (1.0 - edgeMask) * 0.15;
```

#### 材质配置

```javascript
<shaderMaterial
  ref={materialRef}
  vertexShader={bubbleVertexShader} // 顶点着色器代码
  fragmentShader={bubbleFragmentShader} // 片段着色器代码
  uniforms={{
    uCameraPos: { value: camera.position }, // 传递相机位置
    envMap: { value: envMap }, // 传递环境贴图
  }}
  transparent={true} // 启用透明
  side={THREE.DoubleSide} // 双面渲染
  depthWrite={false} // 不写入深度（透明物体需要）
/>
```

### 3.3 气泡的物理运动

使用 `useFrame` 实现逼真的物理动画。

```javascript
useFrame(({ clock }) => {
  const mesh = meshRef.current;
  const deltaTime = clock.getDelta(); // 距离上一帧的时间
  const currentTime = performance.now(); // 当前时间戳

  // 1. 向上漂浮（模拟浮力）
  const terminalVelocity = 0.04; // 终端速度
  const damping = 0.03; // 阻尼系数

  // 速度逐渐接近终端速度
  p.verticalVelocity += (terminalVelocity - p.verticalVelocity) * damping;
  mesh.position.y += p.verticalVelocity * deltaTime * 300;

  // 2. X 轴摇摆（正弦波）
  p.swayPhase += p.swayFrequency * deltaTime * Math.PI * 10;
  let swayOffset = Math.sin(p.swayPhase) * p.swayAmplitude;
  mesh.position.x = p.baseX + swayOffset;

  // 3. Z 轴摇摆（前后运动）
  p.zSwayPhase += p.zSwayFrequency * deltaTime * Math.PI * 10;
  let zSwayOffset = Math.sin(p.zSwayPhase) * p.zSwayAmplitude;
  mesh.position.z = p.baseZ + zSwayOffset;

  // 4. 深度缩放（近大远小）
  const depthScale = 0.5 + ((z - Z_MIN) / (Z_MAX - Z_MIN)) * 1.0;
  mesh.scale.set(depthScale, depthScale, depthScale);

  // 5. 湍流扰动（添加随机性）
  const turbulenceX =
    simplex.noise3d(
      mesh.position.x * 0.1,
      currentTime * 0.0002,
      p.noiseOffset
    ) * 0.01;
  mesh.position.x += turbulenceX;

  // 6. 边界检测
  if (mesh.position.y > 20) {
    respawn(); // 重生或破裂
  }
});
```

**运动轨迹可视化：**

```
Y (向上漂浮)
↑     ╱╲      ╱╲      ╱╲
│    ╱  ╲    ╱  ╲    ╱  ╲
│   ╱    ╲  ╱    ╲  ╱    ╲
│  ╱      ╲╱      ╲╱      ╲
│ ●                          ← X 轴摇摆（正弦波）
└─────────────────────────→ X

Z 轴: 前后摇摆（垂直纸面）
湍流: 微小随机抖动
```

### 3.4 气泡破裂效果

点击气泡时触发破裂动画。

```javascript
const handleBurst = () => {
  stateRef.current = BUBBLE_STATE.BURSTING;
  burstStartTimeRef.current = performance.now();

  // 保存原始缩放
  originalScaleRef.current = {
    x: mesh.scale.x,
    y: mesh.scale.y,
    z: mesh.scale.z,
  };
};

// 在 useFrame 中处理收缩动画
if (stateRef.current === BUBBLE_STATE.BURSTING) {
  const elapsed = currentTime - burstStartTimeRef.current;
  const shrinkDuration = 120; // 120 毫秒
  const progress = Math.min(elapsed / shrinkDuration, 1);

  // 缩放到 5%
  const scale = 1 - progress * 0.95;
  mesh.scale.set(
    originalScale.x * scale,
    originalScale.y * scale,
    originalScale.z * scale
  );

  if (progress >= 1) {
    mesh.visible = false; // 隐藏气泡
    onBurst(mesh.position.clone(), config, respawn); // 触发液滴效果
  }
}
```

**破裂时间线：**

```
时间: 0ms ──────────────── 120ms
大小: 100% → 75% → 50% → 25% → 5%
       ●      ○      ∘      ·      (消失)
                                    ↓
                                 生成液滴
```

---

## 4. 关键技术详解

### 4.1 HDR 环境贴图

#### 什么是 HDR？

HDR (High Dynamic Range) = 高动态范围图像，能记录比普通图片更宽的亮度范围。

```
普通图片 (LDR):        HDR 图片:
明度范围: 0 - 255       明度范围: 0 - 无限大

☀️ 太阳 → 255 (截断)    ☀️ 太阳 → 10000 (真实亮度)
🌤️ 天空 → 200          🌤️ 天空 → 800
🏠 建筑 → 100          🏠 建筑 → 100
🌲 树木 → 50           🌲 树木 → 50
```

#### 为什么用 HDR？

1. **真实反射**：气泡能反射真实的高光（如太阳）
2. **自然光照**：提供环境光照明
3. **更好的色彩**：保留高光细节

#### 如何加载 HDR？

```javascript
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { useLoader } from "@react-three/fiber";

function Scene() {
  // 加载 .hdr 文件
  const envMap = useLoader(RGBELoader, "/radial_ramp_01.hdr");

  useEffect(() => {
    // 设置为等距柱状投影
    envMap.mapping = THREE.EquirectangularReflectionMapping;

    // 应用到场景
    scene.environment = envMap; // 用于光照
    scene.background = envMap; // 用于背景（可选）
  }, [envMap]);

  return (
    <mesh>
      <sphereGeometry />
      <shaderMaterial uniforms={{ envMap: { value: envMap } }} />
    </mesh>
  );
}
```

**环境贴图映射：**

```
HDR 图片 (2D 全景图):
┌──────────────────────────────────┐
│    天空                           │
│  ☀️    🌤️      🌤️               │
├──────────────────────────────────┤
│  🏠  🌲  🏢  🌲  🏠             │
└──────────────────────────────────┘
         ↓ 映射到
      3D 球体包围场景:
         ☀️
       ╱│╲
      🌤️│🌤️
     ╱  │  ╲
    🏠 [●] 🏢  ← [●] 是气泡
       🌲
```

### 4.2 着色器深入

#### GLSL 语言基础

GLSL (OpenGL Shading Language) 是着色器的编程语言，语法类似 C。

```glsl
// 数据类型
float a = 1.0;           // 浮点数（必须有小数点）
int b = 1;               // 整数
bool c = true;           // 布尔值
vec2 v2 = vec2(1.0, 2.0);  // 2D 向量
vec3 v3 = vec3(1.0, 2.0, 3.0);  // 3D 向量（RGB / XYZ）
vec4 v4 = vec4(1.0, 2.0, 3.0, 4.0);  // 4D 向量（RGBA / XYZW）

// 向量操作
vec3 a = vec3(1.0, 2.0, 3.0);
vec3 b = vec3(4.0, 5.0, 6.0);

vec3 sum = a + b;           // 分量相加: (5, 7, 9)
vec3 scaled = a * 2.0;      // 标量乘法: (2, 4, 6)
float dotProd = dot(a, b);  // 点积: 1*4 + 2*5 + 3*6 = 32
vec3 crossProd = cross(a, b);  // 叉积
float len = length(a);      // 长度: sqrt(1² + 2² + 3²)
vec3 normalized = normalize(a);  // 归一化: 方向相同，长度=1

// 访问分量
vec3 color = vec3(0.5, 0.8, 1.0);
float red = color.r;    // 或 color.x = 0.5
float green = color.g;  // 或 color.y = 0.8
float blue = color.b;   // 或 color.z = 1.0

// Swizzling（重组分量）
vec3 bgr = color.bgr;   // (1.0, 0.8, 0.5)
vec2 rg = color.rg;     // (0.5, 0.8)
```

#### 变量修饰符

```glsl
// uniform: 从 JavaScript 传入的常量（每个物体相同）
uniform vec3 uCameraPos;    // 相机位置
uniform float uTime;        // 时间

// attribute: 每个顶点不同的数据（仅在顶点着色器）
attribute vec3 position;    // 顶点位置
attribute vec3 normal;      // 顶点法向量

// varying: 从顶点着色器传递到片段着色器
varying vec3 vNormal;       // 插值后的法向量
varying vec3 vPosition;     // 插值后的位置

// const: 编译时常量
const float PI = 3.14159265359;
```

**数据流向：**

```
JavaScript                  GPU
    ↓                        ↓
uniforms   ────────→   顶点着色器
attributes ────────→      │
                         │ varying
                         ↓
                    片段着色器 ────→ 屏幕
```

#### 常用函数

```glsl
// 数学函数
sin(x), cos(x), tan(x)      // 三角函数
pow(x, y)                    // x 的 y 次方
exp(x), log(x)              // 指数、对数
sqrt(x)                      // 平方根
abs(x), sign(x)             // 绝对值、符号
floor(x), ceil(x)           // 向下、向上取整
fract(x)                     // 小数部分
min(a, b), max(a, b)        // 最小、最大值
clamp(x, min, max)          // 限制在范围内

// 插值函数
mix(a, b, t)                 // 线性插值: a + (b - a) * t
smoothstep(edge0, edge1, x)  // 平滑插值

// 向量函数
dot(a, b)         // 点积
cross(a, b)       // 叉积
length(v)         // 长度
distance(a, b)    // 距离
normalize(v)      // 归一化
reflect(I, N)     // 反射
refract(I, N, eta) // 折射
```

#### 内置变量

```glsl
// 顶点着色器
gl_Position    // 输出：顶点的屏幕坐标（必须设置）

// 片段着色器
gl_FragColor   // 输出：像素颜色（必须设置）
gl_FragCoord   // 输入：像素的屏幕坐标
```

### 4.3 物理模拟

#### 浮力模拟

气泡向上运动遵循以下规律：

```
浮力 - 阻力 = 加速度
      ↓
速度逐渐接近终端速度（匀速上升）
```

**代码实现：**

```javascript
// 终端速度（与气泡大小相关）
const terminalVelocity = k * Math.sqrt(config.size) * 0.04;

// 每帧更新速度（阻尼系数 = 0.03）
p.verticalVelocity += (terminalVelocity - p.verticalVelocity) * 0.03;

// 更新位置
mesh.position.y += p.verticalVelocity * deltaTime * 300;
```

**速度曲线：**

```
速度
↑
│    ┌─────────────  终端速度
│   ╱
│  ╱
│ ╱
│╱
└────────────────→ 时间
  加速阶段  匀速阶段
```

#### 摇摆运动

使用正弦波产生周期性摇摆：

```javascript
// 相位随时间增加
p.swayPhase += p.swayFrequency * deltaTime * Math.PI * 10;

// 计算偏移（正弦波）
let swayOffset = Math.sin(p.swayPhase) * p.swayAmplitude;

// 应用到位置
mesh.position.x = p.baseX + swayOffset;
```

**正弦波可视化：**

```
位置偏移
  ↑
  │   ╱╲      ╱╲      ╱╲
  │  ╱  ╲    ╱  ╲    ╱  ╲
  │ ╱    ╲  ╱    ╲  ╱    ╲
  │╱      ╲╱      ╲╱      ╲
──┼──────────────────────────→ 时间
  │
  ↓

swayAmplitude: 波幅（摇摆范围）
swayFrequency: 频率（摇摆速度）
```

#### 噪声函数

Simplex Noise 用于产生自然的随机运动。

```javascript
const turbulenceX =
  simplex.noise3d(
    mesh.position.x * 0.1, // 空间频率
    currentTime * 0.0002, // 时间频率
    p.noiseOffset // 随机种子（每个气泡不同）
  ) * 0.01; // 缩放到小幅度

mesh.position.x += turbulenceX;
```

**噪声 vs 随机：**

```
Random:               Simplex Noise:
  *   *  *              ~~~~~
    *      *          ~       ~
*    *   *          ~           ~
                   连续、自然

Math.random()       simplex.noise3d()
离散、突变          平滑、连续
```

---

## 5. 完整代码解析

### 5.1 组件结构

```javascript
// RealisticBubble.js
export default function RealisticBubble({
  config,
  envMap,
  onBurst,
  initialPosition,
}) {
  // ========== 1. Refs 和状态 ==========
  const meshRef = useRef(); // 气泡网格
  const geometryRef = useRef(); // 几何体
  const materialRef = useRef(); // 材质
  const stateRef = useRef("floating"); // 状态（漂浮/破裂）
  const burstStartTimeRef = useRef(null); // 破裂开始时间

  const { camera } = useThree(); // 获取相机

  // ========== 2. 物理参数（useMemo 避免重复计算）==========
  const physics = useMemo(
    () => ({
      terminalVelocity: k * Math.sqrt(config.size) * 0.04, // 上升速度
      swayAmplitude: (0.5 + Math.random() * 1.5) * config.size * 0.6, // 摇摆幅度
      swayFrequency: 0.3 / config.size, // 摇摆频率
      // ... 其他参数
    }),
    [config.size, initialPosition]
  );

  // ========== 3. 初始化（useEffect）==========
  useEffect(() => {
    // 保存原始顶点位置（用于形变）
    if (geometryRef.current) {
      positionAttributeBase.current = geometryRef.current
        .getAttribute("position")
        .clone();
    }
  }, []);

  // ========== 4. 动画循环（useFrame）==========
  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // 处理破裂动画
    if (stateRef.current === "bursting") {
      // 收缩动画
      // ...
    }

    // 物理运动
    // 1. 向上漂浮
    // 2. X 轴摇摆
    // 3. Z 轴摇摆
    // 4. 湍流扰动
    // 5. 边界检测
    // 6. 顶点形变
    // ...
  });

  // ========== 5. 渲染 ==========
  return (
    <mesh ref={meshRef} position={initialPosition} onClick={handleBurst}>
      <sphereGeometry ref={geometryRef} args={[config.size, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={bubbleVertexShader}
        fragmentShader={bubbleFragmentShader}
        uniforms={{
          uCameraPos: { value: camera.position },
          envMap: { value: envMap },
        }}
        transparent={true}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
```

### 5.2 页面组件

```javascript
// RealisticBubblesPage.js
export default function RealisticBubblesPage() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <Canvas
        camera={{ fov: 60, position: [0, 0, 30] }}
        dpr={[1, 2]} // 支持高清屏
      >
        <Suspense fallback={null}>
          {" "}
          {/* 资源加载时显示 null */}
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}

function SceneContent() {
  const { scene } = useThree();
  const [bubbles, setBubbles] = useState([]);

  // 加载 HDR 环境贴图
  const envMap = useLoader(RGBELoader, "/radial_ramp_01.hdr");

  useEffect(() => {
    // 设置环境
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = envMap;
    scene.background = new THREE.Color(0x000000);
  }, [envMap, scene]);

  // 初始化气泡
  useEffect(() => {
    const initialBubbles = bubblesConfig.map((config, index) => ({
      id: index,
      config,
      initialPosition: generateScatteredPosition(),
    }));
    setBubbles(initialBubbles);
  }, []);

  return (
    <>
      {bubbles.map((bubble) => (
        <RealisticBubble
          key={bubble.id}
          config={bubble.config}
          envMap={envMap}
          onBurst={handleBubbleBurst}
          initialPosition={bubble.initialPosition}
        />
      ))}
    </>
  );
}
```

### 5.3 核心参数配置

```javascript
const bubblesConfig = [
  {
    size: 1.3, // 球体半径
    scale: [1.0, 1.0, 1.0], // XYZ 缩放
    speed: 18, // 形变速度
    spikes: 0.65, // 形变频率（表面波动密度）
    processing: 2.6, // 形变幅度
    offset: 0, // 时间偏移（每个气泡不同相位）
    isPerfectSphere: false, // 是否完美球体（不形变）
  },
  // ... 更多配置
];
```

**参数效果：**

```
size: 越大 → 气泡越大
spikes: 越大 → 表面波动越密集
processing: 越大 → 表面波动越明显
speed: 越大 → 形变动画越快

isPerfectSphere: true
    ●        (完美球体)
  /   \
 |  o  |
  \   /
    ●

isPerfectSphere: false
    ◐        (有形变)
  /   \
 |  ∿  |
  \   /
    ◑
```

---

## 6. 学习建议

### 6.1 循序渐进的学习路径

#### 阶段 1: Three.js 基础 (1-2 周)

1. **Hello World**：创建场景、相机、渲染器
2. **基础几何体**：立方体、球体、圆柱
3. **材质**：MeshBasicMaterial, MeshStandardMaterial
4. **光照**：环境光、点光源、聚光灯
5. **动画**：旋转、移动、缩放
6. **相机控制**：OrbitControls

**推荐练习：**

- 创建太阳系（太阳 + 行星绕转）
- 3D 立方体堆叠
- 带光照的场景

#### 阶段 2: React Three Fiber (1 周)

1. **Canvas 组件**：理解 R3F 渲染流程
2. **Hooks**：useFrame, useThree, useLoader
3. **声明式语法**：JSX 写 3D 对象
4. **状态管理**：React 状态与 3D 对象交互

**推荐练习：**

- 重写阶段 1 的练习（用 R3F）
- 可点击的 3D 按钮
- 动态添加/删除物体

#### 阶段 3: 着色器入门 (2-3 周)

1. **GLSL 基础**：语法、数据类型
2. **顶点着色器**：修改顶点位置
3. **片段着色器**：计算像素颜色
4. **Uniforms**：传递参数给着色器
5. **噪声函数**：创建自然效果

**推荐练习：**

- 渐变色球体
- 波浪动画（顶点位移）
- 简单的薄膜效果

#### 阶段 4: 高级效果 (2-3 周)

1. **环境映射**：反射和折射
2. **HDR 贴图**：加载和使用
3. **物理模拟**：运动、碰撞
4. **后期处理**：辉光、景深

**推荐练习：**

- 金属反射球
- 玻璃折射
- 简化版气泡

#### 阶段 5: 真实气泡 (1-2 周)

1. **分析本教程代码**
2. **逐步实现**：形状 → 着色器 → 动画
3. **调整参数**：理解每个参数的作用
4. **添加功能**：新的动画、交互

### 6.2 学习资源

#### 官方文档

- **Three.js 文档**：https://threejs.org/docs/
- **Three.js 示例**：https://threejs.org/examples/
- **R3F 文档**：https://docs.pmnd.rs/react-three-fiber/

#### 教程网站

- **Three.js Journey**：https://threejs-journey.com/ (付费，但很优质)
- **The Book of Shaders**：https://thebookofshaders.com/ (着色器入门)
- **Shadertoy**：https://www.shadertoy.com/ (着色器示例)

#### YouTube 频道

- **Bruno Simon** (Three.js Journey 作者)
- **The Coding Train** (创意编程)
- **SimonDev** (游戏开发)

### 6.3 实践建议

#### 1. 从简单开始

不要直接尝试复制气泡效果，先从基础几何体开始。

```javascript
// 第一步：静态球体
<mesh>
  <sphereGeometry args={[1, 32, 32]} />
  <meshBasicMaterial color="cyan" transparent opacity={0.5} />
</mesh>;

// 第二步：旋转动画
useFrame(() => {
  meshRef.current.rotation.y += 0.01;
});

// 第三步：上下运动
useFrame(({ clock }) => {
  meshRef.current.position.y = Math.sin(clock.elapsedTime) * 2;
});

// 第四步：简单着色器
// ... 逐步添加复杂度
```

#### 2. 修改参数理解原理

复制气泡代码后，尝试修改参数观察变化：

```javascript
// 尝试修改这些值，看看会发生什么
config.size = 2.0; // 改变大小
config.spikes = 1.5; // 增加形变密度
config.processing = 5.0; // 增加形变幅度
fresnel = pow(1.0 - NdotV, 3.0); // 改变边缘亮度
```

#### 3. 使用调试工具

- **Three.js Inspector**：Chrome 扩展，查看场景结构
- **Stats.js**：显示 FPS
- **dat.GUI**：实时调整参数

```javascript
import { useControls } from 'leva';  // 参数调试工具

function BubbleWithControls() {
  const { size, spikes } = useControls({
    size: { value: 1.3, min: 0.5, max: 3, step: 0.1 },
    spikes: { value: 0.65, min: 0, max: 2, step: 0.05 }
  });

  return <RealisticBubble config={{ size, spikes, ... }} />;
}
```

#### 4. 阅读和理解错误

Three.js/着色器错误信息很有用：

```
WebGL: INVALID_OPERATION: uniform1f: location not for current program
→ 检查 uniform 名称是否匹配

Cannot read property 'current' of null
→ ref 还未初始化，添加空值检查
```

### 6.4 常见问题

#### Q1: 气泡不显示或是黑色？

**检查清单：**

- ✅ 相机位置是否正确？`camera.position.z > 0`
- ✅ 材质是否透明？`transparent: true`
- ✅ HDR 是否加载成功？检查路径
- ✅ 着色器有错误吗？查看控制台

#### Q2: 动画卡顿？

**优化方法：**

- 降低几何体分段数：`64 → 32`
- 减少气泡数量
- 检查 `useFrame` 中的性能瓶颈
- 使用 `useMemo` 缓存计算结果

#### Q3: 着色器不工作？

**调试步骤：**

1. 打开浏览器控制台，查看 WebGL 错误
2. 简化着色器，逐步添加功能
3. 使用 `gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);` 测试是否显示红色
4. 检查 uniform 是否正确传递

### 6.5 扩展挑战

掌握气泡效果后，可以尝试：

1. **添加新物理效果**

   - 风力影响
   - 气泡碰撞
   - 重力方向变化

2. **改进视觉效果**

   - 更真实的薄膜厚度变化
   - 添加高光
   - 折射色散（彩虹边缘）

3. **交互增强**

   - 鼠标吹气泡
   - 拖动气泡
   - 气泡合并

4. **性能优化**
   - 使用 InstancedMesh（多个气泡）
   - LOD（距离级别细节）
   - 减少着色器计算

---

## 总结

### 核心知识点回顾

```
Three.js 基础
├── 场景、相机、渲染器（三要素）
├── 几何体、材质、网格
└── 坐标系统和变换

React Three Fiber
├── Canvas 组件（自动化设置）
├── useFrame（动画循环）
└── useThree（访问 Three.js 对象）

真实气泡实现
├── 形状：球体 + 顶点形变
├── 视觉：着色器
│   ├── 菲涅耳效应（边缘亮）
│   ├── 薄膜干涉（彩虹色）
│   ├── 环境映射（反射）
│   ├── 折射（透明）
│   └── 透明度控制
├── 动画：物理模拟
│   ├── 向上漂浮
│   ├── 摇摆运动
│   └── 湍流扰动
└── 交互：点击破裂

关键技术
├── HDR 环境贴图（真实光照）
├── GLSL 着色器（GPU 编程）
└── 物理模拟（自然运动）
```

### 学习路径

```
1. Three.js 基础 (2 周)
   ↓
2. React Three Fiber (1 周)
   ↓
3. 着色器入门 (3 周)
   ↓
4. 高级效果 (3 周)
   ↓
5. 真实气泡 (2 周)

总计：约 11 周（每天 1-2 小时）
```

### 下一步

1. **实践第一个 Three.js 项目**（旋转的立方体）
2. **阅读 Three.js 官方示例**（理解代码结构）
3. **跟随 Three.js Journey 教程**（系统学习）
4. **研究本教程的气泡代码**（逐行理解）
5. **创建自己的气泡变体**（调整参数和效果）

记住：**3D 编程是通过实践学习的**。不要害怕尝试和犯错，每次错误都是学习的机会！

---

## 附录：快速参考

### Three.js 常用 API

```javascript
// 场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.add(object);

// 相机
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(x, y, z);
camera.lookAt(target);

// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.render(scene, camera);

// 几何体
new THREE.SphereGeometry(radius, widthSegments, heightSegments);
new THREE.BoxGeometry(width, height, depth);
new THREE.PlaneGeometry(width, height);

// 材质
new THREE.MeshBasicMaterial({ color, transparent, opacity });
new THREE.MeshStandardMaterial({ color, roughness, metalness });
new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });

// 网格
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(x, y, z);
mesh.rotation.set(x, y, z);
mesh.scale.set(x, y, z);
```

### GLSL 常用函数

```glsl
// 数学
sin(x), cos(x), tan(x)
pow(x, y), sqrt(x)
abs(x), sign(x)
floor(x), ceil(x), fract(x)
min(x, y), max(x, y), clamp(x, min, max)

// 插值
mix(a, b, t)              // 线性插值
smoothstep(e0, e1, x)     // 平滑插值

// 向量
dot(a, b)                 // 点积
cross(a, b)               // 叉积
length(v)                 // 长度
normalize(v)              // 归一化
reflect(I, N)             // 反射
refract(I, N, eta)        // 折射
```

### React Three Fiber Hooks

```javascript
// 动画循环
useFrame((state, delta) => {
  // state.clock: 时钟
  // state.camera: 相机
  // delta: 帧时间
});

// 访问 Three.js 对象
const { scene, camera, gl } = useThree();

// 加载资源
const texture = useLoader(TextureLoader, "/path/to/image.jpg");
const envMap = useLoader(RGBELoader, "/path/to/hdr.hdr");
```

---

**祝你学习愉快！如果有任何问题，欢迎查阅文档或在社区提问。** 🎈✨
