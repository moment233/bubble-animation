'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bubbleVertexShader, bubbleFragmentShader } from '@/shaders/bubbleShaders';

interface BubbleProps {
  index: number;
  totalCount: number;
  // envMaps: (THREE.CubeTexture | THREE.Texture | null)[]; // ⚠️ 已移除 - 未使用且导致移动端内存问题
  camera: THREE.Camera;
  speed: number;
  sizeMultiplier: number;
  waveAmplitude: number;
  waveSpeed: number;
  distortion: number;
  subdivision: number;
}

export default function Bubble({ index, totalCount, camera, speed, sizeMultiplier, waveAmplitude, waveSpeed, distortion, subdivision }: BubbleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  
  // 参数随机化函数
  const randomizeProperties = () => ({
    size: (0.8 + Math.random() * 1.0) * sizeMultiplier, // 使用倍数控制尺寸范围
    rotationSpeed: 0.005 + Math.random() * 0.015, // 0.005 - 0.02
    startX: -4 + Math.random() * 8, // -4 to 4 (X位置打乱，横跨整个屏幕)
    startY: -9, // 从视野底部下方开始（实际可见范围：Y=-7.67到+7.67）
    zAmplitude: 2 + Math.random() * 5, // 2-7 units
    zFrequency: 0.2 + Math.random() * 0.3, // 0.2-0.5 Hz
    zPhase: Math.random() * Math.PI * 2,
    startZ: -5 + Math.random() * 10, // -5 to 5
    textureIndex: Math.random() < 0.5 ? 1 : 4, // 只随机选择 1 或 4
  });

  // 气泡属性
  const properties = useRef({
    ...randomizeProperties(),
    speed: speed / 5, // 将速度除以5，增加移动速度（70/5=14 units/s）
    // 延迟出现参数（间隔0.3秒依次出现，减少等待时间）
    delay: index * 0.3,
    resetTime: 0, // 记录上次重置的时间
  });

  // 初始化位置和纹理
  useEffect(() => {
    // 设置初始位置
    if (meshRef.current) {
      meshRef.current.position.set(
        properties.current.startX,
        properties.current.startY,
        properties.current.startZ
      );
    }
    
    // 加载纹理
    const textureLoader = new THREE.TextureLoader();
    const texturePath = `/${properties.current.textureIndex}.png`;
    textureLoader.load(texturePath, (texture) => {
      textureRef.current = texture;
      if (materialRef.current) {
        materialRef.current.uniforms.uTexture.value = texture;
        materialRef.current.needsUpdate = true;
      }
      console.log(`🎨 气泡 ${index}: 加载纹理 ${texturePath}`);
    });
  }, [index]);

  // envMap 不再需要，已移除

  // 实时更新气泡速度
  useEffect(() => {
    properties.current.speed = speed / 5; // 将速度除以5
  }, [speed]);

  // 实时更新气泡尺寸（当sizeMultiplier变化时，更新当前气泡的尺寸）
  useEffect(() => {
    if (meshRef.current) {
      const newSize = (0.8 + Math.random() * 1.0) * sizeMultiplier;
      properties.current.size = newSize;
      meshRef.current.scale.setScalar(newSize);
    }
  }, [sizeMultiplier]);

  // 调试：输出形变参数（仅第一个气泡，不包括subdivision）
  useEffect(() => {
    if (index === 0) {
      console.log(`🔧 气泡形变参数: waveAmplitude=${waveAmplitude}, waveSpeed=${waveSpeed}, distortion=${distortion}`);
    }
  }, [waveAmplitude, waveSpeed, distortion, index]);

  // 实时更新形变参数的 uniforms（不触发 needsUpdate，避免重新编译 shader）
  useEffect(() => {
    if (materialRef.current && materialRef.current.uniforms.uWaveAmplitude) {
      materialRef.current.uniforms.uWaveAmplitude.value = waveAmplitude;
      if (index === 0) {
        console.log(`✅ 更新 waveAmplitude: ${waveAmplitude}`);
      }
    }
  }, [waveAmplitude, index]);

  useEffect(() => {
    if (materialRef.current && materialRef.current.uniforms.uWaveSpeed) {
      materialRef.current.uniforms.uWaveSpeed.value = waveSpeed;
      if (index === 0) {
        console.log(`✅ 更新 waveSpeed: ${waveSpeed}`);
      }
    }
  }, [waveSpeed, index]);

  useEffect(() => {
    if (materialRef.current && materialRef.current.uniforms.uDistortion) {
      materialRef.current.uniforms.uDistortion.value = distortion;
      if (index === 0) {
        console.log(`✅ 更新 distortion: ${distortion}`);
      }
    }
  }, [distortion, index]);

  // 使用 useMemo 创建稳定的 uniforms 对象
  const uniforms = useMemo(() => ({
    uTexture: { value: null },
    uTime: { value: 0 },
    uWaveAmplitude: { value: waveAmplitude },
    uWaveSpeed: { value: waveSpeed },
    uDistortion: { value: distortion },
  }), []); // 空依赖数组，只创建一次

  // 动画循环
  useFrame((state) => {
    if (!meshRef.current) return;

    const elapsedTime = state.clock.getElapsedTime();
    const props = properties.current;

    // 延迟激活检查 - 未到激活时间则保持在底部隐藏
    if (elapsedTime < props.delay) {
      meshRef.current.position.y = props.startY;
      meshRef.current.position.x = props.startX;
      meshRef.current.position.z = props.startZ;
      return;
    }

    // 垂直上升：根据经过的时间直接计算位置（不使用deltaTime）
    const activeTime = elapsedTime - props.delay - props.resetTime; // 激活后经过的时间
    meshRef.current.position.y = props.startY + props.speed * activeTime;
    
    // 边界检测：飞出顶部后重置（视野顶部Y=7.67，向上多1.3单位）
    if (meshRef.current.position.y > 9) {
      // 随机化新的参数
      const newProps = randomizeProperties();
      Object.assign(props, newProps);
      
      // 记录重置时间
      props.resetTime = elapsedTime - props.delay;
      
      // 重置位置（位置会在下一帧根据时间重新计算）
      meshRef.current.position.x = props.startX;
      meshRef.current.position.z = props.startZ;
      
      // 更新气泡大小
      meshRef.current.scale.setScalar(props.size);
      
      // 更新纹理（切换到新的图片）
      if (materialRef.current) {
        const textureLoader = new THREE.TextureLoader();
        const texturePath = `/${props.textureIndex}.png`;
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
      
      console.log(`🔄 气泡 ${index}: 重置 - size=${props.size.toFixed(2)}, x=${props.startX.toFixed(2)}, z=${props.startZ.toFixed(2)}, Texture #${props.textureIndex}`);
    }

    // X轴位置固定
    meshRef.current.position.x = props.startX;

    // Z轴前后摆动
    meshRef.current.position.z = props.startZ + Math.sin(elapsedTime * props.zFrequency + props.zPhase) * props.zAmplitude;

    // Billboard 行为：始终面向相机
    meshRef.current.lookAt(camera.position);

    // 更新材质 uniforms（只更新 uTime，其他参数由 useEffect 处理）
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

