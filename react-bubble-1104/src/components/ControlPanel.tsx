'use client';

import { useMemo, useState, type ReactNode } from 'react';

interface ControlPanelProps {
  size: number;
  deformationStrength: number;
  refractionRatio: number;
  reflectionStrength: number;
  edgeColor: [number, number, number];
  rainbowIntensity: number;
  onSizeChange: (value: number) => void;
  onDeformationChange: (value: number) => void;
  onRefractionChange: (value: number) => void;
  onReflectionChange: (value: number) => void;
  onEdgeColorChange: (color: [number, number, number]) => void;
  onRainbowIntensityChange: (value: number) => void;
}

export default function ControlPanel({
  size,
  deformationStrength,
  refractionRatio,
  reflectionStrength,
  edgeColor,
  rainbowIntensity,
  onSizeChange,
  onDeformationChange,
  onRefractionChange,
  onReflectionChange,
  onEdgeColorChange,
  onRainbowIntensityChange,
}: ControlPanelProps) {
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
      : [1, 1, 1];
  };

  const previewHex = useMemo(() => rgbToHex(edgeColor), [edgeColor]);

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
                <span className="text-xl">📷</span>
                <h2 className="text-xl font-semibold text-white">景深控制器</h2>
              </div>
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
          <ControlBlock
            title="大小"
            value={size.toFixed(2)}
          >
          <input
            type="range"
            min="0.1"
              max="2"
            step="0.01"
            value={size}
              onChange={(event) => onSizeChange(parseFloat(event.target.value))}
              className="slider"
          />
          </ControlBlock>

          <ControlBlock
            title="形变强度"
            value={deformationStrength.toFixed(2)}
          >
          <input
            type="range"
              min="0"
              max="1"
            step="0.01"
            value={deformationStrength}
              onChange={(event) => onDeformationChange(parseFloat(event.target.value))}
              className="slider"
          />
          </ControlBlock>

          <ControlBlock
            title="折射率"
            value={refractionRatio.toFixed(2)}
          >
          <input
            type="range"
              min="1"
              max="2"
            step="0.01"
            value={refractionRatio}
              onChange={(event) => onRefractionChange(parseFloat(event.target.value))}
              className="slider"
          />
          </ControlBlock>

          <ControlBlock
            title="反射强度"
            value={reflectionStrength.toFixed(2)}
          >
          <input
            type="range"
              min="0"
              max="2"
            step="0.01"
            value={reflectionStrength}
              onChange={(event) => onReflectionChange(parseFloat(event.target.value))}
              className="slider"
            />
          </ControlBlock>

          <ControlBlock
            title="边缘颜色"
            value={previewHex}
          >
            <div className="flex items-center gap-4">
              <label className="relative inline-flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/10 transition hover:border-white/40">
                <span className="sr-only">选择颜色</span>
              <input
                type="color"
                  value={previewHex}
                  onChange={(event) => onEdgeColorChange(hexToRgb(event.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer rounded-xl border-none bg-transparent p-0 opacity-0"
                />
                <span
                  className="h-[70%] w-[70%] rounded-lg"
                  style={{ backgroundColor: previewHex }}
                />
              </label>
              <div className="flex flex-1 items-center justify-between rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                <div className="space-y-1">
                  <span className="block text-[11px] uppercase tracking-wide text-white/60">Hex</span>
                  <span className="font-mono text-sm text-white">{previewHex}</span>
            </div>
                <div className="space-y-1 text-right text-[11px] text-white/70">
                  <p>R {Math.round(edgeColor[0] * 255)}</p>
                  <p>G {Math.round(edgeColor[1] * 255)}</p>
                  <p>B {Math.round(edgeColor[2] * 255)}</p>
              </div>
              </div>
            </div>
          </ControlBlock>

          <ControlBlock
            title="彩虹边缘强度"
            value={rainbowIntensity.toFixed(2)}
          >
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={rainbowIntensity}
              onChange={(event) => onRainbowIntensityChange(parseFloat(event.target.value))}
              className="slider"
            />
            <p className="mt-2 text-xs text-white/50">🌈 程序化彩虹光晕效果</p>
          </ControlBlock>
      </div>

        <footer className="border-t border-white/10 px-7 py-5">
          <div className="grid grid-cols-2 gap-3">
            <PresetButton
              label="粉色气泡"
              colors={['#a855f7', '#ec4899']}
          onClick={() => {
                onSizeChange(0.85);
                onDeformationChange(0.45);
            onRefractionChange(1.33);
                onReflectionChange(1.1);
                onEdgeColorChange([1, 0.6, 0.85]);
          }}
            />
            <PresetButton
              label="通透玻璃"
              colors={['#6366f1', '#3b82f6']}
          onClick={() => {
                onSizeChange(1.15);
            onDeformationChange(0.2);
                onRefractionChange(1.48);
                onReflectionChange(1.6);
                onEdgeColorChange([0.65, 0.85, 1]);
          }}
            />
            <PresetButton
              label="清新果冻"
              colors={['#10b981', '#84cc16']}
          onClick={() => {
                onSizeChange(0.65);
                onDeformationChange(0.75);
                onRefractionChange(1.32);
                onReflectionChange(0.85);
                onEdgeColorChange([0.75, 1, 0.6]);
          }}
            />
            <PresetButton
              label="恢复默认"
              colors={['#6366f1', '#8b5cf6']}
          onClick={() => {
                onSizeChange(1);
            onDeformationChange(0.5);
            onRefractionChange(1.33);
                onReflectionChange(1);
            onEdgeColorChange([1, 1, 1]);
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
        <span className="font-mono text-lg font-semibold text-purple-300">
          {value}
        </span>
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

