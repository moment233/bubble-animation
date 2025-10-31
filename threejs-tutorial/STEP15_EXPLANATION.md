# Step 15 完整技术解析 🎈

## 核心问题：环境贴图格式不匹配

### 问题发现过程

1. **现象**：Step 15 球体变亮了，但 HDR 环境贴图没有显示
2. **对比**：Step 14 使用同样的 HDR，显示正常
3. **假设**：代码实现方式可能有差异
4. **验证**：详细比较 Step 14 和 Step 15 的代码

---

## WebGL 环境贴图的两种格式

### 格式 1：CubeMap（立方体贴图）

**结构**：6 个独立的 2D 纹理

- +X（右）、-X（左）
- +Y（上）、-Y（下）
- +Z（前）、-Z（后）

**GLSL 使用**：

```glsl
uniform samplerCube envMap;
vec3 color = textureCube(envMap, direction);
```

**特点**：

- ✅ 标准格式，兼容性好
- ✅ 直接采样，无需解码
- ❌ 占用内存较多（6 张纹理）
- ❌ 接缝可能有瑕疵

---

### 格式 2：CubeUV（立方体 UV 映射）

**结构**：1 个 2D 纹理，编码了 6 面信息

**GLSL 使用**：

```glsl
uniform sampler2D envMap;  // 注意：是 2D 而非 Cube
// 需要特殊的解码函数来采样
vec3 color = decodeCubeUV(envMap, direction, mipLevel);
```

**特点**：

- ✅ 优化内存（单张 2D 纹理）
- ✅ 预过滤 mipmaps（更好的性能）
- ✅ 无接缝问题
- ❌ 需要复杂的解码算法
- ❌ 只能在支持该算法的系统中使用

---

## Step 14 vs Step 15 的技术差异

### Step 14：MeshStandardMaterial + PMREMGenerator

```javascript
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.9,
  roughness: 0.2,
  envMapIntensity: 1.5,
});

// 使用 PMREMGenerator（输出 CubeUV）
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
const envMap = pmremGenerator.fromEquirectangular(texture).texture;

// 设置到场景环境（Three.js 自动处理）
scene.environment = envMap; // ✅ 内置材质知道如何解码 CubeUV
```

**为什么可以工作？**

- `MeshStandardMaterial` 是 Three.js 的内置材质
- Three.js 已经在材质的内部 Shader 中实现了 CubeUV 解码算法
- 我们只需要设置 `scene.environment`，其余全部自动处理

**内部 Shader（简化版）**：

```glsl
// Three.js 内部已经实现
uniform sampler2D envMap;  // 接收 CubeUV 格式

vec3 sampleCubeUV(vec3 direction) {
  // 复杂的解码算法（100+ 行代码）
  // 将 3D 方向映射到 2D UV 坐标
  // 考虑 mipmap 级别
  // ...
  return texture2D(envMap, uv).rgb;
}
```

---

### Step 15：ShaderMaterial + WebGLCubeRenderTarget

#### ❌ 错误的尝试（使用 PMREMGenerator）

```javascript
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const renderTarget = pmremGenerator.fromEquirectangular(texture);
material.uniforms.envMap.value = renderTarget.texture; // CubeUV 格式
```

```glsl
uniform samplerCube envMap;  // ← 期待 CubeMap
vec3 envColor = textureCube(envMap, reflected).rgb;  // ❌ 无法采样 CubeUV
```

**问题**：

- 传入的是 CubeUV 格式（2D 纹理）
- 但声明的是 `samplerCube`（期待 6 面立方体）
- `textureCube()` 无法正确采样 CubeUV
- 结果：贴图不显示

---

#### ✅ 正确的解决方案（使用 WebGLCubeRenderTarget）

```javascript
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
cubeRenderTarget.fromEquirectangularTexture(renderer, texture);
material.uniforms.envMap.value = cubeRenderTarget.texture; // CubeMap 格式
```

```glsl
uniform samplerCube envMap;  // ✅ 接收 CubeMap
vec3 envColor = textureCube(envMap, reflected).rgb;  // ✅ 完美工作
```

**为什么可以工作？**

- `WebGLCubeRenderTarget` 输出标准的 CubeMap 格式（6 面立方体）
- `samplerCube` 和 `textureCube()` 是为 CubeMap 设计的
- 格式完美匹配，采样正常工作

---

## WebGLCubeRenderTarget 详解

### 基本用法

```javascript
// 创建立方体渲染目标（256 = 每个面的分辨率）
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
  format: THREE.RGBFormat, // 颜色格式
  generateMipmaps: true, // 生成 mipmaps（提高性能）
  minFilter: THREE.LinearMipmapLinearFilter,
  magFilter: THREE.LinearFilter,
  encoding: THREE.sRGBEncoding, // 颜色空间
});

// 从全景 HDR 转换为立方体贴图
cubeRenderTarget.fromEquirectangularTexture(renderer, hdrTexture);

// 获取 CubeMap 纹理
const cubeMapTexture = cubeRenderTarget.texture;
```

---

### fromEquirectangularTexture 工作原理

**输入**：全景 HDR（2:1 比例，如 2048×1024）

```
+---------------------------------------+
|              天空                     |  ← 上半部分
|                                       |
|--------------------------------------|
|              地面                     |  ← 下半部分
+---------------------------------------+
 经度 -180°          0°          +180°
```

**输出**：6 面立方体贴图（每面 256×256）

```
       +------+
       |  +Y  |  上
       | (顶) |
+------+------+------+------+
|  -X  |  +Z  |  +X  |  -Z  |  左前右后
| (左) | (前) | (右) | (后) |
+------+------+------+------+
       |  -Y  |  下
       | (底) |
       +------+
```

**处理步骤**：

1. **创建 6 个虚拟摄像机**

   ```javascript
   // 每个摄像机朝向一个方向，FOV = 90°
   cameras = [
     new PerspectiveCamera(90, 1, 0.1, 10).lookAt(+X), // 右
     new PerspectiveCamera(90, 1, 0.1, 10).lookAt(-X), // 左
     new PerspectiveCamera(90, 1, 0.1, 10).lookAt(+Y), // 上
     new PerspectiveCamera(90, 1, 0.1, 10).lookAt(-Y), // 下
     new PerspectiveCamera(90, 1, 0.1, 10).lookAt(+Z), // 前
     new PerspectiveCamera(90, 1, 0.1, 10).lookAt(-Z), // 后
   ];
   ```

2. **使用特殊 Shader 采样全景图**

   ```glsl
   // 伪代码
   vec3 sampleEquirectangular(vec3 direction) {
     // 将 3D 方向转换为球面坐标
     float phi = atan(direction.z, direction.x);      // 经度
     float theta = asin(direction.y);                  // 纬度

     // 转换为 UV 坐标（0-1）
     vec2 uv;
     uv.x = phi / (2.0 * PI) + 0.5;     // 经度 → U
     uv.y = theta / PI + 0.5;           // 纬度 → V

     // 从全景图采样
     return texture2D(equirectangularMap, uv).rgb;
   }
   ```

3. **渲染到 6 个面**

   ```javascript
   for (let i = 0; i < 6; i++) {
     // 切换到当前面的 framebuffer
     renderer.setRenderTarget(cubeRenderTarget, i);

     // 使用对应方向的摄像机渲染
     renderer.render(scene, cameras[i]);
   }
   ```

4. **生成 Mipmaps**
   ```javascript
   // 自动生成各级 mipmap（256 → 128 → 64 → 32 → ...）
   cubeRenderTarget.texture.generateMipmaps = true;
   ```

---

### 分辨率选择

| 分辨率 | 每面大小  | 总像素     | 内存占用 | 适用场景              |
| ------ | --------- | ---------- | -------- | --------------------- |
| 128    | 128×128   | 98,304     | ~384 KB  | 低质量预览            |
| 256    | 256×256   | 393,216    | ~1.5 MB  | **小物体（气泡）** ✅ |
| 512    | 512×512   | 1,572,864  | ~6 MB    | 中等物体              |
| 1024   | 1024×1024 | 6,291,456  | ~24 MB   | 大型反射面            |
| 2048   | 2048×2048 | 25,165,824 | ~96 MB   | 超高质量（谨慎使用）  |

**为什么选 256？**

- 气泡是一个直径 ~2 单位的小物体
- 256×256 足够显示清晰的环境反射
- 更高分辨率不会带来明显的视觉提升
- 节省 GPU 内存和渲染时间

---

## Step 15 Shader 完整解析

### 顶点着色器

```glsl
varying vec3 vNormal;   // 传递法向量到片段着色器
varying vec3 vPosition; // 传递世界坐标到片段着色器

void main() {
  // 将法向量从模型空间转换到世界空间
  vNormal = normalize(normalMatrix * normal);

  // 计算世界坐标
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vPosition = worldPosition.xyz;

  // 计算屏幕坐标
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
```

**关键点**：

- `normalMatrix`：法向量变换矩阵（处理非均匀缩放）
- `modelMatrix`：模型矩阵（局部 → 世界）
- `viewMatrix`：视图矩阵（世界 → 摄像机）
- `projectionMatrix`：投影矩阵（摄像机 → 屏幕）

---

### 片段着色器（薄膜干涉函数）

```glsl
vec3 getThinFilmColor(float cosTheta, float thickness) {
  const float PI = 3.14159265359;

  // 光学路径长度 = 2 × 折射率 × 厚度 × cos(入射角)
  float opticalPath = 2.0 * 1.33 * thickness * cosTheta;
  //                       ↑
  //                     水的折射率（气泡膜接近水）

  // 计算三个主要波长的相位差
  float phaseR = (2.0 * PI * opticalPath) / 650.0;  // 红光 650nm
  float phaseG = (2.0 * PI * opticalPath) / 550.0;  // 绿光 550nm
  float phaseB = (2.0 * PI * opticalPath) / 450.0;  // 蓝光 450nm

  // 使用余弦函数计算干涉强度（0.5 + 0.5 * cos 将 -1~1 映射到 0~1）
  vec3 color;
  color.r = pow(0.5 + 0.5 * cos(phaseR), 1.2);  // 伽马校正（1.2）
  color.g = pow(0.5 + 0.5 * cos(phaseG), 1.2);
  color.b = pow(0.5 + 0.5 * cos(phaseB), 1.2);

  return color;
}
```

**物理原理**：

1. 光线穿过薄膜时，部分反射，部分透射
2. 透射的光在薄膜内表面再次反射
3. 两束反射光发生干涉
4. 不同波长的光干涉结果不同 → 彩虹色

**参数含义**：

- `cosTheta`：视角余弦（NdotV）
- `thickness`：薄膜厚度（纳米）
- `1.33`：折射率（水约 1.33，空气约 1.0）

---

### 片段着色器（主函数）

```glsl
void main() {
  // ========== 1. 基础计算 ==========

  // 视线方向（从表面指向摄像机）
  vec3 viewDirection = normalize(uCameraPos - vPosition);

  // 归一化法向量
  vec3 normal = normalize(vNormal);

  // 视角余弦（0 = 切线方向，1 = 垂直表面）
  float NdotV = abs(dot(normal, viewDirection));


  // ========== 2. 菲涅尔效果 ==========

  // 菲涅尔：边缘更强的反射（1.8 是指数，控制边缘锐利度）
  float fresnel = pow(1.0 - NdotV, 1.8);


  // ========== 3. 薄膜干涉（彩虹色）==========

  // 厚度变化：300-850 纳米（根据位置变化）
  float thickness = 300.0 + vNormal.y * 400.0 + vNormal.x * 150.0;

  // 计算彩虹色，乘以 1.5 增强亮度
  vec3 iridescence = getThinFilmColor(NdotV, thickness) * 1.5;


  // ========== 4. 环境反射 ==========

  // 反射方向（镜面反射）
  vec3 reflected = reflect(-viewDirection, normal);

  // 从环境贴图采样反射颜色
  vec3 envColor = textureCube(envMap, reflected).rgb;
  //                           ↑          ↑
  //                      CubeMap 纹理   反射方向


  // ========== 5. 环境折射 ==========

  // 折射方向（1.0 / 1.33 = 空气到水的折射率比）
  vec3 refracted = refract(-viewDirection, normal, 1.0 / 1.33);

  // 从环境贴图采样折射颜色
  vec3 refractColor = textureCube(envMap, refracted).rgb;


  // ========== 6. 混合边缘和中心 ==========

  // 边缘遮罩（0.2-0.95 之间平滑过渡）
  float edgeMask = smoothstep(0.2, 0.95, fresnel);

  // 边缘颜色 = 彩虹色 + 环境反射
  vec3 edgeColor = mix(iridescence, envColor, fresnel * 0.6);

  // 中心颜色 = 折射 + 反射
  vec3 centerColor = refractColor * 3.0 + envColor * 0.5;

  // 混合边缘和中心
  vec3 finalColor = mix(centerColor, edgeColor, edgeMask);


  // ========== 7. 后处理增强 ==========

  // 去饱和 + 重新饱和（增强颜色鲜艳度）
  float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
  finalColor = mix(vec3(luminance), finalColor, 1.6);

  // 提高整体亮度
  finalColor *= 2.0;

  // 增强环境光
  finalColor += envColor * 0.8;


  // ========== 8. 计算透明度 ==========

  // 边缘不透明（0.95），中心半透明（0.6）
  float alpha = edgeMask * 0.95 + (1.0 - edgeMask) * 0.6;


  // ========== 9. 输出最终颜色 ==========

  gl_FragColor = vec4(finalColor, alpha);
}
```

---

## 关键数学函数详解

### 1. reflect()（反射）

```glsl
vec3 reflected = reflect(-viewDirection, normal);
```

**物理原理**：

```
入射光 I   法向量 N    反射光 R
    ↓      ↑          ↗
     \     |         /
      \    |        /
       \   |       /
        \  |      /
         \ |     /
          \|    /
───────────●─────────── 表面
```

**数学公式**：

```glsl
R = I - 2.0 * dot(I, N) * N
```

**注意**：

- 我们使用 `-viewDirection` 是因为 `viewDirection` 是从表面指向眼睛
- 而 `reflect()` 需要入射方向（从光源指向表面）

---

### 2. refract()（折射）

```glsl
vec3 refracted = refract(-viewDirection, normal, 1.0 / 1.33);
```

**物理原理**（斯涅尔定律）：

```
n₁ × sin(θ₁) = n₂ × sin(θ₂)

空气 n₁=1.0
         |
    θ₁ ↙ ↓ ↘
─────────●───────── 界面
      ↙      ↘
    θ₂         折射光
水 n₂=1.33
```

**参数**：

- `1.0 / 1.33 ≈ 0.752`：折射率比（从空气到水）
- 结果：光线进入水中会向法线弯曲

**全内反射**：

- 当折射角度超过临界角时，返回 `vec3(0.0)`
- 需要用 `reflect()` 替代

---

### 3. smoothstep()（平滑过渡）

```glsl
float edgeMask = smoothstep(0.2, 0.95, fresnel);
```

**对比线性插值**：

```
mix(a, b, t):     smoothstep(a, b, x):
    |                 |
  1 ├─────────┐     1 ├────────╮
    │         ╱       │       ╱╲
  t │        ╱        │      ╱  ╲
    │       ╱         │     ╱    ╲
  0 ├──────┘        0 ├────╯      ╰
    0      1          a     b
```

**效果**：

- 输入 < 0.2 → 输出 0.0
- 输入 > 0.95 → 输出 1.0
- 中间平滑过渡（S 曲线）

---

## 参数调优指南

### 薄膜干涉参数

```glsl
// 厚度范围：控制彩虹色分布
float thickness = 300.0 + vNormal.y * 400.0 + vNormal.x * 150.0;
//                ↑           ↑                   ↑
//              基础厚度    垂直变化            水平变化
```

**效果**：

- 基础厚度 ↑ → 颜色偏红
- 基础厚度 ↓ → 颜色偏蓝
- 变化幅度 ↑ → 彩虹色更丰富
- 变化幅度 ↓ → 颜色更均匀

---

### 混合比例

```glsl
// 边缘颜色混合
vec3 edgeColor = mix(iridescence, envColor, fresnel * 0.6);
//                        ↑            ↑           ↑
//                     彩虹色      环境反射      混合因子

// 值越大 → 环境反射越强
// 值越小 → 彩虹色越强
```

---

### 亮度增强

```glsl
finalColor *= 2.0;           // 整体亮度（1.0-3.0）
finalColor += envColor * 0.8; // 环境光叠加（0.0-1.0）
```

**建议值**：

- 室内 HDR：亮度 1.5-2.0，环境光 0.3-0.5
- 室外 HDR：亮度 2.0-2.5，环境光 0.5-0.8

---

## 性能优化建议

### 1. 降低 CubeMap 分辨率

```javascript
// 低端设备
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128);

// 中端设备
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);

// 高端设备
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512);
```

---

### 2. 禁用 Mipmaps（如果不需要）

```javascript
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
  generateMipmaps: false, // 节省 33% 内存
  minFilter: THREE.LinearFilter, // 改用线性过滤
});
```

---

### 3. 共享环境贴图

```javascript
// ❌ 不好：每个气泡都创建一个 CubeRenderTarget
bubbles.forEach((bubble) => {
  const cubeRT = new THREE.WebGLCubeRenderTarget(256);
  cubeRT.fromEquirectangularTexture(renderer, hdrTexture);
  bubble.material.uniforms.envMap.value = cubeRT.texture;
});

// ✅ 好：所有气泡共享一个 CubeRenderTarget
const cubeRT = new THREE.WebGLCubeRenderTarget(256);
cubeRT.fromEquirectangularTexture(renderer, hdrTexture);

bubbles.forEach((bubble) => {
  bubble.material.uniforms.envMap.value = cubeRT.texture;
});
```

---

## 常见问题排查

### 问题 1：环境贴图显示为黑色

**可能原因**：

1. HDR 文件加载失败 → 检查路径和网络
2. 格式不匹配 → 确保使用 `WebGLCubeRenderTarget`
3. uniform 未正确传递 → 检查 `material.uniforms.envMap.value`

**调试方法**：

```glsl
// 直接显示环境颜色（跳过所有计算）
void main() {
  vec3 reflected = reflect(-viewDirection, normal);
  vec3 envColor = textureCube(envMap, reflected).rgb;
  gl_FragColor = vec4(envColor, 1.0);  // 如果还是黑色，说明贴图有问题
}
```

---

### 问题 2：颜色过饱和/过暗

**解决方法**：

```glsl
// 调整亮度
finalColor *= 1.5;  // 降低到 1.5

// 调整饱和度
finalColor = mix(vec3(luminance), finalColor, 1.2);  // 降低到 1.2

// 调整环境光
finalColor += envColor * 0.5;  // 降低到 0.5
```

---

### 问题 3：球体消失或闪烁

**可能原因**：

1. `depthWrite: false` 导致渲染顺序问题
2. 透明度混合模式不正确

**解决方法**：

```javascript
const material = new THREE.ShaderMaterial({
  // ...
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.NormalBlending, // 尝试不同的混合模式
});
```

---

## 总结

### 核心要点

1. **格式匹配**：

   - `MeshStandardMaterial` → `PMREMGenerator` (CubeUV)
   - `ShaderMaterial` → `WebGLCubeRenderTarget` (CubeMap)

2. **Shader 组成**：

   - 薄膜干涉（彩虹色）
   - 菲涅尔效果（边缘高光）
   - 环境反射（镜面）
   - 环境折射（透明）

3. **性能平衡**：
   - 256×256 分辨率对小物体足够
   - 共享环境贴图可节省内存
   - 考虑设备性能动态调整

---

### 学习路径

1. ✅ 理解环境贴图格式（本文档）
2. ⏭️ 实践修改参数（SHADER_LEARNING_GUIDE.md）
3. ⏭️ 创建自己的效果（实验 5.3）

---

**祝你学习愉快！** 🎈✨
