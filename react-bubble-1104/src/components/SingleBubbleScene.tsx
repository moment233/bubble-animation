'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import TestBubble from './TestBubble';

interface SingleBubbleSceneProps {
  focus: number;
  aperture: number;
  maxBlur: number;
  bubbleSpeed: number;
  bubbleSize: number;
  waveAmplitude: number;
  waveSpeed: number;
  distortion: number;
  subdivision: number;
  textureIndex: number; // 1-4
  delay?: number;
  speedMultiplier?: number;
}

function BubbleGroup({ 
  focus, 
  aperture, 
  maxBlur, 
  bubbleSpeed, 
  bubbleSize, 
  waveAmplitude, 
  waveSpeed, 
  distortion, 
  subdivision,
  textureIndex,
  delay = 0,
  speedMultiplier = 1.0
}: SingleBubbleSceneProps) {
  const { camera, scene, gl, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const bokehPassRef = useRef<BokehPass | null>(null);

  // 设置场景背景色
  useEffect(() => {
    scene.background = new THREE.Color(0x000000);
  }, [scene]);

  // 创建后处理管线
  useEffect(() => {
    if (!gl || !scene || !camera) return;

    const composer = new EffectComposer(gl);
    composerRef.current = composer;

    // 添加渲染通道
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 检测移动端
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
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

    return () => {
      composer.dispose();
    };
  }, [gl, scene, camera, size.width, size.height]);

  // 更新 BokehPass 参数
  useEffect(() => {
    if (bokehPassRef.current && bokehPassRef.current.materialBokeh) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const adaptiveAperture = aperture * (isMobile ? 1.5 : 1.0);
      
      if (aperture <= 0) {
        const safeAperture = 0.0001 * (isMobile ? 1.5 : 1.0);
        bokehPassRef.current.materialBokeh.uniforms['aperture'].value = safeAperture;
      } else {
        bokehPassRef.current.materialBokeh.uniforms['aperture'].value = adaptiveAperture;
      }
      
      bokehPassRef.current.materialBokeh.uniforms['focus'].value = focus;
      bokehPassRef.current.materialBokeh.uniforms['maxblur'].value = maxBlur;
    }
  }, [focus, aperture, maxBlur]);

  // 使用 composer 渲染
  useFrame(() => {
    if (composerRef.current) {
      composerRef.current.render();
    }
  }, 1);

  return (
    <>
      {/* 创建单个气泡 */}
      <TestBubble 
        index={0}
        camera={camera}
        speed={bubbleSpeed}
        speedMultiplier={speedMultiplier}
        sizeMultiplier={bubbleSize}
        waveAmplitude={waveAmplitude}
        waveSpeed={waveSpeed}
        distortion={distortion}
        subdivision={subdivision}
        delay={delay}
        textureIndex={textureIndex}
      />

      {/* 方向光 */}
      <directionalLight position={[-2, 2, 3]} intensity={2.5} />
    </>
  );
}

interface SingleBubbleSceneWrapperProps extends SingleBubbleSceneProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function SingleBubbleScene(props: SingleBubbleSceneWrapperProps) {
  const { className, style, ...bubbleProps } = props;

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
      className={className}
      style={style}
    >
      <Suspense fallback={null}>
        <BubbleGroup {...bubbleProps} />
      </Suspense>
    </Canvas>
  );
}

