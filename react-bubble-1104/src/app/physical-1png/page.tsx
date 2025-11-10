'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import PhysicalBubble from '@/components/PhysicalBubble';
import PhysicalControlPanel from '@/components/PhysicalControlPanel';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function PhysicalOnePngPage() {
  const [envMap, setEnvMap] = useState<THREE.Texture | null>(null);

  // 形变与薄膜/物理参数（初始化为较稳定的默认值）
  // 默认参数（对齐面板期望的初始展示）
  const [deformationStrength, setDeformationStrength] = useState(0.70);
  const [filmThickness, setFilmThickness] = useState(490); // nm
  const [refractiveIndexFilm, setRefractiveIndexFilm] = useState(4.10);
  const [refractiveIndexBase, setRefractiveIndexBase] = useState(3.00);
  const [boost, setBoost] = useState(19.5);

  // 球体物理参数
  const [bubbleIOR, setBubbleIOR] = useState(1.33); // 折射率
  const [transparency, setTransparency] = useState(0.95);
  const [bubbleThickness, setBubbleThickness] = useState(0.50);
  const [bubbleScale, setBubbleScale] = useState(1.11);

  // 边缘颜色与模式
  const [edgeGlowColor, setEdgeGlowColor] = useState<[number, number, number]>([1.0, 0.5, 0.1]);
  const [edgeIntensity, setEdgeIntensity] = useState(0.0);
  const [useReflectionTint, setUseReflectionTint] = useState(false);
  const [useClearcoatTint, setUseClearcoatTint] = useState(false);
  const [useDirectOverlay, setUseDirectOverlay] = useState(false);

  // 加载 1.png 作为环境“贴图”（普通2D纹理用于等距采样函数）
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      '/4.png',
      (tex) => {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        // three@r152+ 使用 colorSpace 而非 encoding
        // 旧: tex.encoding = THREE.sRGBEncoding;
        // 新:
        // @ts-ignore - 兼容不同 three 版本的类型定义
        tex.colorSpace = (THREE as any).SRGBColorSpace ?? (THREE as any).sRGBEncoding ?? undefined;
        setEnvMap(tex);
      },
      undefined,
      () => {
        console.warn('Failed to load /1.png as environment texture.');
      }
    );
  }, []);

  return (
    <main className="relative w-screen h-screen bg-black">
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
        bubbleScale={bubbleScale}
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
        onBubbleScaleChange={setBubbleScale}
        onReflectionTintToggle={setUseReflectionTint}
        onClearcoatTintToggle={setUseClearcoatTint}
        onDirectOverlayToggle={setUseDirectOverlay}
      />

      {/* 3D 画布 */}
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: true }}
        dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
        }}
      >
        {/* 环境光与定向光 */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[2, 3, 4]} intensity={2.0} />
        {/* 镜头旋转/缩放控制 */}
        <OrbitControls enableDamping dampingFactor={0.08} enablePan={false} />

        {/* 物理材质气泡（透明） */}
        {envMap && (
          <PhysicalBubble
            envMap={envMap}
            filmThickness={filmThickness}
            refractiveIndexFilm={refractiveIndexFilm}
            refractiveIndexBase={refractiveIndexBase}
            boost={boost}
            deformationStrength={deformationStrength}
            edgeGlowColor={edgeGlowColor}
            edgeIntensity={edgeIntensity}
            useReflectionTint={useReflectionTint}
            useClearcoatTint={useClearcoatTint}
            useDirectOverlay={useDirectOverlay}
            bubbleIOR={bubbleIOR}
            transparency={transparency}
            bubbleThickness={bubbleThickness}
            bubbleScale={bubbleScale}
          />
        )}
      </Canvas>

      {/* 返回按钮 */}
      <div className="fixed left-6 top-6 z-40">
        <a
          href="/"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all text-sm font-medium"
        >
          ← 返回
        </a>
      </div>
    </main>
  );
}


