'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useEnvironment, OrbitControls } from '@react-three/drei';
import PhysicalBubble from '@/components/PhysicalBubble';
import PhysicalControlPanel from '@/components/PhysicalControlPanel';

interface BubbleSceneProps {
  filmThickness: number;
  refractiveIndexFilm: number;
  refractiveIndexBase: number;
  boost: number;
  deformationStrength: number;
  edgeGlowColor: [number, number, number];
  edgeIntensity: number;
  bubbleIOR: number;
  transparency: number;
  bubbleThickness: number;
  useReflectionTint: boolean;
  useClearcoatTint: boolean;
  useDirectOverlay: boolean;
}

function BubbleScene({
  filmThickness,
  refractiveIndexFilm,
  refractiveIndexBase,
  boost,
  deformationStrength,
  edgeGlowColor,
  edgeIntensity,
  bubbleIOR,
  transparency,
  bubbleThickness,
  useReflectionTint,
  useClearcoatTint,
  useDirectOverlay,
}: BubbleSceneProps) {
  const { scene } = useThree();
  
  // 加载 HDR 环境贴图
  const hdrTexture = useEnvironment({ files: '/JCI54551673495.hdr' });

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
        <PhysicalBubble
          envMap={hdrTexture}
          filmThickness={filmThickness}
          refractiveIndexFilm={refractiveIndexFilm}
          refractiveIndexBase={refractiveIndexBase}
          boost={boost}
          deformationStrength={deformationStrength}
          edgeGlowColor={edgeGlowColor}
          edgeIntensity={edgeIntensity}
          bubbleIOR={bubbleIOR}
          transparency={transparency}
          bubbleThickness={bubbleThickness}
          useReflectionTint={useReflectionTint}
          useClearcoatTint={useClearcoatTint}
          useDirectOverlay={useDirectOverlay}
        />
      )}
      
      <OrbitControls enableDamping dampingFactor={0.05} />
      
      {/* 方向光 */}
      <directionalLight position={[-2, 2, 3]} intensity={2.5} />
      <ambientLight intensity={0.3} />
    </>
  );
}

export default function PhysicalPage() {
  // 薄膜参数状态
  const [filmThickness, setFilmThickness] = useState(380);
  const [refractiveIndexFilm, setRefractiveIndexFilm] = useState(2.0);
  const [refractiveIndexBase, setRefractiveIndexBase] = useState(3.0);
  const [boost, setBoost] = useState(8.0);
  const [deformationStrength, setDeformationStrength] = useState(0.0);
  const [edgeGlowColor, setEdgeGlowColor] = useState<[number, number, number]>([1.0, 0.5, 0.1]); // 默认橙色
  const [edgeIntensity, setEdgeIntensity] = useState(1.0);
  
  // 球体物理参数状态
  const [bubbleIOR, setBubbleIOR] = useState(1.33);
  const [transparency, setTransparency] = useState(0.95);
  const [bubbleThickness, setBubbleThickness] = useState(0.5);
  
  // 3种边缘颜色模式开关
  const [useReflectionTint, setUseReflectionTint] = useState(true); // 默认启用反射染色
  const [useClearcoatTint, setUseClearcoatTint] = useState(false);
  const [useDirectOverlay, setUseDirectOverlay] = useState(false);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 控制面板 */}
      <PhysicalControlPanel
        filmThickness={filmThickness}
        refractiveIndexFilm={refractiveIndexFilm}
        refractiveIndexBase={refractiveIndexBase}
        boost={boost}
        deformationStrength={deformationStrength}
        edgeGlowColor={edgeGlowColor}
        edgeIntensity={edgeIntensity}
        bubbleIOR={bubbleIOR}
        transparency={transparency}
        bubbleThickness={bubbleThickness}
        useReflectionTint={useReflectionTint}
        useClearcoatTint={useClearcoatTint}
        useDirectOverlay={useDirectOverlay}
        onFilmThicknessChange={setFilmThickness}
        onRefractiveIndexFilmChange={setRefractiveIndexFilm}
        onRefractiveIndexBaseChange={setRefractiveIndexBase}
        onBoostChange={setBoost}
        onDeformationStrengthChange={setDeformationStrength}
        onEdgeGlowColorChange={setEdgeGlowColor}
        onEdgeIntensityChange={setEdgeIntensity}
        onBubbleIORChange={setBubbleIOR}
        onTransparencyChange={setTransparency}
        onBubbleThicknessChange={setBubbleThickness}
        onReflectionTintToggle={setUseReflectionTint}
        onClearcoatTintToggle={setUseClearcoatTint}
        onDirectOverlayToggle={setUseDirectOverlay}
      />

      {/* 3D 画布 */}
      <Canvas
        camera={{
          position: [0, 0, 8],
          fov: 60,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
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
            filmThickness={filmThickness}
            refractiveIndexFilm={refractiveIndexFilm}
            refractiveIndexBase={refractiveIndexBase}
            boost={boost}
            deformationStrength={deformationStrength}
            edgeGlowColor={edgeGlowColor}
            edgeIntensity={edgeIntensity}
            bubbleIOR={bubbleIOR}
            transparency={transparency}
            bubbleThickness={bubbleThickness}
            useReflectionTint={useReflectionTint}
            useClearcoatTint={useClearcoatTint}
            useDirectOverlay={useDirectOverlay}
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
          href="/editor"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all text-sm font-medium"
        >
          气泡编辑器
        </a>
      </div>
    </div>
  );
}

