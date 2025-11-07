'use client';

import { useEffect, useRef } from 'react';
import { useThree, extend, useFrame } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

// 扩展 Three.js 对象到 R3F
extend({ EffectComposer, RenderPass, BokehPass });

interface PostProcessingProps {
  focus: number;
  aperture: number;
  maxBlur: number;
}

export default function PostProcessing({
  focus,
  aperture,
  maxBlur,
}: PostProcessingProps) {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const bokehPassRef = useRef<BokehPass | null>(null);

  // 创建后处理管线
  useEffect(() => {
    if (!gl || !scene || !camera) return;

    // 创建 EffectComposer
    const composer = new EffectComposer(gl);
    composerRef.current = composer;

    // 添加渲染通道
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 检测移动端
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const adaptiveAperture = aperture * (isMobile ? 1.5 : 1.0);

    // 添加景深通道（和原版HTML完全一致）
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
  }, [gl, scene, camera, size.width, size.height, aperture, maxBlur, focus]);

  // 更新 BokehPass 参数（实时响应控制面板）
  useEffect(() => {
    if (bokehPassRef.current && bokehPassRef.current.materialBokeh) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const adaptiveAperture = aperture * (isMobile ? 1.5 : 1.0);
      
      // 直接更新 uniforms
      bokehPassRef.current.materialBokeh.uniforms['focus'].value = focus;
      bokehPassRef.current.materialBokeh.uniforms['aperture'].value = adaptiveAperture;
      bokehPassRef.current.materialBokeh.uniforms['maxblur'].value = maxBlur;
    }
  }, [focus, aperture, maxBlur]);

  // 使用 useFrame 在每帧渲染后处理
  useFrame(() => {
    if (composerRef.current) {
      composerRef.current.render();
    }
  }, 1); // priority 1 确保在所有其他更新之后渲染

  return null;
}

