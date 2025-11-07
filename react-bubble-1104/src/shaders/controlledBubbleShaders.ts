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

export const controlledBubbleFragmentShader = `
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform vec3 uCameraPos;
  uniform sampler2D envMap;
  uniform vec3 edgeColor;
  uniform float refractionRatio;
  uniform float reflectionStrength;
  uniform float deformationStrength;
  
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

    // 平滑的厚度变化
    float thickness = 350.0 + vNormal.y * 150.0 + vNormal.x * 60.0;
    vec3 iridescence = getThinFilmColor(NdotV, thickness) * 2.2;

    // 环境反射 - 受 reflectionStrength 控制
    vec3 reflected = reflect(-viewDirection, normal);
    vec3 envColor = sampleEquirectangular(envMap, reflected) * reflectionStrength;

    // 环境折射 - 受 refractionRatio 控制
    float refractionIndex = 1.0 / refractionRatio;
    vec3 refracted = refract(-viewDirection, normal, refractionIndex);
    vec3 refractColor = vec3(0.0);
    
    // 检查折射是否有效（避免全反射）
    if (dot(refracted, refracted) > 0.001) {
      refractColor = sampleEquirectangular(envMap, refracted);
    }

    float edgeMask = smoothstep(0.2, 0.95, fresnel);
    
    // 混合边缘颜色（用户自定义颜色）
    vec3 customEdgeColor = mix(iridescence, edgeColor, 0.6);
    vec3 edgeColorFinal = mix(customEdgeColor, envColor, fresnel * 0.4);
    
    vec3 centerColor = refractColor * 2.5 + envColor * 0.5;

    vec3 finalColor = mix(centerColor, edgeColorFinal, edgeMask);

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

