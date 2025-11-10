'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import Bubble from './Bubble';

interface BubbleGroupProps {
  focus: number;
  aperture: number;
  maxBlur: number;
  bubbleSpeed: number;
  bubbleSize: number;
  waveAmplitude: number;
  waveSpeed: number;
  distortion: number;
  subdivision: number;
  bubbleCount: number;
}

function BubbleGroup({ focus, aperture, maxBlur, bubbleSpeed, bubbleSize, waveAmplitude, waveSpeed, distortion, subdivision, bubbleCount }: BubbleGroupProps) {
  const { camera, scene, gl, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const bokehPassRef = useRef<BokehPass | null>(null);
  
  // 🎲 生成随机气泡出现时间和速度（三三两两出现效果）
  const { bubbleDelays, bubbleSpeedMultipliers } = useMemo(() => {
    const delays: number[] = [];
    const speedMultipliers: number[] = [];
    let currentTime = 0;
    let remaining = bubbleCount;
    
    while (remaining > 0) {
      // 每组随机2-3个气泡
      const groupSize = Math.min(Math.random() < 0.5 ? 2 : 3, remaining);
      // 每组随机一个速度倍数（0.7-1.3倍）
      const groupSpeedMultiplier = 0.7 + Math.random() * 0.6;
      
      // 组内每个气泡延迟 = 当前组时间点 + 随机0-0.3秒
      for (let i = 0; i < groupSize; i++) {
        delays.push(currentTime + Math.random() * 0.3);
        speedMultipliers.push(groupSpeedMultiplier); // 同一组使用相同速度
      }
      
      remaining -= groupSize;
      // 组间间隔：0.8-1.2秒
      currentTime += 0.8 + Math.random() * 0.4;
    }
    
    // 打乱顺序（让气泡索引和出现时间解耦）
    const indices = delays.map((_, i) => i);
    const shuffledIndices = indices.sort(() => Math.random() - 0.5);
    
    return {
      bubbleDelays: shuffledIndices.map(i => delays[i]),
      bubbleSpeedMultipliers: shuffledIndices.map(i => speedMultipliers[i]),
    };
  }, [bubbleCount]);
  
  // ⚠️ HDR 加载已注释 - 移动端内存不足导致崩溃，且当前未使用 HDR
  // // 定义 HDR 文件列表
  // const hdrFiles = [
  //   '/JCI54551673495.hdr',
  //   '/JCI54553017162.hdr',
  //   '/JCI54556473495.hdr',
  //   '/JCI54558507195.hdr',
  //   '/little_paris_eiffel_tower_1k.hdr',
  // ];

  // // 预加载多个 HDR 文件
  // const hdr1 = useEnvironment({ files: hdrFiles[0] });
  // const hdr2 = useEnvironment({ files: hdrFiles[1] });
  // const hdr3 = useEnvironment({ files: hdrFiles[2] });
  // const hdr4 = useEnvironment({ files: hdrFiles[3] });
  // const hdr5 = useEnvironment({ files: hdrFiles[4] });

  // // 将所有 HDR 组合成数组
  // const hdrTextures = [hdr1, hdr2, hdr3, hdr4, hdr5];
  
  // // 检查所有 HDR 是否加载完成
  // const allHdrsLoaded = hdrTextures.every(hdr => hdr !== null);

  // // 设置环境贴图（使用第一个作为场景环境）
  // useEffect(() => {
  //   if (hdr1) {
  //     scene.environment = hdr1;
  //     scene.background = new THREE.Color(0x000000);
  //     console.log('✅ Environment maps loaded successfully! Total:', hdrTextures.filter(h => h).length);
  //   }
  // }, [hdr1, scene, hdrTextures]);

  // 设置场景背景色
  useEffect(() => {
      scene.background = new THREE.Color(0x000000);
  }, [scene]);

  // 创建后处理管线（和原版HTML完全一致）
  useEffect(() => {
    if (!gl || !scene || !camera) return;

    const composer = new EffectComposer(gl);
    composerRef.current = composer;

    // 添加渲染通道
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 检测移动端
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    // 确保光圈值是正数
    const safeAperture = aperture > 0 ? aperture : 0.0001;
    const adaptiveAperture = safeAperture * (isMobile ? 1.5 : 1.0);

    // 添加景深通道（BokehPass）
    const bokehPass = new BokehPass(scene, camera, {
      focus: focus,
      aperture: adaptiveAperture,
      maxblur: maxBlur,
    });
    bokehPassRef.current = bokehPass;
    composer.addPass(bokehPass);

    composer.setSize(size.width, size.height);

    // 计算焦点Z位置（相机在 z=10）
    const focusZ = 10 - focus;
    console.log('✅ BokehPass created with:', {
      focus,
      focusZ,
      aperture: adaptiveAperture,
      maxBlur,
      cameraZ: camera.position.z,
      isMobile,
    });

    return () => {
      composer.dispose();
    };
  }, [gl, scene, camera, size.width, size.height]);

  // 更新 BokehPass 参数
  useEffect(() => {
    if (bokehPassRef.current && bokehPassRef.current.materialBokeh) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const adaptiveAperture = aperture * (isMobile ? 1.5 : 1.0);
      
      // 确保光圈值是正数
      if (aperture <= 0) {
        console.warn('⚠️ Aperture must be positive, using default 0.0001');
        const safeAperture = 0.0001 * (isMobile ? 1.5 : 1.0);
        bokehPassRef.current.materialBokeh.uniforms['aperture'].value = safeAperture;
      } else {
        bokehPassRef.current.materialBokeh.uniforms['aperture'].value = adaptiveAperture;
      }
      
      bokehPassRef.current.materialBokeh.uniforms['focus'].value = focus;
      bokehPassRef.current.materialBokeh.uniforms['maxblur'].value = maxBlur;
      
      // 计算焦点Z位置（相机在 z=10）
      const focusZ = 10 - focus;
      
      console.log('🔄 BokehPass updated:', {
        focus,
        focusZ,
        aperture: adaptiveAperture,
        maxBlur,
        cameraZ: camera.position.z,
        isMobile,
      });
    } else {
      console.warn('⚠️ BokehPass not ready yet, waiting for initialization...');
    }
  }, [focus, aperture, maxBlur, camera]);

  // 使用 composer 渲染（替代默认渲染）
  useFrame(() => {
    if (composerRef.current) {
      composerRef.current.render();
    }
  }, 1);

  return (
    <>
      {/* 创建气泡 */}
      {Array.from({ length: bubbleCount }).map((_, index) => (
        <Bubble 
          key={index} 
          index={index}
          totalCount={bubbleCount}
          camera={camera}
          speed={bubbleSpeed}
          speedMultiplier={bubbleSpeedMultipliers[index]}
          sizeMultiplier={bubbleSize}
          waveAmplitude={waveAmplitude}
          waveSpeed={waveSpeed}
          distortion={distortion}
          subdivision={subdivision}
          delay={bubbleDelays[index]}
        />
      ))}

      {/* 方向光 */}
      <directionalLight position={[-2, 2, 3]} intensity={2.5} />
    </>
  );
}

interface BubbleSceneProps {
  focus: number;
  aperture: number;
  maxBlur: number;
  bubbleSpeed: number;
  bubbleSize: number;
  waveAmplitude: number;
  waveSpeed: number;
  distortion: number;
  subdivision: number;
  bubbleCount: number;
}

export default function BubbleScene({ focus, aperture, maxBlur, bubbleSpeed, bubbleSize, waveAmplitude, waveSpeed, distortion, subdivision, bubbleCount }: BubbleSceneProps) {
  return (
    <Canvas
      camera={{
        position: [0, 0, 10],
        fov: 75,
        near: 0.1,
        far: 1000,
      }}
      gl={{
        antialias: true,
        alpha: true,
      }}
      dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      <Suspense fallback={null}>
        <BubbleGroup focus={focus} aperture={aperture} maxBlur={maxBlur} bubbleSpeed={bubbleSpeed} bubbleSize={bubbleSize} waveAmplitude={waveAmplitude} waveSpeed={waveSpeed} distortion={distortion} subdivision={subdivision} bubbleCount={bubbleCount} />
      </Suspense>
    </Canvas>
  );
}
