'use client';

import { useState, useMemo, type ReactNode } from 'react';

interface PhysicalControlPanelProps {
  // 薄膜参数
  filmThickness: number;
  refractiveIndexFilm: number;
  refractiveIndexBase: number;
  boost: number;
  deformationStrength: number;
  edgeGlowColor: [number, number, number];
  edgeIntensity: number;
  // 球体物理参数
  bubbleIOR: number;
  transparency: number;
  bubbleThickness: number;
  // 3种边缘颜色模式开关
  useReflectionTint: boolean;
  useClearcoatTint: boolean;
  useDirectOverlay: boolean;
  onFilmThicknessChange: (value: number) => void;
  onRefractiveIndexFilmChange: (value: number) => void;
  onRefractiveIndexBaseChange: (value: number) => void;
  onBoostChange: (value: number) => void;
  onDeformationStrengthChange: (value: number) => void;
  onEdgeGlowColorChange: (color: [number, number, number]) => void;
  onEdgeIntensityChange: (value: number) => void;
  onBubbleIORChange: (value: number) => void;
  onTransparencyChange: (value: number) => void;
  onBubbleThicknessChange: (value: number) => void;
  onReflectionTintToggle: (value: boolean) => void;
  onClearcoatTintToggle: (value: boolean) => void;
  onDirectOverlayToggle: (value: boolean) => void;
}

export default function PhysicalControlPanel({
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
  onFilmThicknessChange,
  onRefractiveIndexFilmChange,
  onRefractiveIndexBaseChange,
  onBoostChange,
  onDeformationStrengthChange,
  onEdgeGlowColorChange,
  onEdgeIntensityChange,
  onBubbleIORChange,
  onTransparencyChange,
  onBubbleThicknessChange,
  onReflectionTintToggle,
  onClearcoatTintToggle,
  onDirectOverlayToggle,
}: PhysicalControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const rgbToHex = (rgb: [number, number, number]) => {
    const toHex = (value: number) => Math.round(value * 255).toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ]
      : [1, 0.5, 0.1];
  };

  const previewHex = useMemo(() => rgbToHex(edgeGlowColor), [edgeGlowColor]);

  if (!isExpanded) {
    return (
      <div className="fixed right-6 top-6 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 rounded-2xl bg-black/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-xl transition hover:bg-black/90"
        >
          <span className="text-lg">🫧</span>
          打开控制面板
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-6 top-6 z-50">
      <div
        className="relative w-[380px] overflow-hidden rounded-[26px] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
        style={{
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(24px)',
          color: '#ffffff',
        }}
      >
        <header className="border-b border-white/10 px-7 py-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">🫧</span>
                <h2 className="text-xl font-semibold text-white">物理材质气泡</h2>
              </div>
              <p className="text-xs text-white/60">MeshPhysicalMaterial + 薄膜干涉</p>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              aria-label="关闭面板"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 2l14 14m0-14L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div className="custom-scroll space-y-5 px-7 py-6 text-sm">
          <ControlBlock title="形变强度 (Deformation)" value={deformationStrength.toFixed(2)}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={deformationStrength}
              onChange={(event) => onDeformationStrengthChange(parseFloat(event.target.value))}
              className="slider"
            />
            <p className="mt-2 text-xs text-white/50">越高越柔软，表面更具律动感</p>
          </ControlBlock>

          <ControlBlock title="薄膜厚度 (nm)" value={filmThickness.toFixed(0)}>
            <input
              type="range"
              min="100"
              max="1000"
              step="10"
              value={filmThickness}
              onChange={(event) => onFilmThicknessChange(parseFloat(event.target.value))}
              className="slider"
            />
            <p className="mt-2 text-xs text-white/50">影响彩虹色变化（纳米）</p>
          </ControlBlock>

          <ControlBlock title="薄膜折射率" value={refractiveIndexFilm.toFixed(2)}>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={refractiveIndexFilm}
              onChange={(event) => onRefractiveIndexFilmChange(parseFloat(event.target.value))}
              className="slider"
            />
            <p className="mt-2 text-xs text-white/50">薄膜层的折射率</p>
          </ControlBlock>

          <ControlBlock title="基底折射率" value={refractiveIndexBase.toFixed(2)}>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={refractiveIndexBase}
              onChange={(event) => onRefractiveIndexBaseChange(parseFloat(event.target.value))}
              className="slider"
            />
            <p className="mt-2 text-xs text-white/50">基底材质的折射率</p>
          </ControlBlock>

          <ControlBlock title="薄膜效果增强" value={boost.toFixed(1)}>
            <input
              type="range"
              min="1"
              max="50"
              step="0.5"
              value={boost}
              onChange={(event) => onBoostChange(parseFloat(event.target.value))}
              className="slider"
            />
            <p className="mt-2 text-xs text-white/50">放大薄膜彩虹效果</p>
          </ControlBlock>

          <ControlBlock title="球体折射率 (IOR)" value={bubbleIOR.toFixed(2)}>
            <input
              type="range"
              min="1.0"
              max="2.0"
              step="0.01"
              value={bubbleIOR}
              onChange={(event) => onBubbleIORChange(parseFloat(event.target.value))}
              className="slider"
            />
            <div className="mt-2 flex justify-between text-xs text-white/50">
              <span>💧 水 1.33</span>
              <span>🪟 玻璃 1.50</span>
            </div>
          </ControlBlock>

          <ControlBlock title="透明度" value={transparency.toFixed(2)}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={transparency}
              onChange={(event) => onTransparencyChange(parseFloat(event.target.value))}
              className="slider"
            />
            <p className="mt-2 text-xs text-white/50">控制气泡的透明程度</p>
          </ControlBlock>

          <ControlBlock title="球体厚度" value={bubbleThickness.toFixed(2)}>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={bubbleThickness}
              onChange={(event) => onBubbleThicknessChange(parseFloat(event.target.value))}
              className="slider"
            />
            <p className="mt-2 text-xs text-white/50">影响折射光线的衰减</p>
          </ControlBlock>

          <ControlBlock title="边缘光晕颜色" value={previewHex}>
            <div className="flex items-center gap-4">
              <label className="relative inline-flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/10 transition hover:border-white/40">
                <span className="sr-only">选择颜色</span>
                <input
                  type="color"
                  value={previewHex}
                  onChange={(event) => onEdgeGlowColorChange(hexToRgb(event.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer rounded-xl border-none bg-transparent p-0 opacity-0"
                />
                <span
                  className="h-[70%] w-[70%] rounded-lg shadow-lg"
                  style={{ backgroundColor: previewHex }}
                />
              </label>
              <div className="flex flex-1 items-center justify-between rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                <div className="space-y-1">
                  <span className="block text-[11px] uppercase tracking-wide text-white/60">Hex</span>
                  <span className="font-mono text-sm text-white">{previewHex}</span>
                </div>
                <div className="space-y-1 text-right text-[11px] text-white/70">
                  <p>R {Math.round(edgeGlowColor[0] * 255)}</p>
                  <p>G {Math.round(edgeGlowColor[1] * 255)}</p>
                  <p>B {Math.round(edgeGlowColor[2] * 255)}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onEdgeGlowColorChange([0.0, 1.0, 0.78])}
                className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-white transition hover:bg-white/20"
                style={{ borderLeftWidth: '4px', borderLeftColor: '#00FFC8' }}
              >
                青色
              </button>
              <button
                onClick={() => onEdgeGlowColorChange([1.0, 0.39, 0.2])}
                className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-white transition hover:bg-white/20"
                style={{ borderLeftWidth: '4px', borderLeftColor: '#FF6432' }}
              >
                橙红
              </button>
              <button
                onClick={() => onEdgeGlowColorChange([1.0, 0.5, 0.1])}
                className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-white transition hover:bg-white/20"
                style={{ borderLeftWidth: '4px', borderLeftColor: '#FF8019' }}
              >
                橙色
              </button>
            </div>
          </ControlBlock>

          <ControlBlock title="边缘光晕强度" value={edgeIntensity.toFixed(2)}>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={edgeIntensity}
              onChange={(event) => onEdgeIntensityChange(parseFloat(event.target.value))}
              className="slider"
            />
            <p className="mt-2 text-xs text-white/50">控制边缘光晕的亮度</p>
          </ControlBlock>

          {/* 边缘颜色效果模式 */}
          <div className="rounded-2xl border border-white/20 bg-white/5 px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">边缘颜色效果模式</h3>
              <span className="text-xs text-purple-300">
                {[useReflectionTint, useClearcoatTint, useDirectOverlay].filter(Boolean).length}/3 已启用
              </span>
            </div>
            <div className="space-y-2">
              <ModeToggle
                label="反射染色"
                description="镜面反射染色（艺术化）"
                enabled={useReflectionTint}
                onToggle={onReflectionTintToggle}
              />
              <ModeToggle
                label="清漆层染色"
                description="额外高光层染色"
                enabled={useClearcoatTint}
                onToggle={onClearcoatTintToggle}
              />
              <ModeToggle
                label="直接叠加"
                description="简单颜色叠加（对比用）"
                enabled={useDirectOverlay}
                onToggle={onDirectOverlayToggle}
              />
            </div>
          </div>
        </div>

        <footer className="border-t border-white/10 px-7 py-5">
          <div className="grid grid-cols-2 gap-3">
            <PresetButton
              label="橙色气泡"
              colors={['#ff8019', '#ff6432']}
              onClick={() => {
                onDeformationStrengthChange(0.0);
                onFilmThicknessChange(380);
                onRefractiveIndexFilmChange(2.0);
                onRefractiveIndexBaseChange(3.0);
                onBoostChange(8.0);
                onBubbleIORChange(1.33);
                onTransparencyChange(0.95);
                onBubbleThicknessChange(0.5);
                onEdgeGlowColorChange([1.0, 0.5, 0.1]);
                onEdgeIntensityChange(1.0);
                onReflectionTintToggle(true);
                onClearcoatTintToggle(false);
                onDirectOverlayToggle(false);
              }}
            />
            <PresetButton
              label="青色气泡"
              colors={['#00ffc8', '#40e0d0']}
              onClick={() => {
                onDeformationStrengthChange(0.0);
                onFilmThicknessChange(380);
                onRefractiveIndexFilmChange(2.0);
                onRefractiveIndexBaseChange(3.0);
                onBoostChange(8.0);
                onBubbleIORChange(1.33);
                onTransparencyChange(0.95);
                onBubbleThicknessChange(0.5);
                onEdgeGlowColorChange([0.0, 1.0, 0.78]);
                onEdgeIntensityChange(1.0);
                onReflectionTintToggle(true);
                onClearcoatTintToggle(false);
                onDirectOverlayToggle(false);
              }}
            />
            <PresetButton
              label="薄膜气泡"
              colors={['#10b981', '#84cc16']}
              onClick={() => {
                onDeformationStrengthChange(0.5);
                onFilmThicknessChange(200);
                onRefractiveIndexFilmChange(2.0);
                onRefractiveIndexBaseChange(3.0);
                onBoostChange(15.0);
                onBubbleIORChange(1.33);
                onTransparencyChange(1.0);
                onBubbleThicknessChange(0.3);
                onEdgeGlowColorChange([1.0, 0.39, 0.2]);
                onEdgeIntensityChange(1.5);
                onReflectionTintToggle(true);
                onClearcoatTintToggle(true);
                onDirectOverlayToggle(false);
              }}
            />
            <PresetButton
              label="水晶球"
              colors={['#06b6d4', '#8b5cf6']}
              onClick={() => {
                onDeformationStrengthChange(0.0);
                onFilmThicknessChange(600);
                onRefractiveIndexFilmChange(1.5);
                onRefractiveIndexBaseChange(2.5);
                onBoostChange(3.0);
                onBubbleIORChange(1.5);
                onTransparencyChange(0.7);
                onBubbleThicknessChange(1.5);
                onEdgeGlowColorChange([0.5, 0.7, 1.0]);
                onEdgeIntensityChange(0.5);
                onReflectionTintToggle(false);
                onClearcoatTintToggle(true);
                onDirectOverlayToggle(false);
              }}
            />
          </div>
        </footer>

        <style jsx>{`
          .custom-scroll {
            max-height: 70vh;
            overflow-y: auto;
          }
          .custom-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.35);
            border-radius: 999px;
          }
          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(79, 70, 229, 0.5);
          }
          .slider {
            width: 100%;
            height: 6px;
            appearance: none;
            border-radius: 999px;
            background: linear-gradient(90deg, #60a5fa 0%, #6366f1 50%, #a855f7 100%);
            outline: none;
          }
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 3px solid #fff;
            background: radial-gradient(circle at 30% 30%, #ffffff 0%, #c7d2fe 50%, #4338ca 100%);
            box-shadow: 0 8px 16px rgba(99, 102, 241, 0.25);
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          .slider::-webkit-slider-thumb:hover {
            transform: scale(1.08);
          }
          .slider::-moz-range-track {
            height: 6px;
            border-radius: 999px;
            background: linear-gradient(90deg, #60a5fa 0%, #6366f1 50%, #a855f7 100%);
          }
          .slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 3px solid #fff;
            background: radial-gradient(circle at 30% 30%, #ffffff 0%, #c7d2fe 50%, #4338ca 100%);
            box-shadow: 0 8px 16px rgba(99, 102, 241, 0.25);
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          .slider::-moz-range-thumb:hover {
            transform: scale(1.08);
          }
        `}</style>
      </div>
    </div>
  );
}

interface ControlBlockProps {
  title: string;
  value: string;
  children: ReactNode;
}

function ControlBlock({ title, value, children }: ControlBlockProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-base font-medium text-white">{title}</div>
        <span className="font-mono text-lg font-semibold text-purple-300">{value}</span>
      </div>
      <div>{children}</div>
    </section>
  );
}

interface PresetButtonProps {
  label: string;
  colors: [string, string];
  onClick: () => void;
}

function PresetButton({ label, colors, onClick }: PresetButtonProps) {
  const [start, end] = colors;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-11 items-center justify-center overflow-hidden rounded-2xl text-base font-medium text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
      style={{
        background: `linear-gradient(135deg, ${start}, ${end})`,
      }}
    >
      <span className="relative z-10">{label}</span>
      <div className="absolute inset-0 bg-white/0 transition-all group-hover:bg-white/10" />
    </button>
  );
}

interface ModeToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

function ModeToggle({ label, description, enabled, onToggle }: ModeToggleProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition hover:border-white/20 hover:bg-white/10">
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-white/50">{description}</div>
      </div>
      <div className="relative">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="peer sr-only"
        />
        <div className="h-6 w-11 rounded-full bg-white/20 transition peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition peer-checked:translate-x-5"></div>
      </div>
    </label>
  );
}

