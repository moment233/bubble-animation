'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bubbleVertexShader, bubbleFragmentShader } from '@/shaders/bubbleShaders';

interface TestBubbleProps {
  index: number;
  camera: THREE.Camera;
  speed: number;
  speedMultiplier: number;
  sizeMultiplier: number;
  waveAmplitude: number;
  waveSpeed: number;
  distortion: number;
  subdivision: number;
  delay: number;
  textureIndex: number; // 支持指定纹理索引（1-4）
}

export default function TestBubble({ 
  index, 
  camera, 
  speed, 
  speedMultiplier, 
  sizeMultiplier, 
  waveAmplitude, 
  waveSpeed, 
  distortion, 
  subdivision, 
  delay,
  textureIndex 
}: TestBubbleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  
  // 参数随机化函数（使用指定的 textureIndex）
  const randomizeProperties = () => ({
    size: (0.8 + Math.random() * 1.0) * sizeMultiplier,
    rotationSpeed: 0.005 + Math.random() * 0.015,
    startX: -4 + Math.random() * 8,
    startY: -11,
    zAmplitude: 2 + Math.random() * 5,
    zFrequency: 0.2 + Math.random() * 0.3,
    zPhase: Math.random() * Math.PI * 2,
    startZ: -5 + Math.random() * 10,
    textureIndex: textureIndex, // 使用传入的纹理索引
  });

  // 气泡属性
  const properties = useRef({
    ...randomizeProperties(),
    speed: (speed / 5) * speedMultiplier,
    speedMultiplier: speedMultiplier,
    delay: delay,
    resetTime: 0,
  });

  // 初始化位置和纹理
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(
        properties.current.startX,
        properties.current.startY,
        properties.current.startZ
      );
    }
    
    // 加载纹理
    const textureLoader = new THREE.TextureLoader();
    const texturePath = `/${textureIndex}.png`;
    textureLoader.load(texturePath, (texture) => {
      textureRef.current = texture;
      if (materialRef.current) {
        materialRef.current.uniforms.uTexture.value = texture;
        materialRef.current.needsUpdate = true;
      }
      console.log(`🎨 测试气泡 ${index}: 加载纹理 ${texturePath}`);
    });
  }, [index, textureIndex]);

  // 实时更新气泡速度
  useEffect(() => {
    properties.current.speed = (speed / 5) * properties.current.speedMultiplier;
  }, [speed, speedMultiplier]);

  // 实时更新气泡尺寸
  useEffect(() => {
    if (meshRef.current) {
      const newSize = (0.8 + Math.random() * 1.0) * sizeMultiplier;
      properties.current.size = newSize;
      meshRef.current.scale.setScalar(newSize);
    }
  }, [sizeMultiplier]);

  // 实时更新形变参数
  useEffect(() => {
    if (materialRef.current && materialRef.current.uniforms.uWaveAmplitude) {
      materialRef.current.uniforms.uWaveAmplitude.value = waveAmplitude;
    }
  }, [waveAmplitude]);

  useEffect(() => {
    if (materialRef.current && materialRef.current.uniforms.uWaveSpeed) {
      materialRef.current.uniforms.uWaveSpeed.value = waveSpeed;
    }
  }, [waveSpeed]);

  useEffect(() => {
    if (materialRef.current && materialRef.current.uniforms.uDistortion) {
      materialRef.current.uniforms.uDistortion.value = distortion;
    }
  }, [distortion]);

  // 使用 useMemo 创建稳定的 uniforms 对象
  const uniforms = useMemo(() => ({
    uTexture: { value: null },
    uTime: { value: 0 },
    uWaveAmplitude: { value: waveAmplitude },
    uWaveSpeed: { value: waveSpeed },
    uDistortion: { value: distortion },
  }), []);

  // 动画循环
  useFrame((state) => {
    if (!meshRef.current) return;

    const elapsedTime = state.clock.getElapsedTime();
    const props = properties.current;

    // 延迟激活检查
    if (elapsedTime < props.delay) {
      meshRef.current.position.y = props.startY;
      meshRef.current.position.x = props.startX;
      meshRef.current.position.z = props.startZ;
      return;
    }

    // 垂直上升
    const activeTime = elapsedTime - props.delay - props.resetTime;
    meshRef.current.position.y = props.startY + props.speed * activeTime;
    
    // 边界检测：飞出顶部后重置
    if (meshRef.current.position.y > 9) {
      const newProps = randomizeProperties();
      Object.assign(props, newProps);
      props.resetTime = elapsedTime - props.delay;
      
      meshRef.current.position.x = props.startX;
      meshRef.current.position.z = props.startZ;
      meshRef.current.scale.setScalar(props.size);
      
      // 更新纹理（保持使用指定的 textureIndex）
      if (materialRef.current) {
        const textureLoader = new THREE.TextureLoader();
        const texturePath = `/${textureIndex}.png`;
        textureLoader.load(texturePath, (texture) => {
          if (textureRef.current) {
            textureRef.current.dispose();
          }
          textureRef.current = texture;
          if (materialRef.current) {
            materialRef.current.uniforms.uTexture.value = texture;
            materialRef.current.needsUpdate = true;
          }
        });
      }
    }

    // X轴位置固定
    meshRef.current.position.x = props.startX;

    // Z轴前后摆动
    meshRef.current.position.z = props.startZ + Math.sin(elapsedTime * props.zFrequency + props.zPhase) * props.zAmplitude;

    // Billboard 行为：始终面向相机
    meshRef.current.lookAt(camera.position);

    // 更新材质 uniforms
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = elapsedTime;
    }
  });

  return (
    <mesh
      ref={meshRef}
      scale={properties.current.size}
    >
      <planeGeometry ref={geometryRef} args={[2, 2, subdivision, subdivision]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={bubbleVertexShader}
        fragmentShader={bubbleFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

