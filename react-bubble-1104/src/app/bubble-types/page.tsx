'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import SingleBubbleScene from '@/components/SingleBubbleScene';
import BubbleControlPanel, { BubbleParams } from '@/components/BubbleControlPanel';

// 动态导入 SingleBubbleScene，禁用 SSR
const DynamicSingleBubbleScene = dynamic(() => import('@/components/SingleBubbleScene'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-white text-lg">
      Loading bubble...
    </div>
  ),
});

// 生成随机纹理索引（只支持 1 或 4）
const getRandomTextureIndex = () => Math.random() < 0.5 ? 1 : 4;

// 默认参数
const getDefaultParams = (textureIndex: number): BubbleParams => ({
  speed: 10,
  size: 0.4,
  waveAmplitude: 0.20,
  waveSpeed: 4.3,
  distortion: 0.05,
  subdivision: 128,
  textureIndex: textureIndex,
});

export default function BubbleTypesPage() {
  const [mounted, setMounted] = useState(false);
  
  // 初始化5个气泡的参数，每个气泡随机分配纹理
  const [bubbles, setBubbles] = useState<BubbleParams[]>(() => 
    Array.from({ length: 5 }, () => getDefaultParams(getRandomTextureIndex()))
  );

  // 全局景深参数（所有气泡共享）
  const [focus, setFocus] = useState(10.0);
  const [aperture, setAperture] = useState(0.0001);
  const [maxBlur, setMaxBlur] = useState(0.01);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBubbleParamsChange = (index: number, params: BubbleParams) => {
    setBubbles((prev) => {
      const newBubbles = [...prev];
      newBubbles[index] = params;
      return newBubbles;
    });
  };

  if (!mounted) return null;

  return (
    <main className="relative w-full min-h-screen bg-black">
      {/* 导航按钮 */}
      <div className="fixed left-6 top-6 flex gap-3 z-40">
        <a
          href="/"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all text-sm font-medium"
        >
          ← 返回
        </a>
      </div>

      {/* 全局景深控制（可选，放在右上角） */}
      <div 
        className="fixed right-6 top-6 z-40 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30"
        style={{ color: 'white' }}
      >
        <h3 style={{ color: 'white' }} className="text-sm font-semibold mb-2">全局景深</h3>
        <div className="space-y-2">
          <div>
            <label style={{ color: 'white' }} className="text-xs">Focus</label>
            <input
              type="range"
              min="0"
              max="25"
              step="0.5"
              value={focus}
              onChange={(e) => setFocus(parseFloat(e.target.value))}
              className="w-full"
            />
            <span style={{ color: 'white' }} className="text-xs">{focus.toFixed(1)}</span>
          </div>
          <div>
            <label style={{ color: 'white' }} className="text-xs">Aperture</label>
            <input
              type="range"
              min="0.00001"
              max="0.005"
              step="0.00001"
              value={aperture}
              onChange={(e) => setAperture(parseFloat(e.target.value))}
              className="w-full"
            />
            <span style={{ color: 'white' }} className="text-xs">{aperture.toFixed(5)}</span>
          </div>
          <div>
            <label style={{ color: 'white' }} className="text-xs">Max Blur</label>
            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.001"
              value={maxBlur}
              onChange={(e) => setMaxBlur(parseFloat(e.target.value))}
              className="w-full"
            />
            <span style={{ color: 'white' }} className="text-xs">{maxBlur.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {/* 气泡列表 - 横向排列 */}
      <div className="pt-20 pb-10 px-4">
        <div className="flex gap-4 w-full overflow-x-auto">
          {bubbles.map((bubbleParams, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{
                width: 'calc(20% - 16px)',
                minWidth: '300px',
              }}
            >
              {/* 气泡 Canvas */}
              <div
                className="w-full rounded-lg overflow-hidden border border-purple-500/30 mb-4"
                style={{
                  height: '400px',
                  background: 'rgba(0, 0, 0, 0.3)',
                }}
              >
                <DynamicSingleBubbleScene
                  focus={focus}
                  aperture={aperture}
                  maxBlur={maxBlur}
                  bubbleSpeed={bubbleParams.speed}
                  bubbleSize={bubbleParams.size}
                  waveAmplitude={bubbleParams.waveAmplitude}
                  waveSpeed={bubbleParams.waveSpeed}
                  distortion={bubbleParams.distortion}
                  subdivision={bubbleParams.subdivision}
                  textureIndex={bubbleParams.textureIndex}
                  delay={index * 0.5} // 错开出现时间
                  speedMultiplier={1.0}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
              </div>

              {/* 控制面板 */}
              <div>
                <BubbleControlPanel
                  bubbleIndex={index}
                  params={bubbleParams}
                  onParamsChange={(params) => handleBubbleParamsChange(index, params)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

