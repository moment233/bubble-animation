'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useEnvironment } from '@react-three/drei';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import Bubble from './Bubble';

interface BubbleGroupProps {
  focus: number;
  aperture: number;
  maxBlur: number;
}

function BubbleGroup({ focus, aperture, maxBlur }: BubbleGroupProps) {
  const { camera, scene, gl, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const bokehPassRef = useRef<BokehPass | null>(null);
  
  // 使用 useEnvironment hook 加载 HDR（无弃用警告）
  const hdrTexture = useEnvironment({ files: '/little_paris_eiffel_tower_1k.hdr' });

  // 设置环境贴图
  useEffect(() => {
    if (hdrTexture) {
      scene.environment = hdrTexture;
      scene.background = new THREE.Color(0x000000);
      console.log('✅ Environment map loaded successfully!');
    }
  }, [hdrTexture, scene]);

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
      {/* 创建 15 个气泡 */}
      {hdrTexture && Array.from({ length: 25 }).map((_, index) => (
        <Bubble key={index} envMap={hdrTexture} camera={camera} />
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
}

export default function BubbleScene({ focus, aperture, maxBlur }: BubbleSceneProps) {
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
        <BubbleGroup focus={focus} aperture={aperture} maxBlur={maxBlur} />
      </Suspense>
    </Canvas>
  );
}
