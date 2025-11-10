'use client';

import { useState } from 'react';

export interface BubbleParams {
  speed: number;
  size: number;
  waveAmplitude: number;
  waveSpeed: number;
  distortion: number;
  subdivision: number;
  textureIndex: number; // 1 或 4
}

interface BubbleControlPanelProps {
  bubbleIndex: number;
  params: BubbleParams;
  onParamsChange: (params: BubbleParams) => void;
}

export default function BubbleControlPanel({
  bubbleIndex,
  params,
  onParamsChange,
}: BubbleControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleChange = (key: keyof BubbleParams, value: number) => {
    onParamsChange({
      ...params,
      [key]: value,
    });
  };

  const handleCopyParams = async () => {
    const paramsJson = JSON.stringify(params, null, 2);
    
    try {
      // 优先使用现代 Clipboard API
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(paramsJson);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        return;
      }
      
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea');
      textArea.value = paramsJson;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } else {
          throw new Error('execCommand 复制失败');
        }
      } catch (err) {
        console.error('复制失败:', err);
        // 如果都失败了，至少显示内容让用户手动复制
        alert(`复制失败，请手动复制以下内容：\n\n${paramsJson}`);
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('复制失败:', err);
      // 显示内容让用户手动复制
      alert(`复制失败，请手动复制以下内容：\n\n${paramsJson}`);
    }
  };

  return (
    <>
      <style>
        {`
          .bubble-control-panel::-webkit-scrollbar {
            width: 8px;
          }
          .bubble-control-panel::-webkit-scrollbar-track {
            background: rgba(139, 92, 246, 0.1);
            border-radius: 4px;
          }
          .bubble-control-panel::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.5);
            border-radius: 4px;
          }
          .bubble-control-panel::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.7);
          }
        `}
      </style>
      <div
        className="bubble-control-panel"
        style={{
          background: 'rgba(0, 0, 0, 0.85)',
          padding: isExpanded ? '20px' : '12px',
          borderRadius: '12px',
          color: 'white',
          width: '100%',
          maxHeight: '400px',
          overflowY: 'auto',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* 标题栏 */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            marginBottom: isExpanded ? '15px' : '0',
          }}
        >
          <h3
            style={{
              margin: 0,
              color: '#8b5cf6',
              fontSize: '16px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            🫧 气泡 {bubbleIndex + 1} {isExpanded ? `(纹理: ${params.textureIndex}.png)` : ''}
          </h3>
          <span
            style={{
              color: '#8b5cf6',
              fontSize: '14px',
              fontWeight: 'bold',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              display: 'inline-block',
              marginLeft: '8px',
            }}
          >
            ▼
          </span>
        </div>

        {/* 控制面板内容 */}
        {isExpanded && (
          <div
            style={{
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}
          >
            {/* 纹理索引 */}
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '12px',
                  color: '#aaa',
                }}
              >
                🎨 纹理索引
              </label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  onClick={() => handleChange('textureIndex', 1)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: params.textureIndex === 1 ? '#8b5cf6' : 'rgba(139, 92, 246, 0.2)',
                    color: 'white',
                    border: params.textureIndex === 1 ? '2px solid #8b5cf6' : '2px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (params.textureIndex !== 1) {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (params.textureIndex !== 1) {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                    }
                  }}
                >
                  1.png
                </button>
                <button
                  onClick={() => handleChange('textureIndex', 4)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: params.textureIndex === 4 ? '#8b5cf6' : 'rgba(139, 92, 246, 0.2)',
                    color: 'white',
                    border: params.textureIndex === 4 ? '2px solid #8b5cf6' : '2px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (params.textureIndex !== 4) {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (params.textureIndex !== 4) {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                    }
                  }}
                >
                  4.png
                </button>
              </div>
              <div style={{ marginTop: '8px', textAlign: 'center' }}>
                <span
                  style={{
                    color: '#8b5cf6',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  当前: {params.textureIndex}.png
                </span>
              </div>
            </div>

            {/* 气泡上升速度 */}
            <div style={{ marginBottom: '15px', borderTop: '1px solid rgba(139, 92, 246, 0.2)', paddingTop: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '12px',
                  color: '#aaa',
                }}
              >
                🎈 气泡上升速度
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={params.speed}
                onChange={(e) => handleChange('speed', parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ marginTop: '5px', textAlign: 'right' }}>
                <span
                  style={{
                    color: '#10b981',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  {params.speed.toFixed(0)} units/s
                </span>
              </div>
            </div>

            {/* 气泡尺寸倍数 */}
            <div style={{ marginBottom: '15px', borderTop: '1px solid rgba(139, 92, 246, 0.2)', paddingTop: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '12px',
                  color: '#aaa',
                }}
              >
                🫧 气泡尺寸
              </label>
              <input
                type="range"
                min="0.1"
                max="4.0"
                step="0.1"
                value={params.size}
                onChange={(e) => handleChange('size', parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ marginTop: '5px', textAlign: 'right' }}>
                <span
                  style={{
                    color: '#f59e0b',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  ×{params.size.toFixed(1)}
                </span>
              </div>
            </div>

            {/* 波浪强度 */}
            <div style={{ marginBottom: '15px', borderTop: '1px solid rgba(139, 92, 246, 0.2)', paddingTop: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '12px',
                  color: '#aaa',
                }}
              >
                🌊 波浪强度
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={params.waveAmplitude}
                onChange={(e) => handleChange('waveAmplitude', parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ marginTop: '5px', textAlign: 'right' }}>
                <span
                  style={{
                    color: '#3b82f6',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  {params.waveAmplitude.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 波浪速度 */}
            <div style={{ marginBottom: '15px', borderTop: '1px solid rgba(139, 92, 246, 0.2)', paddingTop: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '12px',
                  color: '#aaa',
                }}
              >
                ⚡ 波浪速度
              </label>
              <input
                type="range"
                min="0.0"
                max="10.0"
                step="0.1"
                value={params.waveSpeed}
                onChange={(e) => handleChange('waveSpeed', parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ marginTop: '5px', textAlign: 'right' }}>
                <span
                  style={{
                    color: '#06b6d4',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  {params.waveSpeed.toFixed(1)}
                </span>
              </div>
            </div>

            {/* 扭曲强度 */}
            <div style={{ marginBottom: '15px', borderTop: '1px solid rgba(139, 92, 246, 0.2)', paddingTop: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '12px',
                  color: '#aaa',
                }}
              >
                🌀 扭曲强度
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={params.distortion}
                onChange={(e) => handleChange('distortion', parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ marginTop: '5px', textAlign: 'right' }}>
                <span
                  style={{
                    color: '#ec4899',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  {params.distortion.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 顶点细分 */}
            <div style={{ marginBottom: '15px', borderTop: '1px solid rgba(139, 92, 246, 0.2)', paddingTop: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '12px',
                  color: '#aaa',
                }}
              >
                🔺 顶点细分
              </label>
              <input
                type="range"
                min="16"
                max="128"
                step="16"
                value={params.subdivision}
                onChange={(e) => handleChange('subdivision', parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ marginTop: '5px', textAlign: 'right' }}>
                <span
                  style={{
                    color: '#a855f7',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  {params.subdivision}
                </span>
              </div>
            </div>

            {/* 复制参数按钮 */}
            <button
              onClick={handleCopyParams}
              style={{
                width: '100%',
                padding: '8px',
                background: copySuccess ? '#10b981' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'background 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (!copySuccess) {
                  e.currentTarget.style.background = '#7c3aed';
                }
              }}
              onMouseLeave={(e) => {
                if (!copySuccess) {
                  e.currentTarget.style.background = '#8b5cf6';
                }
              }}
            >
              {copySuccess ? '✅ 已复制!' : '📋 复制参数'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

