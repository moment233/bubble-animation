'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SimplexNoise from '@/utils/SimplexNoise';
import { controlledBubbleVertexShader, controlledBubbleFragmentShader } from '@/shaders/bubbleShaders';

interface ControlledBubbleProps {
  envMap: THREE.CubeTexture | THREE.Texture | null;
  camera: THREE.Camera;
  size: number;
  deformationStrength: number;
  refractionRatio: number;
  reflectionStrength: number;
  edgeColor: [number, number, number];
  rainbowIntensity: number;
}

export default function ControlledBubble({ 
  envMap, 
  camera,
  size,
  deformationStrength,
  refractionRatio,
  reflectionStrength,
  edgeColor,
  rainbowIntensity
}: ControlledBubbleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // 存储原始顶点位置
  const originalPositions = useRef<Float32Array | null>(null);
  
  // SimplexNoise 实例
  const simplex = useMemo(() => new SimplexNoise(), []);

  // 初始化几何体和原始位置
  useEffect(() => {
    if (geometryRef.current) {
      const positions = geometryRef.current.attributes.position;
      originalPositions.current = new Float32Array(positions.array);
    }
  }, []);

  // 更新材质的 envMap uniform
  useEffect(() => {
    if (materialRef.current && envMap) {
      materialRef.current.uniforms.envMap.value = envMap;
      materialRef.current.needsUpdate = true;
    }
  }, [envMap]);

  // 更新材质的控制参数
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.refractionRatio.value = refractionRatio;
      materialRef.current.uniforms.reflectionStrength.value = reflectionStrength;
      materialRef.current.uniforms.edgeColor.value = new THREE.Vector3(...edgeColor);
      materialRef.current.uniforms.rainbowIntensity.value = rainbowIntensity;
      materialRef.current.needsUpdate = true;
    }
  }, [refractionRatio, reflectionStrength, edgeColor, rainbowIntensity]);

  // 动画循环
  useFrame((state) => {
    if (!meshRef.current || !geometryRef.current || !originalPositions.current) return;

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

        // Generate 3D Simplex noise
        const noise = simplex.noise3d(
          x * 0.25 + time * 0.08,
          y * 0.25 + time * 0.08,
          z * 0.25
        );

        // Map noise from [-1, 1] to [0, 1] then scale
        const normalizedNoise = noise * 0.5 + 0.5;
        const deformationAmount = 0.3 * deformationStrength; // 根据强度调整
        const ratio = normalizedNoise * deformationAmount + (1.0 - deformationAmount * 0.5);

        // Apply deformation
        positions.setXYZ(i, x * ratio, y * ratio, z * ratio);
      }

      positions.needsUpdate = true;
      geometryRef.current.computeVertexNormals();
    } else {
      // 如果形变强度为0，恢复原始位置
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

    // 更新相机位置
    if (materialRef.current) {
      materialRef.current.uniforms.uCameraPos.value = camera.position;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      scale={size}
    >
      <sphereGeometry ref={geometryRef} args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={controlledBubbleVertexShader}
        fragmentShader={controlledBubbleFragmentShader}
        uniforms={{
          uCameraPos: { value: camera.position },
          envMap: { value: envMap },
          refractionRatio: { value: refractionRatio },
          reflectionStrength: { value: reflectionStrength },
          edgeColor: { value: new THREE.Vector3(...edgeColor) },
          rainbowIntensity: { value: rainbowIntensity },
        }}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
