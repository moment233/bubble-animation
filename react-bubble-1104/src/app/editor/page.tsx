'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useEnvironment } from '@react-three/drei';
import ControlledBubble from '@/components/ControlledBubble';
import ControlPanel from '@/components/ControlPanel';

interface BubbleSceneProps {
  size: number;
  deformationStrength: number;
  refractionRatio: number;
  reflectionStrength: number;
  edgeColor: [number, number, number];
  rainbowIntensity: number;
}

function BubbleScene({
  size,
  deformationStrength,
  refractionRatio,
  reflectionStrength,
  edgeColor,
  rainbowIntensity,
}: BubbleSceneProps) {
  const { camera, scene } = useThree();
  
  // 加载 HDR 环境贴图
  const hdrTexture = useEnvironment({ files: '/little_paris_eiffel_tower_1k.hdr' });

  // 设置环境贴图
  useEffect(() => {
    if (hdrTexture) {
      scene.environment = hdrTexture;
      scene.background = new THREE.Color(0x000000);
      console.log('✅ Environment map loaded successfully!');
    }
  }, [hdrTexture, scene]);

  return (
    <>
      {hdrTexture && (
        <ControlledBubble
          envMap={hdrTexture}
          camera={camera}
          size={size}
          deformationStrength={deformationStrength}
          refractionRatio={refractionRatio}
          reflectionStrength={reflectionStrength}
          edgeColor={edgeColor}
          rainbowIntensity={rainbowIntensity}
        />
      )}
      
      {/* 方向光 */}
      <directionalLight position={[-2, 2, 3]} intensity={2.5} />
      <ambientLight intensity={0.3} />
    </>
  );
}

export default function EditorPage() {
  // 控制参数状态
  const [size, setSize] = useState(1.0);
  const [deformationStrength, setDeformationStrength] = useState(0.5);
  const [refractionRatio, setRefractionRatio] = useState(1.33);
  const [reflectionStrength, setReflectionStrength] = useState(1.0);
  const [edgeColor, setEdgeColor] = useState<[number, number, number]>([1, 1, 1]);
  const [rainbowIntensity, setRainbowIntensity] = useState(0.0);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 控制面板 */}
      <ControlPanel
        size={size}
        deformationStrength={deformationStrength}
        refractionRatio={refractionRatio}
        reflectionStrength={reflectionStrength}
        edgeColor={edgeColor}
        rainbowIntensity={rainbowIntensity}
        onSizeChange={setSize}
        onDeformationChange={setDeformationStrength}
        onRefractionChange={setRefractionRatio}
        onReflectionChange={setReflectionStrength}
        onEdgeColorChange={setEdgeColor}
        onRainbowIntensityChange={setRainbowIntensity}
      />

      {/* 3D 画布 */}
      <Canvas
        camera={{
          position: [0, 0, 5],
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
          <BubbleScene
            size={size}
            deformationStrength={deformationStrength}
            refractionRatio={refractionRatio}
            reflectionStrength={reflectionStrength}
            edgeColor={edgeColor}
            rainbowIntensity={rainbowIntensity}
          />
        </Suspense>
      </Canvas>

      {/* 导航按钮 */}
      <div className="fixed left-6 top-6 flex gap-3 z-40">
        <a
          href="/"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all text-sm font-medium"
        >
          ← 返回
        </a>
        <a
          href="/physical"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all text-sm font-medium"
        >
          物理材质气泡
        </a>
      </div>
    </div>
  );
}

