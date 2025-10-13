export const bubbleVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normal;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const bubbleFragmentShader = `
  uniform vec3 uCameraPos;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  // 简单的噪声函数
  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }
  
  // 薄膜干涉颜色计算 - 更多颜色渐变点
  vec3 getThinFilmColor(float cosTheta, float thickness) {
    const float PI = 3.14159265359;
    
    // 光程差计算（模拟多层干涉）
    float opticalPath = 2.0 * 1.33 * thickness * cosTheta;
    
    // 计算多个波长的干涉
    float phaseR = (2.0 * PI * opticalPath) / 650.0; // 红光
    float phaseG = (2.0 * PI * opticalPath) / 550.0; // 绿光
    float phaseB = (2.0 * PI * opticalPath) / 450.0; // 蓝光
    float phaseV = (2.0 * PI * opticalPath) / 420.0; // 紫光
    float phaseY = (2.0 * PI * opticalPath) / 580.0; // 黄光
    
    // 每个波长的干涉强度
    float intensityR = 0.5 + 0.5 * cos(phaseR);
    float intensityG = 0.5 + 0.5 * cos(phaseG);
    float intensityB = 0.5 + 0.5 * cos(phaseB);
    float intensityV = 0.5 + 0.5 * cos(phaseV);
    float intensityY = 0.5 + 0.5 * cos(phaseY);
    
    // 组合多个颜色通道
    vec3 color = vec3(0.0);
    
    // 红色分量
    color.r = intensityR * 0.6 + intensityY * 0.4;
    
    // 绿色分量
    color.g = intensityG * 0.7 + intensityY * 0.3;
    
    // 蓝色分量  
    color.b = intensityB * 0.6 + intensityV * 0.4;
    
    // 添加额外的色相偏移创造更多颜色变化
    float t = fract((phaseG / (2.0 * PI)) * 2.0);
    
    // 6个颜色过渡点：暗调紫红→蓝紫→深蓝→青蓝（低亮度版本）
    vec3 finalColor;
    if (t < 0.16) {
      // 暗紫红 → 暗粉紫（降低亮度）
      finalColor = mix(vec3(0.45, 0.15, 0.40), vec3(0.40, 0.20, 0.50), t / 0.16);
    } else if (t < 0.33) {
      // 暗粉紫 → 暗蓝紫
      finalColor = mix(vec3(0.40, 0.20, 0.50), vec3(0.30, 0.20, 0.55), (t - 0.16) / 0.17);
    } else if (t < 0.5) {
      // 暗蓝紫 → 暗深蓝
      finalColor = mix(vec3(0.30, 0.20, 0.55), vec3(0.15, 0.25, 0.50), (t - 0.33) / 0.17);
    } else if (t < 0.66) {
      // 暗深蓝 → 暗青蓝
      finalColor = mix(vec3(0.15, 0.25, 0.50), vec3(0.15, 0.40, 0.50), (t - 0.5) / 0.16);
    } else if (t < 0.83) {
      // 暗青蓝 → 暗青绿
      finalColor = mix(vec3(0.15, 0.40, 0.50), vec3(0.20, 0.45, 0.40), (t - 0.66) / 0.17);
    } else {
      // 暗青绿 → 回到暗紫红（循环）
      finalColor = mix(vec3(0.20, 0.45, 0.40), vec3(0.45, 0.15, 0.40), (t - 0.83) / 0.17);
    }
    
    // 混合物理计算的颜色和艺术化的颜色
    color = mix(color, finalColor, 0.7);
    
    // 增强饱和度
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luminance), color, 1.5);
    
    return clamp(color, 0.0, 1.0);
  }
  
  void main() {
    vec3 viewDirection = normalize(uCameraPos - vPosition);
    float NdotV = abs(dot(vNormal, viewDirection));
    
    // 菲涅耳效果 - 边缘更亮
    float fresnel = pow(1.0 - NdotV, 1.8);
    
    // 边缘遮罩：只显示外侧70%
    float edgeMask = smoothstep(0.3, 1.0, fresnel);
    
    // 移除噪声！直接使用基于角度的薄膜厚度变化（平滑渐变）
    // 根据法线方向产生平滑的颜色变化
    float thickness = 400.0 + vNormal.y * 200.0; // 上下产生颜色变化
    
    // 计算薄膜干涉颜色
    vec3 iridescence = getThinFilmColor(NdotV, thickness);
    
    // 降低整体亮度，保持暗调
    iridescence *= 0.7; // 整体压暗
    
    // 立体感：内侧添加轻微暗化
    float depth = smoothstep(0.3, 0.6, NdotV) * 0.25;
    vec3 depthColor = vec3(0.08, 0.08, 0.12) * depth;
    
    // 只在边缘显示彩色，保持纯净
    vec3 finalColor = (iridescence * edgeMask * 1.0) + depthColor;
    
    // 边缘透明度控制
    float alpha = edgeMask * 0.9 + depth * 0.2;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;
