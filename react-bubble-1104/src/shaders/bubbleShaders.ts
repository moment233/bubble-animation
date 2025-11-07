export const bubbleVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const bubbleFragmentShader = `
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform vec3 uCameraPos;
  uniform sampler2D envMap;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  #define PI 3.14159265359
  
  // 等距投影采样函数
  vec3 sampleEquirectangular(sampler2D envMap, vec3 direction) {
    vec2 uv;
    uv.x = atan(direction.z, direction.x) / (2.0 * PI) + 0.5;
    uv.y = asin(clamp(direction.y, -1.0, 1.0)) / PI + 0.5;
    return texture2D(envMap, uv).rgb;
  }

  vec3 getThinFilmColor(float cosTheta, float thickness) {
    float opticalPath = 2.0 * 1.33 * thickness * cosTheta;

    float phaseR = (2.0 * PI * opticalPath) / 650.0;
    float phaseG = (2.0 * PI * opticalPath) / 550.0;
    float phaseB = (2.0 * PI * opticalPath) / 450.0;

    vec3 color;
    color.r = pow(0.5 + 0.5 * cos(phaseR), 1.2);
    color.g = pow(0.5 + 0.5 * cos(phaseG), 1.2);
    color.b = pow(0.5 + 0.5 * cos(phaseB), 1.2);

    return color;
  }

  void main() {
    vec3 viewDirection = normalize(uCameraPos - vPosition);
    vec3 normal = normalize(vNormal);
    float NdotV = abs(dot(normal, viewDirection));

    float fresnel = pow(1.0 - NdotV, 1.8);

    // 平滑的厚度变化（移除噪声，避免黑点闪烁）
    float thickness = 350.0 + vNormal.y * 150.0 + vNormal.x * 60.0;
    vec3 iridescence = getThinFilmColor(NdotV, thickness) * 2.2;

    // 环境反射
    vec3 reflected = reflect(-viewDirection, normal);
    vec3 envColor = sampleEquirectangular(envMap, reflected);

    // 环境折射
    vec3 refracted = refract(-viewDirection, normal, 1.0 / 1.33);
    vec3 refractColor = vec3(0.0);
    
    // 检查折射是否有效（避免全反射）
    if (dot(refracted, refracted) > 0.001) {
      refractColor = sampleEquirectangular(envMap, refracted);
    }

    float edgeMask = smoothstep(0.2, 0.95, fresnel);
    
    // 增强环境贴图权重，确保显示HDR效果
    vec3 edgeColor = mix(iridescence, envColor, fresnel * 0.4);
    vec3 centerColor = refractColor * 2.5 + envColor * 0.5;

    vec3 finalColor = mix(centerColor, edgeColor, edgeMask);

    // 增强饱和度和亮度
    float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
    finalColor = mix(vec3(luminance), finalColor, 1.6);
    finalColor *= 1.8;
    finalColor += envColor * 0.2;
    
    // 添加轻微的平滑处理，避免闪烁
    finalColor = clamp(finalColor, 0.0, 3.0);

    float alpha = edgeMask * 0.95 + (1.0 - edgeMask) * 0.4;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// 可控气泡的 Vertex Shader（与原版相同）
export const controlledBubbleVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

// 可控气泡的 Fragment Shader（添加可调参数）
export const controlledBubbleFragmentShader = `
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform vec3 uCameraPos;
  uniform sampler2D envMap;
  uniform float refractionRatio;
  uniform float reflectionStrength;
  uniform vec3 edgeColor;
  uniform float rainbowIntensity;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  #define PI 3.14159265359
  
  // 等距投影采样函数
  vec3 sampleEquirectangular(sampler2D envMap, vec3 direction) {
    vec2 uv;
    uv.x = atan(direction.z, direction.x) / (2.0 * PI) + 0.5;
    uv.y = asin(clamp(direction.y, -1.0, 1.0)) / PI + 0.5;
    return texture2D(envMap, uv).rgb;
  }

  vec3 getThinFilmColor(float cosTheta, float thickness) {
    float opticalPath = 2.0 * refractionRatio * thickness * cosTheta;

    float phaseR = (2.0 * PI * opticalPath) / 650.0;
    float phaseG = (2.0 * PI * opticalPath) / 550.0;
    float phaseB = (2.0 * PI * opticalPath) / 450.0;

    vec3 color;
    color.r = pow(0.5 + 0.5 * cos(phaseR), 1.2);
    color.g = pow(0.5 + 0.5 * cos(phaseG), 1.2);
    color.b = pow(0.5 + 0.5 * cos(phaseB), 1.2);

    return color;
  }

  // 彩虹边缘颜色生成函数
  vec3 getRainbowEdge(float t) {
    // 使用平滑的 HSV 到 RGB 转换生成彩虹
    vec3 c = vec3(t * 6.0);
    vec3 rgb = clamp(abs(mod(c + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    // 增强饱和度和亮度
    rgb = rgb * rgb * (3.0 - 2.0 * rgb); // smoothstep
    return rgb * 1.5; // 提高亮度
  }

  void main() {
    vec3 viewDirection = normalize(uCameraPos - vPosition);
    vec3 normal = normalize(vNormal);
    float NdotV = abs(dot(normal, viewDirection));

    float fresnel = pow(1.0 - NdotV, 1.8);

    // 平滑的厚度变化
    float thickness = 350.0 + vNormal.y * 150.0 + vNormal.x * 60.0;
    vec3 iridescence = getThinFilmColor(NdotV, thickness) * 2.2;

    // 环境反射（可调强度）- 影响所有反射相关计算
    vec3 reflected = reflect(-viewDirection, normal);
    vec3 envReflection = sampleEquirectangular(envMap, reflected);
    vec3 envColor = envReflection * reflectionStrength;

    // 环境折射（可调折射率）- 折射率直接影响折射方向
    vec3 refracted = refract(-viewDirection, normal, 1.0 / refractionRatio);
    vec3 refractColor = vec3(0.0);
    
    // 检查折射是否有效（避免全反射）
    if (dot(refracted, refracted) > 0.001) {
      refractColor = sampleEquirectangular(envMap, refracted);
    }

    float edgeMask = smoothstep(0.2, 0.95, fresnel);
    
    // 混合自定义边缘颜色和彩虹色 - 使用 reflectionStrength 控制的 envColor
    vec3 customEdgeColor = mix(iridescence, edgeColor, 0.5);
    vec3 finalEdgeColor = mix(customEdgeColor, envColor, fresnel * 0.4);
    
    // 折射颜色强度根据折射率调整（折射率越高，折射效果越强）
    float refractionFactor = (refractionRatio - 1.0) * 2.0; // 将 1.0-2.0 映射到 0.0-2.0
    vec3 centerColor = refractColor * (2.0 + refractionFactor) + envColor * 0.5;

    vec3 finalColor = mix(centerColor, finalEdgeColor, edgeMask);

    // 增强饱和度和亮度 - 反射强度也影响最终亮度
    float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
    finalColor = mix(vec3(luminance), finalColor, 1.6);
    finalColor *= (1.5 + reflectionStrength * 0.3); // 反射强度影响整体亮度
    finalColor += envColor * 0.2;
    
    // 添加彩虹边缘效果（可调节强度）
    if (rainbowIntensity > 0.0) {
      // 使用 fresnel 值作为彩虹渐变的位置
      float rainbowPos = fresnel;
      // 只在边缘区域显示彩虹
      float rainbowMask = smoothstep(0.4, 0.95, fresnel);
      // 生成彩虹颜色
      vec3 rainbowColor = getRainbowEdge(rainbowPos);
      // 叠加到最终颜色
      finalColor += rainbowColor * rainbowMask * rainbowIntensity;
    }
    
    // 添加轻微的平滑处理，避免闪烁
    finalColor = clamp(finalColor, 0.0, 3.0);

    float alpha = edgeMask * 0.95 + (1.0 - edgeMask) * 0.4;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

