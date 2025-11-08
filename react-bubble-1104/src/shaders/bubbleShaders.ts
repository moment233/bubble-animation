export const bubbleVertexShader = `
  uniform float uTime;
  uniform float uWaveAmplitude;
  uniform float uWaveSpeed;
  uniform float uDistortion;
  
  varying vec2 vUv;

  void main() {
    vUv = uv;  // 直接使用 PlaneGeometry 的 uv attribute
    
    vec3 pos = position;
    
    // 计算到中心的距离
    float dist = length(uv - 0.5);
    
    // 圆形遮罩
    float mask = 1.0 - smoothstep(0.3, 0.5, dist);
    
    // 波浪形变（Z轴）- 使用波浪速度参数（增强效果 x3）
    float wave1 = sin(uv.x * 10.0 + uTime * uWaveSpeed) * uWaveAmplitude * 3.0;
    float wave2 = cos(uv.y * 10.0 + uTime * uWaveSpeed) * uWaveAmplitude * 3.0;
    pos.z += (wave1 + wave2) * mask;
    
    // XY平面的波浪形变（让形变更明显）
    float waveX = sin(uv.y * 8.0 + uTime * uWaveSpeed * 0.7) * uWaveAmplitude * 0.5;
    float waveY = cos(uv.x * 8.0 + uTime * uWaveSpeed * 0.7) * uWaveAmplitude * 0.5;
    pos.x += waveX * mask;
    pos.y += waveY * mask;
    
    // 凹凸效果
    float bump = sin(dist * 20.0 - uTime * 3.0) * 0.05;
    pos.z += bump * mask;
    
    // 扭曲效果（旋转形变）- 大幅增强效果
    if (uDistortion > 0.01) {
      float angle = uTime * uWaveSpeed * 0.5 + dist * 10.0;
      float twist = sin(angle) * uDistortion * 3.0 * mask;
      float cosT = cos(twist);
      float sinT = sin(twist);
      vec2 rotated = vec2(
        (uv.x - 0.5) * cosT - (uv.y - 0.5) * sinT,
        (uv.x - 0.5) * sinT + (uv.y - 0.5) * cosT
      );
      pos.xy += rotated * 0.5;
    }
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const bubbleFragmentShader = `
  uniform sampler2D uTexture;
  
  varying vec2 vUv;
  
  void main() {
    vec2 center = vec2(0.5, 0.5);
    float dist = length(vUv - center);
    
    // 直接采样纹理
    vec4 color = texture2D(uTexture, vUv);
    
    // 圆形遮罩（气泡形状）
    float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
    color.a *= alpha;
    
    gl_FragColor = color;
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

    // 平滑的厚度变化 - 受折射率影响更明显
    float thickness = 350.0 + vNormal.y * 150.0 + vNormal.x * 60.0;
    // 折射率直接影响薄膜干涉颜色
    vec3 iridescence = getThinFilmColor(NdotV, thickness) * 2.2;

    // 环境反射（可调强度）- 大幅增强效果
    vec3 reflected = reflect(-viewDirection, normal);
    vec3 envReflection = sampleEquirectangular(envMap, reflected);
    // 反射强度直接乘以环境颜色，效果更明显（0.0-2.0范围）
    vec3 envColor = envReflection * reflectionStrength;

    // 环境折射（可调折射率）- 折射率直接影响折射方向
    // 折射率范围 1.0-2.0，效果会非常明显
    vec3 refracted = refract(-viewDirection, normal, 1.0 / refractionRatio);
    vec3 refractColor = vec3(0.0);
    
    // 检查折射是否有效（避免全反射）
    if (dot(refracted, refracted) > 0.001) {
      refractColor = sampleEquirectangular(envMap, refracted);
    }

    float edgeMask = smoothstep(0.2, 0.95, fresnel);
    
    // 混合自定义边缘颜色和彩虹色
    // edgeColor 参数直接影响边缘颜色（权重从0.5提高到0.7，更明显）
    vec3 customEdgeColor = mix(iridescence, edgeColor, 0.7);
    vec3 finalEdgeColor = mix(customEdgeColor, envColor, fresnel * 0.4);
    
    // 折射颜色强度根据折射率调整 - 增强效果
    // 折射率 1.0 → factor=0, 折射率 2.0 → factor=2.0
    float refractionFactor = (refractionRatio - 1.0) * 3.0; // 加强折射效果
    vec3 centerColor = refractColor * (1.5 + refractionFactor) + envColor * 0.5;

    vec3 finalColor = mix(centerColor, finalEdgeColor, edgeMask);

    // 增强饱和度和亮度 - 反射强度大幅影响最终亮度
    float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
    finalColor = mix(vec3(luminance), finalColor, 1.6);
    // 反射强度对亮度的影响增强（从0.3提高到0.8）
    finalColor *= (1.0 + reflectionStrength * 0.8);
    finalColor += envColor * 0.3;
    
    // 添加彩虹边缘效果（可调节强度）- 效果更明显
    if (rainbowIntensity > 0.0) {
      // 使用 fresnel 值作为彩虹渐变的位置
      float rainbowPos = fresnel;
      // 只在边缘区域显示彩虹
      float rainbowMask = smoothstep(0.4, 0.95, fresnel);
      // 生成彩虹颜色
      vec3 rainbowColor = getRainbowEdge(rainbowPos);
      // 叠加到最终颜色 - 增强彩虹效果（乘以2.0）
      finalColor += rainbowColor * rainbowMask * rainbowIntensity * 2.0;
    }
    
    // 添加轻微的平滑处理，避免闪烁
    finalColor = clamp(finalColor, 0.0, 5.0); // 提高上限以显示更亮的效果

    float alpha = edgeMask * 0.95 + (1.0 - edgeMask) * 0.4;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

