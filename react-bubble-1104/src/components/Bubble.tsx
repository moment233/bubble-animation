'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SimplexNoise from '@/utils/SimplexNoise';
import { bubbleVertexShader, bubbleFragmentShader } from '@/shaders/bubbleShaders';

interface BubbleProps {
  envMap: THREE.CubeTexture | THREE.Texture | null;
  camera: THREE.Camera;
}

export default function Bubble({ envMap, camera }: BubbleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // 存储原始顶点位置
  const originalPositions = useRef<Float32Array | null>(null);
  
  // SimplexNoise 实例
  const simplex = useMemo(() => new SimplexNoise(), []);
  
  // 气泡属性
  const properties = useRef({
    size: 0.15 + Math.random() * 0.45, // 0.15 - 0.6
    speed: 0.3 + Math.random() * 0.5, // 0.3 - 0.8 units/sec
    swingAmplitude: 0.5 + Math.random() * 1.0, // 0.5 - 1.5
    swingFrequency: 0.5 + Math.random() * 1.5, // 0.5 - 2.0 Hz
    rotationSpeed: 0.005 + Math.random() * 0.015, // 0.005 - 0.02
    phase: Math.random() * Math.PI * 2,
    startX: -4 + Math.random() * 8, // -4 to 4
    startY: -6 + Math.random() * 12, // -6 to 6 (整个屏幕范围随机分布)
    // Z轴运动参数
    zAmplitude: 2 + Math.random() * 5, // 2-7 units
    zFrequency: 0.2 + Math.random() * 0.3, // 0.2-0.5 Hz
    zPhase: Math.random() * Math.PI * 2,
    startZ: -5 + Math.random() * 10, // -5 to 5
  });

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
      console.log('🔄 Bubble envMap updated');
    }
  }, [envMap]);

  // 动画循环
  useFrame((state) => {
    if (!meshRef.current || !geometryRef.current || !originalPositions.current) return;

    const deltaTime = state.clock.getDelta();
    const elapsedTime = state.clock.getElapsedTime();
    const props = properties.current;

    // 垂直上升
    meshRef.current.position.y += props.speed * deltaTime;

    // X轴摆动
    meshRef.current.position.x =
      props.startX +
      Math.sin(elapsedTime * props.swingFrequency + props.phase) *
        props.swingAmplitude;

    // Z轴前后摆动
    meshRef.current.position.z =
      props.startZ +
      Math.sin(elapsedTime * props.zFrequency + props.zPhase) * props.zAmplitude;

    // 旋转
    meshRef.current.rotation.y += props.rotationSpeed;
    meshRef.current.rotation.x += props.rotationSpeed * 0.5;

    // 顶点变形（SimplexNoise）
    const positions = geometryRef.current.attributes.position;
    const time = elapsedTime;

    for (let i = 0; i < positions.count; i++) {
      const x = originalPositions.current[i * 3];
      const y = originalPositions.current[i * 3 + 1];
      const z = originalPositions.current[i * 3 + 2];

      // Generate 3D Simplex noise - 更平滑的变形，减少闪烁
      const noise = simplex.noise3d(
        x * 0.25 + time * 0.08,
        y * 0.25 + time * 0.08,
        z * 0.25
      );

      // Map noise from [-1, 1] to [0, 1] then scale
      const normalizedNoise = noise * 0.5 + 0.5; // 0 to 1
      const ratio = normalizedNoise * 0.3 + 0.85; // 0.85 to 1.15

      // Apply deformation
      positions.setXYZ(i, x * ratio, y * ratio, z * ratio);
    }

    positions.needsUpdate = true;
    geometryRef.current.computeVertexNormals();

    // 到达顶部重生（循环动画）
    if (meshRef.current.position.y > 6) {
      // 重置到底部（保持连续性）
      meshRef.current.position.y = -6;

      // 随机新的参数（创造多样性）
      props.startX = -4 + Math.random() * 8;
      meshRef.current.position.x = props.startX;

      props.startZ = -5 + Math.random() * 10;
      meshRef.current.position.z = props.startZ;

      props.phase = Math.random() * Math.PI * 2;
      props.zPhase = Math.random() * Math.PI * 2;

      props.speed = 0.3 + Math.random() * 0.5;
      props.swingAmplitude = 0.5 + Math.random() * 1.0;
      props.swingFrequency = 0.5 + Math.random() * 1.5;
      props.zAmplitude = 2 + Math.random() * 5;
      props.zFrequency = 0.2 + Math.random() * 0.3;
    }

    // 更新材质 uniforms
    if (materialRef.current) {
      materialRef.current.uniforms.uCameraPos.value = camera.position;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[properties.current.startX, properties.current.startY, properties.current.startZ]}
      scale={properties.current.size}
    >
      <sphereGeometry ref={geometryRef} args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={bubbleVertexShader}
        fragmentShader={bubbleFragmentShader}
        uniforms={{
          uCameraPos: { value: camera.position },
          envMap: { value: envMap },
        }}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

