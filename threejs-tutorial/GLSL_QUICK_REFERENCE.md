# GLSL 快速参考卡片

> 做实验时随时查阅的速查手册

---

## 📦 数据类型

### 基础类型

```glsl
float x = 1.0;          // 浮点数（必须有 .0）
int count = 5;          // 整数
bool isTrue = true;     // 布尔值
```

### 向量类型

```glsl
vec2 pos = vec2(1.0, 2.0);              // 2D 向量 (x, y)
vec3 color = vec3(1.0, 0.5, 0.0);       // 3D 向量 (r, g, b)
vec4 rgba = vec4(1.0, 0.5, 0.0, 1.0);   // 4D 向量 (r, g, b, a)
```

### 矩阵类型

```glsl
mat3 transform3x3;      // 3x3 矩阵
mat4 transform4x4;      // 4x4 矩阵
```

---

## 🔧 向量操作

### 访问分量

```glsl
vec3 v = vec3(1.0, 2.0, 3.0);

// 方式 1：使用 xyz
float x = v.x;          // 1.0
float y = v.y;          // 2.0
float z = v.z;          // 3.0

// 方式 2：使用 rgb（颜色语义）
float r = v.r;          // 1.0
float g = v.g;          // 2.0
float b = v.b;          // 3.0

// 方式 3：使用 stp（纹理坐标语义）
float s = v.s;          // 1.0
float t = v.t;          // 2.0
float p = v.p;          // 3.0
```

### Swizzling（重组）

```glsl
vec3 v = vec3(1.0, 2.0, 3.0);

vec2 xy = v.xy;                 // vec2(1.0, 2.0)
vec2 yz = v.yz;                 // vec2(2.0, 3.0)
vec3 zyx = v.zyx;               // vec3(3.0, 2.0, 1.0) - 反转
vec3 xxx = v.xxx;               // vec3(1.0, 1.0, 1.0) - 重复
vec4 xyxy = v.xyxy;             // vec4(1.0, 2.0, 1.0, 2.0)
```

### 向量运算

```glsl
vec3 a = vec3(1.0, 2.0, 3.0);
vec3 b = vec3(4.0, 5.0, 6.0);

// 加减乘除（逐分量）
vec3 sum = a + b;               // vec3(5.0, 7.0, 9.0)
vec3 diff = a - b;              // vec3(-3.0, -3.0, -3.0)
vec3 prod = a * b;              // vec3(4.0, 10.0, 18.0)
vec3 quot = a / b;              // vec3(0.25, 0.4, 0.5)

// 标量运算
vec3 scaled = a * 2.0;          // vec3(2.0, 4.0, 6.0)
vec3 offset = a + 1.0;          // vec3(2.0, 3.0, 4.0)
```

---

## 🧮 数学函数

### 基础数学

| 函数                 | 说明            | 示例                           |
| -------------------- | --------------- | ------------------------------ |
| `abs(x)`             | 绝对值          | `abs(-1.5)` → `1.5`            |
| `sign(x)`            | 符号 (-1, 0, 1) | `sign(-5.0)` → `-1.0`          |
| `floor(x)`           | 向下取整        | `floor(1.7)` → `1.0`           |
| `ceil(x)`            | 向上取整        | `ceil(1.3)` → `2.0`            |
| `fract(x)`           | 小数部分        | `fract(2.7)` → `0.7`           |
| `mod(x, y)`          | 取模（余数）    | `mod(5.0, 2.0)` → `1.0`        |
| `min(x, y)`          | 最小值          | `min(3.0, 5.0)` → `3.0`        |
| `max(x, y)`          | 最大值          | `max(3.0, 5.0)` → `5.0`        |
| `clamp(x, min, max)` | 限制范围        | `clamp(1.5, 0.0, 1.0)` → `1.0` |

### 三角函数

| 函数         | 说明             | 值域        |
| ------------ | ---------------- | ----------- |
| `sin(x)`     | 正弦             | -1 到 1     |
| `cos(x)`     | 余弦             | -1 到 1     |
| `tan(x)`     | 正切             | -∞ 到 ∞     |
| `asin(x)`    | 反正弦           | -π/2 到 π/2 |
| `acos(x)`    | 反余弦           | 0 到 π      |
| `atan(y, x)` | 反正切（两参数） | -π 到 π     |

**常用技巧：**

```glsl
// 将 sin 从 [-1, 1] 映射到 [0, 1]
float wave = sin(time) * 0.5 + 0.5;

// 创建周期性动画
float pulse = sin(time * 2.0);        // 频率 = 2
```

### 指数和幂

| 函数             | 说明         | 示例                       |
| ---------------- | ------------ | -------------------------- |
| `pow(x, y)`      | x 的 y 次方  | `pow(2.0, 3.0)` → `8.0`    |
| `exp(x)`         | e^x          | `exp(1.0)` → `2.718`       |
| `exp2(x)`        | 2^x          | `exp2(3.0)` → `8.0`        |
| `log(x)`         | 自然对数     | `log(2.718)` → `1.0`       |
| `log2(x)`        | 以 2 为底    | `log2(8.0)` → `3.0`        |
| `sqrt(x)`        | 平方根       | `sqrt(9.0)` → `3.0`        |
| `inversesqrt(x)` | 1/√x（快速） | `inversesqrt(4.0)` → `0.5` |

---

## 🎨 向量函数

### 几何函数

| 函数             | 说明               | 用途            |
| ---------------- | ------------------ | --------------- |
| `length(v)`      | 向量长度           | 距离计算        |
| `distance(a, b)` | 两点距离           | `length(b - a)` |
| `dot(a, b)`      | 点积               | 光照、角度      |
| `cross(a, b)`    | 叉积（仅 vec3）    | 法向量计算      |
| `normalize(v)`   | 归一化（单位向量） | 方向计算        |

**点积详解：**

```glsl
float dotProduct = dot(a, b);

// 当 a、b 都是单位向量：
// dot = 1.0  → 平行同向
// dot = 0.0  → 垂直
// dot = -1.0 → 平行反向

// 光照应用
float NdotL = dot(normal, lightDir);  // 兰伯特光照
float NdotV = dot(normal, viewDir);   // 菲涅耳效果
```

### 反射和折射

| 函数                 | 说明     | 参数             |
| -------------------- | -------- | ---------------- |
| `reflect(I, N)`      | 反射向量 | I=入射, N=法向量 |
| `refract(I, N, eta)` | 折射向量 | eta=折射率比     |

```glsl
// 反射（镜面）
vec3 I = normalize(viewDirection);
vec3 N = normalize(normal);
vec3 R = reflect(I, N);

// 折射（玻璃、水）
float eta = 1.0 / 1.33;  // 空气/水
vec3 T = refract(I, N, eta);
```

---

## 🎭 插值函数

### mix（线性插值）

```glsl
mix(a, b, t)  // 返回 a*(1-t) + b*t

// t = 0.0 → 返回 a
// t = 0.5 → 返回 (a+b)/2
// t = 1.0 → 返回 b

// 示例：颜色渐变
vec3 red = vec3(1.0, 0.0, 0.0);
vec3 blue = vec3(0.0, 0.0, 1.0);
vec3 purple = mix(red, blue, 0.5);  // 紫色
```

### smoothstep（平滑插值）

```glsl
smoothstep(edge0, edge1, x)

// x <= edge0  → 返回 0.0
// x >= edge1  → 返回 1.0
// 中间部分   → S 型平滑过渡

// 示例：平滑边缘
float alpha = smoothstep(0.4, 0.6, distance);
// 距离 < 0.4 → 完全不透明
// 距离 > 0.6 → 完全透明
// 0.4-0.6 之间 → 平滑过渡
```

### step（阶梯函数）

```glsl
step(edge, x)

// x < edge  → 返回 0.0
// x >= edge → 返回 1.0

// 示例：创建硬边缘
float mask = step(0.5, uv.x);
// x < 0.5 → 黑色
// x >= 0.5 → 白色（无过渡）
```

---

## 🔀 变量修饰符

### Uniform（统一变量）

```glsl
uniform float uTime;           // 时间
uniform vec3 uColor;           // 颜色
uniform mat4 uModelMatrix;     // 模型矩阵
uniform sampler2D uTexture;    // 纹理

// 特点：
// - 从 JavaScript 传入
// - 所有顶点/像素值相同
// - 只读
// - 用于全局参数
```

### Varying（变化变量）

```glsl
// 顶点着色器中声明和赋值
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vNormal = normal;
  vPosition = position;
  // ...
}

// 片段着色器中接收（自动插值）
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // vNormal 已经在每个像素点插值
  // ...
}

// 特点：
// - 在顶点和片段着色器之间传递
// - GPU 自动插值
// - 用于传递顶点数据到像素
```

### Attribute（属性）

```glsl
attribute vec3 position;       // 顶点位置
attribute vec3 normal;         // 法向量
attribute vec2 uv;            // 纹理坐标

// 特点：
// - 只在顶点着色器可用
// - 每个顶点不同的值
// - 由几何体提供
```

---

## 📐 内置变量

### 顶点着色器

```glsl
// 输入（Three.js 自动提供）
attribute vec3 position;        // 顶点位置
attribute vec3 normal;          // 法向量
attribute vec2 uv;              // UV 坐标

uniform mat4 modelMatrix;       // 模型矩阵
uniform mat4 viewMatrix;        // 视图矩阵
uniform mat4 projectionMatrix;  // 投影矩阵
uniform mat4 modelViewMatrix;   // 模型视图矩阵（组合）

// 输出（必须设置）
gl_Position                     // 裁剪空间位置（vec4）
```

### 片段着色器

```glsl
// 输出（必须设置）
gl_FragColor                    // 像素颜色（vec4）

// 内置变量
gl_FragCoord                    // 屏幕空间坐标（vec4）
```

---

## 🎯 常用代码片段

### 1. 标准顶点着色器

```glsl
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vNormal = normal;
  vPosition = position;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### 2. 菲涅耳效应

```glsl
vec3 viewDirection = normalize(cameraPosition - vPosition);
float fresnel = 1.0 - dot(normalize(vNormal), viewDirection);
fresnel = pow(fresnel, 3.0);  // 调整强度
```

### 3. 颜色映射（-1~1 → 0~1）

```glsl
vec3 color = vNormal * 0.5 + 0.5;
```

### 4. 创建渐变

```glsl
// 水平渐变
float gradient = uv.x;

// 垂直渐变
float gradient = uv.y;

// 径向渐变
float gradient = length(uv - 0.5);

// 角度渐变
float gradient = atan(uv.y - 0.5, uv.x - 0.5);
```

### 5. 时间动画

```glsl
uniform float uTime;

// 周期性波动
float wave = sin(uTime * 2.0) * 0.5 + 0.5;

// 匀速增长
float progress = mod(uTime, 1.0);

// 脉冲
float pulse = abs(sin(uTime * 3.14159));
```

### 6. 平滑圆形

```glsl
float circle = length(uv - 0.5);
float alpha = 1.0 - smoothstep(0.3, 0.35, circle);
```

### 7. 噪声波纹

```glsl
float wave = sin(vPosition.y * 10.0 + uTime * 2.0) * 0.5 + 0.5;
vec3 color = baseColor * wave;
```

---

## 🐛 调试技巧

### 可视化变量

```glsl
// 1. 浮点数 → 灰度
float value = someCalculation();
gl_FragColor = vec4(vec3(value), 1.0);

// 2. 向量 → 颜色
vec3 vector = someVector;
gl_FragColor = vec4(vector * 0.5 + 0.5, 1.0);

// 3. 检查范围
vec3 color = clamp(myColor, 0.0, 1.0);  // 确保在 0-1 之间
```

### 分段测试

```glsl
// 纯色测试：确认着色器运行
gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);  // 红色
return;

// 逐步启用效果
vec3 color = baseColor;
// color *= effect1;  // 先注释
// color *= effect2;  // 先注释
```

---

## ⚠️ 常见陷阱

### 1. 忘记 .0

```glsl
❌ float x = 1;
✅ float x = 1.0;

❌ vec3 color = vec3(0, 0, 0);
✅ vec3 color = vec3(0.0, 0.0, 0.0);
```

### 2. 类型不匹配

```glsl
❌ vec3 color = 0.5;
✅ vec3 color = vec3(0.5);

❌ float x = vec3(1.0, 2.0, 3.0);
✅ float x = vec3(1.0, 2.0, 3.0).x;
```

### 3. 未归一化的向量

```glsl
❌ float NdotV = dot(vNormal, viewDirection);
✅ float NdotV = dot(normalize(vNormal), normalize(viewDirection));
```

### 4. 颜色范围错误

```glsl
❌ vec3 color = vNormal;  // -1 到 1
✅ vec3 color = vNormal * 0.5 + 0.5;  // 0 到 1
```

### 5. varying 名称不匹配

```glsl
// 顶点着色器
varying vec3 vNormal;

// 片段着色器
❌ varying vec3 vNormals;  // 名称不一致！
✅ varying vec3 vNormal;   // 必须完全相同
```

---

## 📚 快速公式

### 颜色转换

```glsl
// -1~1 → 0~1
float normalized = value * 0.5 + 0.5;

// 0~1 → -1~1
float centered = value * 2.0 - 1.0;

// 0~255 → 0~1
float decimal = colorValue / 255.0;
```

### 距离和长度

```glsl
// 2D 距离
float dist = length(uv - center);

// 3D 距离
float dist = length(worldPos - targetPos);

// 欧几里得距离（手动）
float dist = sqrt(dx*dx + dy*dy);
```

### 角度和方向

```glsl
// 计算角度（弧度）
float angle = atan(y, x);  // -π 到 π

// 角度 → 0~1
float normalizedAngle = angle / (2.0 * 3.14159) + 0.5;

// 方向向量（归一化）
vec3 direction = normalize(target - origin);
```

---

## 🎓 性能提示

1. **避免条件分支** - GPU 不擅长 if/else

   ```glsl
   ❌ if (x > 0.5) color = red; else color = blue;
   ✅ color = mix(blue, red, step(0.5, x));
   ```

2. **预计算常量**

   ```glsl
   ❌ float x = sin(3.14159 * 0.5);  // 每次都计算
   ✅ const float x = 1.0;          // 预计算
   ```

3. **使用内置函数** - 硬件优化

   ```glsl
   ✅ length(v)
   ✅ normalize(v)
   ✅ dot(a, b)
   ```

4. **减少 varying 变量** - 节省带宽
   - 只传递必要的数据
   - 在片段着色器中计算派生值

---

**打印这页，放在桌上！** 📄✨
