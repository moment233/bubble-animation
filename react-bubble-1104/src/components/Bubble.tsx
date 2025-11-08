'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SimplexNoise from '@/utils/SimplexNoise';
import { bubbleVertexShader, bubbleFragmentShader } from '@/shaders/bubbleShaders';

interface BubbleProps {
  index: number;
  totalCount: number;
  envMaps: (THREE.CubeTexture | THREE.Texture | null)[];
  camera: THREE.Camera;
  speed: number;
}

export default function Bubble({ index, totalCount, envMaps, camera, speed }: BubbleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // 存储原始顶点位置
  const originalPositions = useRef<Float32Array | null>(null);
  
  // SimplexNoise 实例
  const simplex = useMemo(() => new SimplexNoise(), []);
  
  // 参数随机化函数
  const randomizeProperties = () => ({
    size: 0.15 + Math.random() * 0.45, // 0.15 - 0.6
    rotationSpeed: 0.005 + Math.random() * 0.015, // 0.005 - 0.02
    startX: -4 + Math.random() * 8, // -4 to 4 (X位置打乱，横跨整个屏幕)
    startY: -12, // 从页面底部之外开始（确保所有Z位置的气泡都在视野外）
    zAmplitude: 2 + Math.random() * 5, // 2-7 units
    zFrequency: 0.2 + Math.random() * 0.3, // 0.2-0.5 Hz
    zPhase: Math.random() * Math.PI * 2,
    startZ: -5 + Math.random() * 10, // -5 to 5
    hdrIndex: Math.floor(Math.random() * envMaps.length), // 随机选择 HDR 索引
  });

  // 气泡属性
  const properties = useRef({
    ...randomizeProperties(),
    speed: speed, // 使用传入的速度参数
    // 延迟出现参数（间隔0.5秒依次出现）
    delay: index * 0.5,
  });

  // 初始化几何体和原始位置
  useEffect(() => {
    if (geometryRef.current) {
      const positions = geometryRef.current.attributes.position;
      originalPositions.current = new Float32Array(positions.array);
    }
    
    // 设置初始位置
    if (meshRef.current) {
      meshRef.current.position.set(
        properties.current.startX,
        properties.current.startY,
        properties.current.startZ
      );
    }
  }, []);

  // 更新材质的 envMap uniform
  useEffect(() => {
    if (materialRef.current && envMaps.length > 0) {
      const currentHdrIndex = properties.current.hdrIndex || 0;
      const selectedEnvMap = envMaps[currentHdrIndex];
      if (selectedEnvMap) {
        materialRef.current.uniforms.envMap.value = selectedEnvMap;
        materialRef.current.needsUpdate = true;
        console.log(`🔄 气泡 ${index}: 使用 HDR #${currentHdrIndex}`);
      }
    }
  }, [envMaps, index]);

  // 实时更新气泡速度
  useEffect(() => {
    properties.current.speed = speed;
  }, [speed]);

  // 动画循环
  useFrame((state) => {
    if (!meshRef.current || !geometryRef.current || !originalPositions.current) return;

    const deltaTime = state.clock.getDelta();
    const elapsedTime = state.clock.getElapsedTime();
    const props = properties.current;

    // 延迟激活检查 - 未到激活时间则保持在底部隐藏
    if (elapsedTime < props.delay) {
      meshRef.current.position.y = -12;
      meshRef.current.position.x = props.startX;
      meshRef.current.position.z = props.startZ;
      return;
    }

    // 垂直上升
    meshRef.current.position.y += props.speed * deltaTime;
    
    // 边界检测：飞出顶部后重置
    if (meshRef.current.position.y > 15) {
      // 随机化新的参数
      const newProps = randomizeProperties();
      Object.assign(props, newProps);
      
      // 重置位置
      meshRef.current.position.y = props.startY;
      meshRef.current.position.x = props.startX;
      meshRef.current.position.z = props.startZ;
      
      // 更新气泡大小
      meshRef.current.scale.setScalar(props.size);
      
      // 更新 envMap（切换到新的 HDR）
      if (materialRef.current && envMaps[props.hdrIndex]) {
        materialRef.current.uniforms.envMap.value = envMaps[props.hdrIndex];
        materialRef.current.needsUpdate = true;
      }
      
      console.log(`🔄 气泡 ${index}: 重置 - size=${props.size.toFixed(2)}, x=${props.startX.toFixed(2)}, z=${props.startZ.toFixed(2)}, HDR #${props.hdrIndex}`);
      return;
    }

    // X轴位置固定（轻微随机偏移）
    meshRef.current.position.x = props.startX;

    // Z轴位置固定（暂停Z轴运动）
    meshRef.current.position.z = props.startZ;

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

    // 更新材质 uniforms
    if (materialRef.current) {
      materialRef.current.uniforms.uCameraPos.value = camera.position;
    }
  });

  return (
    <mesh
      ref={meshRef}
      scale={properties.current.size}
    >
      <sphereGeometry ref={geometryRef} args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={bubbleVertexShader}
        fragmentShader={bubbleFragmentShader}
        uniforms={{
          uCameraPos: { value: camera.position },
          envMap: { value: envMaps[properties.current.hdrIndex] || envMaps[0] },
        }}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

