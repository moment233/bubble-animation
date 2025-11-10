'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SimplexNoise from '@/utils/SimplexNoise';
import { ThinFilmFresnelMap } from '@/utils/ThinFilmFresnelMap';

interface PhysicalBubbleProps {
  envMap: THREE.Texture | null;
  filmThickness: number;
  refractiveIndexFilm: number;
  refractiveIndexBase: number;
  boost: number;
  deformationStrength: number;
  edgeGlowColor: [number, number, number];
  edgeIntensity: number;
  useReflectionTint: boolean;
  useClearcoatTint: boolean;
  useDirectOverlay: boolean;
  // 球体物理参数
  bubbleIOR: number;
  transparency: number;
  bubbleThickness: number;
  // 缩放
  bubbleScale?: number;
}

export default function PhysicalBubble({
  envMap,
  filmThickness,
  refractiveIndexFilm,
  refractiveIndexBase,
  boost,
  deformationStrength,
  edgeGlowColor,
  edgeIntensity,
  useReflectionTint,
  useClearcoatTint,
  useDirectOverlay,
  bubbleIOR,
  transparency,
  bubbleThickness,
  bubbleScale = 1.0,
}: PhysicalBubbleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  
  // 存储原始顶点位置
  const originalPositions = useRef<Float32Array | null>(null);
  
  // SimplexNoise 实例
  const simplex = useMemo(() => new SimplexNoise(), []);
  
  // 创建薄膜查找纹理
  const [thinFilmMap, setThinFilmMap] = useState<ThinFilmFresnelMap | null>(null);
  
  // 初始化薄膜查找纹理
  useEffect(() => {
    const map = new ThinFilmFresnelMap(filmThickness, refractiveIndexFilm, refractiveIndexBase);
    setThinFilmMap(map);
    
    return () => {
      map.dispose();
    };
  }, []);
  
  // 更新薄膜参数
  useEffect(() => {
    if (thinFilmMap) {
      thinFilmMap.updateSettings(filmThickness, refractiveIndexFilm, refractiveIndexBase);
    }
  }, [filmThickness, refractiveIndexFilm, refractiveIndexBase, thinFilmMap]);
  
  // 创建材质
  useEffect(() => {
    if (!meshRef.current || !thinFilmMap || !envMap) return;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        envMap: { value: envMap },
        iridescenceLookUp: { value: thinFilmMap },
        color: { value: new THREE.Color(1.0, 1.0, 1.0) },
        boost: { value: boost },
        edgeGlowColor: { value: new THREE.Vector3(...edgeGlowColor) },
        edgeIntensity: { value: edgeIntensity },
        useReflectionTint: { value: useReflectionTint ? 1.0 : 0.0 },
        useClearcoatTint: { value: useClearcoatTint ? 1.0 : 0.0 },
        useDirectOverlay: { value: useDirectOverlay ? 1.0 : 0.0 },
        // 球体物理参数
        bubbleIOR: { value: bubbleIOR },
        transparency: { value: transparency },
        bubbleThickness: { value: bubbleThickness },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        
        void main() {
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
          vWorldNormal = mat3(modelMatrix) * normalize(normal);
          gl_Position = projectionMatrix * viewPos;
        }
      `,
      fragmentShader: `
        #define PI 3.14159265359
        
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        
        uniform vec3 color;
        uniform float boost;
        uniform sampler2D envMap;
        uniform sampler2D iridescenceLookUp;
        uniform vec3 edgeGlowColor;
        uniform float edgeIntensity;
        uniform float useReflectionTint;
        uniform float useClearcoatTint;
        uniform float useDirectOverlay;
        // 球体物理参数
        uniform float bubbleIOR;
        uniform float transparency;
        uniform float bubbleThickness;
        
        // 等距柱状投影采样
        vec3 sampleEquirectangular(sampler2D map, vec3 direction) {
          vec2 uv;
          uv.x = atan(direction.z, direction.x) / (2.0 * PI) + 0.5;
          uv.y = asin(clamp(direction.y, -1.0, 1.0)) / PI + 0.5;
          return texture2D(map, uv).rgb;
        }
        
        void main() {
          vec3 viewWorldDir = normalize(vWorldPosition - cameraPosition);
          vec3 normal = normalize(vWorldNormal);
          
          vec3 albedo = color;
          vec3 diffuseLight = vec3(0.0);
          vec3 specularLight = vec3(0.0);
          vec3 refractedLight = vec3(0.0);
          
          vec3 reflectedView = reflect(viewWorldDir, normal);
          float NdotV = max(-dot(viewWorldDir, normal), 0.0);
          float fresnel = pow(1.0 - NdotV, 1.8);
          
          // 薄膜干涉颜色查找（物理正确的实现）
          vec3 airy = texture2D(iridescenceLookUp, vec2(NdotV * 0.99, 0.0)).xyz;
          airy *= airy; // gamma 校正
          
          // 环境反射采样
          vec3 reflectionSample = sampleEquirectangular(envMap, reflectedView);
          reflectionSample *= reflectionSample; // gamma 校正
          
          // 应用薄膜干涉到反射
          specularLight = reflectionSample * airy * boost;
          
          // 球体折射效果（新增）
          vec3 refractedDir = refract(viewWorldDir, normal, 1.0 / bubbleIOR);
          if (dot(refractedDir, refractedDir) > 0.001) {
            vec3 refractedSample = sampleEquirectangular(envMap, refractedDir);
            refractedSample *= refractedSample;
            // 厚度影响折射光线的衰减
            float attenuation = exp(-bubbleThickness * 0.5);
            refractedLight = refractedSample * attenuation;
          }
          
          // 环境漫反射
          vec3 diffuseSample = sampleEquirectangular(envMap, normal);
          diffuseSample *= diffuseSample;
          diffuseLight = diffuseSample;
          
          // 根据 Fresnel 混合反射和折射
          vec3 baseColor = mix(refractedLight, specularLight, fresnel);
          
          // 根据透明度混合
          vec3 final = mix(baseColor, albedo * diffuseLight + specularLight, 1.0 - transparency);
          
          // 模式1: 反射染色（mix 替换，获得纯净颜色）
          if (useReflectionTint > 0.5) {
            float edgeMask = smoothstep(0.6, 0.98, fresnel);
            vec3 pureEdgeColor = edgeGlowColor * edgeIntensity * 4.0;
            final = mix(final, pureEdgeColor, edgeMask);
          }
          
          // 模式2: 清漆层染色（锐利的高光边缘）
          if (useClearcoatTint > 0.5) {
            float clearcoatMask = smoothstep(0.7, 0.99, fresnel);
            vec3 clearcoatColor = edgeGlowColor * edgeIntensity * 3.0;
            final = mix(final, clearcoatColor, clearcoatMask * 0.9);
          }
          
          // 模式3: 直接叠加（对比用）
          if (useDirectOverlay > 0.5) {
            float overlayMask = smoothstep(0.3, 0.98, fresnel);
            final += edgeGlowColor * overlayMask * edgeIntensity * 2.0;
          }
          
          // gamma 校正输出（带透明度）
          float alpha = mix(0.95, 0.3, 1.0 - transparency);
          gl_FragColor = vec4(sqrt(final), alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    materialRef.current = material;
    meshRef.current.material = material;
    
    // 初始化几何体和原始位置
    if (meshRef.current.geometry) {
      geometryRef.current = meshRef.current.geometry;
      const positions = geometryRef.current.attributes.position;
      originalPositions.current = new Float32Array(positions.array);
    }

    return () => {
      material.dispose();
    };
  }, [thinFilmMap, envMap]);

  // 更新材质 uniforms
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.boost.value = boost;
      materialRef.current.uniforms.edgeGlowColor.value.set(...edgeGlowColor);
      materialRef.current.uniforms.edgeIntensity.value = edgeIntensity;
      materialRef.current.uniforms.useReflectionTint.value = useReflectionTint ? 1.0 : 0.0;
      materialRef.current.uniforms.useClearcoatTint.value = useClearcoatTint ? 1.0 : 0.0;
      materialRef.current.uniforms.useDirectOverlay.value = useDirectOverlay ? 1.0 : 0.0;
      materialRef.current.uniforms.bubbleIOR.value = bubbleIOR;
      materialRef.current.uniforms.transparency.value = transparency;
      materialRef.current.uniforms.bubbleThickness.value = bubbleThickness;
    }
  }, [boost, edgeGlowColor, edgeIntensity, useReflectionTint, useClearcoatTint, useDirectOverlay, bubbleIOR, transparency, bubbleThickness]);

  // 缩放更新
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(bubbleScale);
    }
  }, [bubbleScale]);

  // 动画循环
  useFrame((state) => {
    if (!meshRef.current || !geometryRef.current || !originalPositions.current || !materialRef.current) return;

    const elapsedTime = state.clock.getElapsedTime();

    // 缓慢旋转
    meshRef.current.rotation.y = elapsedTime * 0.1;
    meshRef.current.rotation.x = Math.sin(elapsedTime * 0.05) * 0.2;

    // 顶点变形（根据 deformationStrength 控制）
    if (deformationStrength > 0) {
      const positions = geometryRef.current.attributes.position;
      const time = elapsedTime;

      for (let i = 0; i < positions.count; i++) {
        const x = originalPositions.current[i * 3];
        const y = originalPositions.current[i * 3 + 1];
        const z = originalPositions.current[i * 3 + 2];

        const noise = simplex.noise3d(
          x * 0.25 + time * 0.08,
          y * 0.25 + time * 0.08,
          z * 0.25
        );

        const normalizedNoise = noise * 0.5 + 0.5;
        const deformationAmount = 0.3 * deformationStrength;
        const ratio = normalizedNoise * deformationAmount + (1.0 - deformationAmount * 0.5);

        positions.setXYZ(i, x * ratio, y * ratio, z * ratio);
      }

      positions.needsUpdate = true;
      geometryRef.current.computeVertexNormals();
    } else {
      // 恢复原始位置
      const positions = geometryRef.current.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = originalPositions.current[i * 3];
        const y = originalPositions.current[i * 3 + 1];
        const z = originalPositions.current[i * 3 + 2];
        positions.setXYZ(i, x, y, z);
      }
      positions.needsUpdate = true;
      geometryRef.current.computeVertexNormals();
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[2, 128, 128]} />
    </mesh>
  );
}
