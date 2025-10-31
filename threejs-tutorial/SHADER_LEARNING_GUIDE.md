# 着色器学习实战指南

> 通过 19 个动手实验，从零掌握 GLSL 着色器编程

## 📚 开始之前

**你需要：**

1. 打开 `http://localhost:62388`（你的教程页面）
2. 打开浏览器开发者工具（F12 或 Cmd+Option+I）
3. 准备一个笔记本记录实验结果

**学习方法：**

- 每次只做一个实验
- 修改代码后刷新页面（Cmd+R）看效果
- 把代码改回原样后再进行下一个实验
- 不理解就重复实验，直到明白为止

---

## 🎯 阶段 1：理解数据流动（5 个实验）

### 实验 1.1 - 观察法向量的 X 分量

**目标：** 理解如何单独访问向量的某个分量

**位置：** 找到 Step 10 的片段着色器代码（约在 index.html 的 1954 行）

**原始代码：**

```glsl
void main() {
  vec3 color = vNormal * 0.5 + 0.5;
  gl_FragColor = vec4(color, 1.0);
}
```

**修改为：**

```glsl
void main() {
  // 只显示法向量的 X 分量（左右方向）
  vec3 color = vec3(vNormal.x * 0.5 + 0.5, 0.0, 0.0);
  gl_FragColor = vec4(color, 1.0);
}
```

**预期效果：**

- 球体显示红色渐变
- 左侧（X 负值）= 暗红色
- 右侧（X 正值）= 亮红色
- 上下颜色相同

**理解要点：**

- `vNormal.x` 访问向量的第一个分量
- `vec3(r, g, b)` 创建颜色，这里只有红色通道有值
- `* 0.5 + 0.5` 将 -1~1 转换为 0~1（颜色范围）

**练习题：**

1. 为什么要 `* 0.5 + 0.5`？如果不加会怎样？
2. 改成 `vNormal.x` （不转换），观察效果

---

### 实验 1.2 - 观察法向量的 Y 分量

**修改为：**

```glsl
void main() {
  // 只显示法向量的 Y 分量（上下方向）
  vec3 color = vec3(0.0, vNormal.y * 0.5 + 0.5, 0.0);
  gl_FragColor = vec4(color, 1.0);
}
```

**预期效果：**

- 球体显示绿色渐变
- 下方（Y 负值）= 暗绿色
- 上方（Y 正值）= 亮绿色
- 左右颜色相同

**理解要点：**

- Y 轴是垂直方向
- 绿色通道在中间位置（RGB 的 G）
- 旋转球体，颜色分布不变（因为法向量是相对于球体的）

---

### 实验 1.3 - 观察法向量的 Z 分量

**修改为：**

```glsl
void main() {
  // 只显示法向量的 Z 分量（前后方向）
  vec3 color = vec3(0.0, 0.0, vNormal.z * 0.5 + 0.5);
  gl_FragColor = vec4(color, 1.0);
}
```

**预期效果：**

- 球体显示蓝色渐变
- 后方（Z 负值）= 暗蓝色
- 前方（Z 正值）= 亮蓝色（面向你的一面最亮）

**理解要点：**

- Z 轴是深度方向（垂直屏幕）
- 面向相机的一面 Z 值最大
- 这就是为什么默认显示"彩色球"时，前方最亮

---

### 实验 1.4 - 只显示一半的法向量

**目标：** 理解 GLSL 的数学函数

**修改为：**

```glsl
void main() {
  // 使用 max 函数，只保留正值
  vec3 color = max(vNormal, 0.0);
  gl_FragColor = vec4(color, 1.0);
}
```

**预期效果：**

- 球体一半彩色，一半黑色
- 正值法向量 = 彩色
- 负值法向量 = 黑色（被 max 限制为 0）

**理解要点：**

- `max(a, b)` 返回两者中的较大值
- `max(vNormal, 0.0)` 相当于：
  - 如果 vNormal > 0，返回 vNormal
  - 如果 vNormal < 0，返回 0（黑色）

**练习题：**

1. 改成 `min(vNormal, 0.0)`，会怎样？
2. 改成 `abs(vNormal)`（绝对值），会怎样？

---

### 实验 1.5 - 反转颜色

**目标：** 理解颜色运算

**修改为：**

```glsl
void main() {
  // 反转颜色：用 1.0 减去原颜色
  vec3 color = 1.0 - (vNormal * 0.5 + 0.5);
  gl_FragColor = vec4(color, 1.0);
}
```

**预期效果：**

- 颜色完全反转（像底片）
- 原来红色的地方变青色
- 原来绿色的地方变品红
- 原来蓝色的地方变黄色

**理解要点：**

- `1.0 - color` 是颜色反转公式
- RGB 颜色空间中，互补色相加 = 白色
- 红色 (1,0,0) 反转 → 青色 (0,1,1)

---

## 🔄 阶段 2：理解 varying 插值（3 个实验）

### 实验 2.1 - 传递顶点位置

**目标：** 理解如何传递自定义数据

**位置：** 继续在 Step 10

**修改顶点着色器：**

```glsl
varying vec3 vNormal;
varying vec3 vPosition;  // 新增：声明要传递的位置

void main() {
  vNormal = normal;
  vPosition = position;  // 新增：传递顶点位置
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

**修改片段着色器：**

```glsl
varying vec3 vNormal;
varying vec3 vPosition;  // 新增：接收位置数据

void main() {
  // 使用位置创建渐变
  vec3 color = vPosition * 0.5 + 0.5;
  gl_FragColor = vec4(color, 1.0);
}
```

**预期效果：**

- 类似法向量的效果，但略有不同
- position 是顶点在空间中的坐标
- normal 是垂直于表面的方向

**理解要点：**

- `varying` 变量必须在顶点和片段着色器都声明
- 变量名必须完全一致
- GPU 会自动在顶点之间插值

---

### 实验 2.2 - 观察插值效果

**目标：** 看到 GPU 的"平滑魔法"

**修改 JavaScript 代码：**

找到 Step 10 的这一行（约 1931 行）：

```javascript
const geometry = new THREE.SphereGeometry(1, 32, 32);
```

改成：

```javascript
const geometry = new THREE.SphereGeometry(1, 8, 8); // 减少分段数
```

**预期效果：**

- 球体变得"多边形化"
- 但颜色仍然平滑过渡
- 这就是 varying 插值的效果

**理解要点：**

- 顶点着色器只在顶点处运行
- 片段着色器在每个像素运行
- 顶点之间的值由 GPU 自动插值

**实验对比：**

1. 32 段 = 很多顶点 = 圆滑球体
2. 8 段 = 少量顶点 = 多边形球体
3. 但颜色都平滑（因为插值）

---

### 实验 2.3 - 同时传递多个数据

**目标：** 混合使用多个 varying 变量

**片段着色器修改为：**

```glsl
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // 混合法向量和位置信息
  vec3 normalColor = vNormal * 0.5 + 0.5;
  vec3 positionColor = vPosition * 0.5 + 0.5;

  // 50% 混合
  vec3 color = mix(normalColor, positionColor, 0.5);

  gl_FragColor = vec4(color, 1.0);
}
```

**预期效果：**

- 颜色介于法向量和位置之间
- `mix(a, b, 0.5)` 表示 50% a + 50% b

**练习题：**

1. 改成 `mix(normalColor, positionColor, 0.0)`，看到什么？
2. 改成 `mix(normalColor, positionColor, 1.0)`，看到什么？
3. 改成 `mix(normalColor, positionColor, 0.8)`，看到什么？

---

## 🎛️ 阶段 3：理解 uniform 变量（3 个实验）

### 实验 3.1 - 添加颜色控制

**目标：** 从 JavaScript 传递参数到着色器

**位置：** Step 10

**修改片段着色器：**

```glsl
uniform vec3 uColor;  // 新增：从 JavaScript 接收的颜色
varying vec3 vNormal;

void main() {
  // 使用传入的颜色
  gl_FragColor = vec4(uColor, 1.0);
}
```

**修改 JavaScript（约 1934 行）：**

```javascript
const material = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    uColor: { value: new THREE.Color(0xff0000) }, // 新增：传递红色
  },
});
```

**预期效果：**

- 整个球体变成纯红色
- 改变颜色值 `0xff0000` 试试其他颜色

**理解要点：**

- `uniform` 在所有顶点和像素中值相同
- 可以从 JavaScript 动态改变
- 常用于传递：颜色、时间、光源位置等

---

### 实验 3.2 - 添加时间动画

**目标：** 创建动态着色器效果

**修改片段着色器：**

```glsl
uniform float uTime;  // 新增：时间
varying vec3 vNormal;

void main() {
  // 使用时间创建动画
  vec3 color = vNormal * 0.5 + 0.5;
  color *= (sin(uTime) * 0.5 + 0.5);  // 颜色随时间变化

  gl_FragColor = vec4(color, 1.0);
}
```

**修改 JavaScript：**

```javascript
const material = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    uTime: { value: 0 }, // 新增：初始时间为 0
  },
});

// 在 animate 函数中更新时间
function animate() {
  requestAnimationFrame(animate);

  // 更新时间
  material.uniforms.uTime.value = performance.now() * 0.001; // 转换为秒

  sphere.rotation.y += 0.01;
  renderer.render(scene, camera);
}
```

**预期效果：**

- 球体颜色会呼吸式变化
- sin(time) 产生 -1 到 1 的周期性变化
- 调整 `0.001` 可以改变速度

---

### 实验 3.3 - 混合 uniform 和 varying

**目标：** 组合使用不同类型的变量

**修改片段着色器：**

```glsl
uniform float uTime;
varying vec3 vNormal;

void main() {
  // 基础颜色基于法向量
  vec3 baseColor = vNormal * 0.5 + 0.5;

  // 使用时间创建波纹效果
  float wave = sin(uTime + vNormal.y * 10.0) * 0.5 + 0.5;

  // 组合效果
  vec3 color = baseColor * wave;

  gl_FragColor = vec4(color, 1.0);
}
```

**预期效果：**

- 球体上出现上下移动的波纹
- `vNormal.y * 10.0` 创建多个波纹
- 波纹随时间向上移动

**练习题：**

1. 改成 `vNormal.x * 10.0`，波纹方向如何变化？
2. 改变 `10.0` 的值，观察波纹密度变化
3. 改成 `sin(uTime * 2.0 + ...)`，观察速度变化

---

## 📐 阶段 4：理解数学函数（5 个实验）

### 实验 4.1 - dot 点积

**目标：** 理解向量点积在光照中的应用

**位置：** 切换到 Step 11（菲涅耳效应）

**分析现有代码：**

```glsl
vec3 viewDirection = normalize(uCameraPos - vPosition);
float NdotV = dot(normalize(vNormal), viewDirection);
float fresnel = 1.0 - NdotV;
```

**理解点积：**

- `dot(a, b)` = a.x*b.x + a.y*b.y + a.z\*b.z
- 当两个单位向量：
  - 平行同向 → dot = 1
  - 垂直 → dot = 0
  - 平行反向 → dot = -1

**实验修改：**

```glsl
void main() {
  vec3 viewDirection = normalize(uCameraPos - vPosition);
  float NdotV = dot(normalize(vNormal), viewDirection);

  // 可视化点积值
  vec3 color = vec3(NdotV);  // 直接显示点积

  gl_FragColor = vec4(color, 1.0);
}
```

**预期效果：**

- 面向你的一面最亮（dot = 1）
- 侧面暗（dot 接近 0）
- 这就是基础光照的原理

---

### 实验 4.2 - pow 指数函数

**目标：** 理解如何调整效果强度

**位置：** Step 12

**修改片段着色器：**

```glsl
float NdotV = dot(normalize(vNormal), viewDirection);

// 尝试不同的指数
float fresnel1 = pow(1.0 - NdotV, 1.0);  // 线性
float fresnel2 = pow(1.0 - NdotV, 2.0);  // 二次方
float fresnel3 = pow(1.0 - NdotV, 3.0);  // 三次方
float fresnel5 = pow(1.0 - NdotV, 5.0);  // 五次方

// 显示其中一个
vec3 glowColor = vec3(0.0, 0.8, 1.0);
vec3 finalColor = glowColor * fresnel2;  // 改变这里试试不同的
```

**理解 pow()：**

- `pow(x, 1)` = x（无变化）
- `pow(x, 2)` = x\*x（变化加剧）
- `pow(x, 3)` = x*x*x（变化更剧烈）
- 指数越大，亮部越集中在边缘

---

### 实验 4.3 - mix 混合函数

**目标：** 理解颜色混合

**在 Step 10 实验：**

```glsl
void main() {
  vec3 colorA = vec3(1.0, 0.0, 0.0);  // 红色
  vec3 colorB = vec3(0.0, 0.0, 1.0);  // 蓝色

  // 使用法向量 Y 分量作为混合因子
  float mixFactor = vNormal.y * 0.5 + 0.5;  // 0 到 1

  vec3 color = mix(colorA, colorB, mixFactor);
  // mixFactor = 0 → 红色
  // mixFactor = 0.5 → 紫色（混合）
  // mixFactor = 1 → 蓝色

  gl_FragColor = vec4(color, 1.0);
}
```

**预期效果：**

- 下方红色，上方蓝色
- 中间平滑过渡为紫色

---

### 实验 4.4 - smoothstep 平滑过渡

**目标：** 对比 mix 和 smoothstep

**修改为：**

```glsl
void main() {
  float value = vNormal.y * 0.5 + 0.5;

  // 对比三种过渡
  float linear = value;
  float smooth = smoothstep(0.0, 1.0, value);
  float verySmooth = smoothstep(0.2, 0.8, value);

  // 显示其中一个
  vec3 color = vec3(smooth);

  gl_FragColor = vec4(color, 1.0);
}
```

**理解差异：**

- `linear`: 均匀渐变
- `smoothstep(0, 1, x)`: S 型曲线，两端平缓
- `smoothstep(0.2, 0.8, x)`: 更陡的过渡

---

### 实验 4.5 - 组合多个函数

**目标：** 创造复杂效果

**综合应用：**

```glsl
uniform float uTime;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // 1. 基础菲涅耳
  vec3 viewDirection = normalize(vec3(0, 0, 5) - vPosition);
  float NdotV = dot(normalize(vNormal), viewDirection);
  float fresnel = pow(1.0 - NdotV, 2.0);

  // 2. 波纹效果
  float wave = sin(uTime + vPosition.y * 5.0) * 0.5 + 0.5;

  // 3. 颜色渐变
  vec3 colorA = vec3(1.0, 0.2, 0.5);
  vec3 colorB = vec3(0.2, 0.5, 1.0);
  vec3 gradientColor = mix(colorA, colorB, wave);

  // 4. 组合所有效果
  vec3 finalColor = gradientColor * smoothstep(0.3, 0.7, fresnel);

  gl_FragColor = vec4(finalColor, 1.0);
}
```

---

## 🌈 阶段 5：理解复杂效果（3 个实验）

### 实验 5.1 - 分析薄膜干涉

**位置：** Step 13

**分析 getThinFilmColor 函数：**

```glsl
vec3 getThinFilmColor(float cosTheta, float thickness) {
  const float PI = 3.14159265359;

  // 光程差 = 折射率 × 厚度 × 角度
  float opticalPath = 2.0 * 1.33 * thickness * cosTheta;

  // 红绿蓝三种波长的相位
  float phaseR = (2.0 * PI * opticalPath) / 650.0;  // 红光波长
  float phaseG = (2.0 * PI * opticalPath) / 550.0;  // 绿光波长
  float phaseB = (2.0 * PI * opticalPath) / 450.0;  // 蓝光波长

  // 干涉强度（余弦波）
  float intensityR = 0.5 + 0.5 * cos(phaseR);
  float intensityG = 0.5 + 0.5 * cos(phaseG);
  float intensityB = 0.5 + 0.5 * cos(phaseB);

  return vec3(intensityR, intensityG, intensityB);
}
```

**实验修改波长：**

```glsl
// 改变波长看效果
float phaseR = (2.0 * PI * opticalPath) / 700.0;  // 增加红光波长
float phaseG = (2.0 * PI * opticalPath) / 550.0;
float phaseB = (2.0 * PI * opticalPath) / 400.0;  // 减少蓝光波长
```

**理解原理：**

- 不同波长的光干涉程度不同
- 产生彩虹色
- 厚度变化 → 颜色变化

---

### 实验 5.2 - 分析环境映射

**位置：** Step 14

**核心代码分析：**

```glsl
// 计算反射向量
vec3 reflected = reflect(-viewDirection, normal);

// 从环境贴图采样
vec3 envColor = textureCube(envMap, reflected).rgb;
```

**理解 reflect()：**

- 输入：入射向量、法向量
- 输出：反射向量
- 用反射向量从环境贴图取颜色

**实验修改：**

```glsl
// 改变反射强度
float fresnel = pow(1.0 - NdotV, 2.0);
vec3 baseColor = vec3(0.1, 0.6, 1.0);

// 尝试不同的混合比例
vec3 finalColor = mix(baseColor, envColor, fresnel * 0.5);  // 改变 0.5
```

---

### 实验 5.3 - 创建自己的效果

**挑战：创建"电浆球"效果**

```glsl
uniform float uTime;
uniform vec3 uCameraPos;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 viewDirection = normalize(uCameraPos - vPosition);
  float NdotV = dot(normalize(vNormal), viewDirection);

  // 多层波纹
  float wave1 = sin(uTime * 2.0 + vPosition.y * 10.0);
  float wave2 = cos(uTime * 1.5 + vPosition.x * 8.0);
  float wave3 = sin(uTime + vPosition.z * 6.0);

  float combined = (wave1 + wave2 + wave3) * 0.33;

  // 颜色映射
  vec3 color1 = vec3(1.0, 0.0, 1.0);  // 品红
  vec3 color2 = vec3(0.0, 1.0, 1.0);  // 青色
  vec3 color3 = vec3(1.0, 1.0, 0.0);  // 黄色

  vec3 baseColor = mix(color1, color2, combined * 0.5 + 0.5);
  baseColor = mix(baseColor, color3, wave1 * 0.3 + 0.5);

  // 边缘发光
  float glow = pow(1.0 - NdotV, 3.0);
  vec3 finalColor = baseColor * (0.5 + glow * 2.0);

  gl_FragColor = vec4(finalColor, 1.0);
}
```

---

## 🐛 调试技巧

### 技巧 1：纯色测试

```glsl
void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);  // 纯红色
  return;  // 如果看到红色，说明着色器在运行
}
```

### 技巧 2：可视化数值

```glsl
// 想看某个变量的值？把它映射到颜色
float myValue = someCalculation();
gl_FragColor = vec4(vec3(myValue), 1.0);  // 灰度显示
```

### 技巧 3：分段调试

```glsl
// 注释掉部分代码，逐步启用
vec3 color = vec3(1.0);
// color *= fresnel;  // 先注释
// color *= wave;     // 先注释
```

### 技巧 4：使用 clamp

```glsl
// 防止颜色超出范围
vec3 color = clamp(myColor, 0.0, 1.0);
```

---

## 📝 常见错误及解决

### 错误 1：忘记 `.0`

```glsl
❌ float x = 1;        // 错误！
✅ float x = 1.0;      // 正确

❌ vec3 color = vec3(0, 0, 0);
✅ vec3 color = vec3(0.0, 0.0, 0.0);
```

### 错误 2：varying 变量不匹配

```glsl
// 顶点着色器
varying vec3 vNormal;

// 片段着色器
varying vec3 vNormals;  // ❌ 名字不一致！
```

### 错误 3：uniform 未传递

```javascript
// JavaScript 中必须传递 uniform
uniforms: {
  uColor: {
    value: new THREE.Color(0xff0000);
  }
}
```

### 错误 4：颜色范围错误

```glsl
❌ vec3 color = vNormal;  // -1 到 1，会显示异常
✅ vec3 color = vNormal * 0.5 + 0.5;  // 0 到 1
```

---

## ✅ 学习检查清单

完成每个阶段后，确认你能回答这些问题：

### 阶段 1 检查

- [ ] 什么是 varying 变量？
- [ ] 如何访问向量的单个分量？
- [ ] 为什么颜色范围是 0-1？
- [ ] `max()` 和 `min()` 函数如何工作？

### 阶段 2 检查

- [ ] varying 变量如何在着色器间传递？
- [ ] GPU 如何插值顶点数据？
- [ ] position 和 normal 的区别？
- [ ] 顶点数量如何影响效果？

### 阶段 3 检查

- [ ] uniform 和 varying 的区别？
- [ ] 如何从 JavaScript 传递数据到着色器？
- [ ] 如何创建动画效果？
- [ ] 为什么要在 animate 函数中更新 uniform？

### 阶段 4 检查

- [ ] dot() 点积的几何意义？
- [ ] pow() 如何改变数值分布？
- [ ] mix() 和 smoothstep() 的区别？
- [ ] 如何组合多个数学函数？

### 阶段 5 检查

- [ ] 薄膜干涉的物理原理？
- [ ] reflect() 如何计算反射向量？
- [ ] 环境贴图如何采样？
- [ ] 如何组合多种效果？

---

## 🎓 下一步学习

完成所有实验后，你可以：

1. **阅读 The Book of Shaders**

   - https://thebookofshaders.com/
   - 更深入的着色器教程

2. **学习 Shadertoy**

   - https://www.shadertoy.com/
   - 看别人的着色器代码

3. **深入学习**

   - 光照模型（Phong、PBR）
   - 噪声函数（Perlin、Simplex）
   - 后期处理效果

4. **创建项目**
   - 制作自己的视觉效果
   - 将着色器应用到实际项目
   - 分享你的作品

---

## 💬 学习建议

1. **不要着急** - 每个实验都值得花时间理解
2. **做笔记** - 用自己的话解释每个概念
3. **多实验** - 改变参数，看看会发生什么
4. **问问题** - 不理解就重复做，直到明白
5. **享受过程** - 着色器编程很有趣！

---

**祝学习愉快！记住：最好的学习方式就是动手实践。** 🚀✨
