export const bubbleVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normal;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const bubbleFragmentShader = `
  uniform vec3 uCameraPos;
  uniform samplerCube envMap; // HDR 环境贴图
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  // 简单的噪声函数
  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }
  
  // 真实薄膜干涉颜色计算 - 参考 Houdini 效果
  vec3 getThinFilmColor(float cosTheta, float thickness) {
    const float PI = 3.14159265359;
    
    // 光程差计算
    float opticalPath = 2.0 * 1.33 * thickness * cosTheta;
    
    // 计算可见光谱的主要波长干涉
    float phaseR = (2.0 * PI * opticalPath) / 650.0; // 红光
    float phaseO = (2.0 * PI * opticalPath) / 610.0; // 橙光
    float phaseY = (2.0 * PI * opticalPath) / 580.0; // 黄光
    float phaseG = (2.0 * PI * opticalPath) / 550.0; // 绿光
    float phaseC = (2.0 * PI * opticalPath) / 490.0; // 青光
    float phaseB = (2.0 * PI * opticalPath) / 450.0; // 蓝光
    float phaseV = (2.0 * PI * opticalPath) / 420.0; // 紫光
    
    // 干涉强度（更平滑的余弦）
    float intensityR = pow(0.5 + 0.5 * cos(phaseR), 1.2);
    float intensityO = pow(0.5 + 0.5 * cos(phaseO), 1.2);
    float intensityY = pow(0.5 + 0.5 * cos(phaseY), 1.2);
    float intensityG = pow(0.5 + 0.5 * cos(phaseG), 1.2);
    float intensityC = pow(0.5 + 0.5 * cos(phaseC), 1.2);
    float intensityB = pow(0.5 + 0.5 * cos(phaseB), 1.2);
    float intensityV = pow(0.5 + 0.5 * cos(phaseV), 1.2);
    
    // 真实光谱颜色混合（参考 Houdini 效果）
    vec3 color = vec3(0.0);
    
    // 红色通道：红+橙+黄
    color.r = intensityR * 1.0 + intensityO * 0.9 + intensityY * 0.7;
    
    // 绿色通道：黄+绿+青
    color.g = intensityY * 0.8 + intensityG * 1.0 + intensityC * 0.9;
    
    // 蓝色通道：青+蓝+紫
    color.b = intensityC * 0.8 + intensityB * 1.0 + intensityV * 0.9;
    
    // 归一化并增强对比度
    color = color / max(max(color.r, color.g), max(color.b, 0.01));
    
    // 增加饱和度（Houdini 风格）
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, 1.8); // 高饱和度
    
    // 轻微色调偏移创造更自然的颜色变化
    float hueShift = fract(thickness * 0.001);
    color.rgb = color.rgb + vec3(sin(hueShift * PI), cos(hueShift * PI), sin(hueShift * PI * 0.5)) * 0.15;
    
    return clamp(color, 0.0, 1.0);
  }
  
  void main() {
    vec3 viewDirection = normalize(uCameraPos - vPosition);
    float NdotV = abs(dot(vNormal, viewDirection));
    
    // 菲涅耳效果 - 边缘更亮
    float fresnel = pow(1.0 - NdotV, 1.8);
    
    // 边缘遮罩：增强对比度，让边缘更清晰
    float edgeMask = smoothstep(0.2, 0.95, fresnel); // 调整范围让边缘更锐利
    
    // 薄膜厚度变化（模拟 Houdini 的自然波纹）
    // 基础厚度 + 角度变化 + 位置噪声
    float baseThickness = 300.0;
    float angleVariation = vNormal.y * 400.0 + vNormal.x * 150.0;
    
    // 添加噪声创造自然的条纹（参考图的波纹效果）
    float noisePattern = noise(vPosition * 2.0) * 100.0;
    float noisePattern2 = noise(vPosition * 5.0 + vec3(100.0)) * 50.0;
    
    float thickness = baseThickness + angleVariation + noisePattern + noisePattern2;
    
    // 计算薄膜干涉颜色
    vec3 iridescence = getThinFilmColor(NdotV, thickness);
    
    // 大幅提亮气泡
    iridescence *= 1.5; // 提亮 50%
    
    // 立体感：内侧添加轻微暗化
    float depth = smoothstep(0.3, 0.6, NdotV) * 0.25;
    vec3 depthColor = vec3(0.08, 0.08, 0.12) * depth;
    
    // === 1. 环境反射（HDR 环境贴图）- 白色高光 ===
    vec3 reflected = reflect(-viewDirection, normalize(vNormal));
    vec3 envColor = textureCube(envMap, reflected).rgb;
    
    // === 2. 折射（光线穿过气泡）- 内部颜色 ===
    vec3 refracted = refract(-viewDirection, normalize(vNormal), 1.0 / 1.33);
    vec3 refractColor = textureCube(envMap, refracted).rgb;
    
    // 处理全反射情况
    if (dot(refracted, refracted) < 0.01) {
      refractColor = vec3(0.0);
    }
    
    // === 3. 深度着色（Beer-Lambert 吸收定律）- 紫蓝色 ===
    // 计算气泡厚度（基于视角）
    float bubbleThickness = (1.0 - NdotV) * 2.0;
    
    // 大幅降低吸收，让折射光能透过（黑背景时需要更强的折射）
    vec3 absorptionColor = vec3(0.05, 0.04, 0.08); // 极低吸收（0.25 → 0.05）
    
    // Beer-Lambert 吸收（极低系数）
    vec3 absorption = exp(-absorptionColor * bubbleThickness * 0.2); // 0.8 → 0.2
    
    // 应用吸收到折射颜色
    vec3 transmittedColor = refractColor * absorption;
    
    // === 4. 多层混合策略 ===
    
    // 边缘效果：薄膜彩虹色 + 中等环境反射（降低反射，突出彩虹色）
    float envStrength = fresnel * 0.35; // 降低反射强度（0.7 → 0.35）
    vec3 edgeColor = mix(iridescence, envColor, envStrength);
    
    // 中心效果：折射 + 深度吸收（提亮折射部分 + 添加基础环境光）
    vec3 centerColor = transmittedColor * 3.0 + envColor * 0.15; // 提亮折射 3 倍 + 15% 环境光
    
    // 根据边缘遮罩混合边缘和中心
    vec3 finalColor = mix(centerColor, edgeColor, edgeMask);
    
    // 增强饱和度
    float saturation = 1.6;
    float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
    finalColor = mix(vec3(luminance), finalColor, saturation);
    
    // 整体提亮 - 增加基础亮度
    finalColor *= 1.3; // 提亮 30%
    
    // 添加轻微的环境光提亮（全局照明效果）
    finalColor += envColor * 0.08;
    
    // === 5. 透明度 - 中心透明，边缘不透明 ===
    float alpha = edgeMask * 0.95 + (1.0 - edgeMask) * 0.15; // 中心更透明（0.4 → 0.15）
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`
