'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import DOFControls from '@/components/DOFControls';
import GlassInput from '@/components/GlassInput';

// 动态导入 BubbleScene，禁用 SSR
const BubbleScene = dynamic(() => import('@/components/BubbleScene'), {
  ssr: false,
  loading: () => (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-lg z-10">
      Loading environment map...
    </div>
  ),
});

export default function Home() {
  const [focus, setFocus] = useState(10.0);
  const [aperture, setAperture] = useState(0.0001);
  const [maxBlur, setMaxBlur] = useState(0.01);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 输出设备信息到控制台
    const isMobile = window.innerWidth < 768;
    console.log(
      '%c🎈 Rising Bubbles Animation with DOF',
      'color: #00d9ff; font-size: 20px; font-weight: bold;'
    );
    console.log('%cBubble count: 15', 'color: #a855f7; font-size: 14px;');
    console.log('%cSize range: 0.15 - 0.6', 'color: #a855f7; font-size: 14px;');
    console.log(
      '%cZ-axis range: -12 to 12 (with motion)',
      'color: #a855f7; font-size: 14px;'
    );
    console.log(
      '%cCamera Z: 10 | Focus range: 0-25',
      'color: #a855f7; font-size: 14px;'
    );
    console.log(
      '%c📱 Device Info:',
      'color: #f59e0b; font-size: 14px; font-weight: bold;'
    );
    console.log(
      `%c  • Screen: ${window.innerWidth}x${window.innerHeight}`,
      'color: #10b981; font-size: 12px;'
    );
    console.log(
      `%c  • Device Type: ${isMobile ? 'Mobile' : 'Desktop'}`,
      'color: #10b981; font-size: 12px;'
    );
    console.log(
      `%c  • Pixel Ratio: ${window.devicePixelRatio}`,
      'color: #10b981; font-size: 12px;'
    );
    console.log(
      `%c  • Aperture Scale: ${isMobile ? '1.5x' : '1.0x'}`,
      'color: #10b981; font-size: 12px;'
    );
  }, []);

  if (!mounted) return null;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Three.js 场景 */}
      <BubbleScene focus={focus} aperture={aperture} maxBlur={maxBlur} />

      {/* 磨砂玻璃输入框 */}
      <GlassInput />

      {/* 景深控制面板 */}
      <DOFControls
        onFocusChange={setFocus}
        onApertureChange={setAperture}
        onMaxBlurChange={setMaxBlur}
      />

      {/* 导航按钮 */}
      <div className="fixed left-6 top-6 flex gap-3 z-40">
        <a
          href="/editor"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all text-sm font-medium"
        >
          气泡编辑器
        </a>
        <a
          href="/physical"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all text-sm font-medium"
        >
          物理材质气泡
        </a>
      </div>
    </main>
  );
}
