'use client';

import { useState } from 'react';

interface DOFControlsProps {
  onFocusChange: (value: number) => void;
  onApertureChange: (value: number) => void;
  onMaxBlurChange: (value: number) => void;
  onBubbleSpeedChange: (value: number) => void;
  onBubbleSizeChange: (value: number) => void;
  onWaveAmplitudeChange: (value: number) => void;
  onWaveSpeedChange: (value: number) => void;
  onDistortionChange: (value: number) => void;
  onSubdivisionChange: (value: number) => void;
  onBubbleCountChange: (value: number) => void;
}

export default function DOFControls({
  onFocusChange,
  onApertureChange,
  onMaxBlurChange,
  onBubbleSpeedChange,
  onBubbleSizeChange,
  onWaveAmplitudeChange,
  onWaveSpeedChange,
  onDistortionChange,
  onSubdivisionChange,
  onBubbleCountChange,
}: DOFControlsProps) {
  const [focus, setFocus] = useState(10.0);
  const [aperture, setAperture] = useState(0.0001);
  const [maxBlur, setMaxBlur] = useState(0.01);
  const [bubbleSpeed, setBubbleSpeed] = useState(10); // 默认速度10
  const [bubbleSize, setBubbleSize] = useState(0.4); // 默认尺寸倍数0.4
  const [waveAmplitude, setWaveAmplitude] = useState(0.20); // 波浪强度
  const [waveSpeed, setWaveSpeed] = useState(4.3); // 波浪速度
  const [distortion, setDistortion] = useState(0.05); // 扭曲强度
  const [subdivision, setSubdivision] = useState(128); // 顶点细分
  const [bubbleCount, setBubbleCount] = useState(10); // 气泡数量
  const [isExpanded, setIsExpanded] = useState(true); // 展开/收起状态

  const handleFocusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setFocus(value);
    onFocusChange(value);
  };

  const handleApertureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAperture(value);
    onApertureChange(value);
  };

  const handleMaxBlurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setMaxBlur(value);
    onMaxBlurChange(value);
  };

  const handleBubbleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setBubbleSpeed(value);
    onBubbleSpeedChange(value);
  };

  const handleBubbleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setBubbleSize(value);
    onBubbleSizeChange(value);
  };

  const handleWaveAmplitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setWaveAmplitude(value);
    onWaveAmplitudeChange(value);
  };

  const handleWaveSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setWaveSpeed(value);
    onWaveSpeedChange(value);
  };

  const handleDistortionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setDistortion(value);
    onDistortionChange(value);
  };

  const handleSubdivisionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSubdivision(value);
    onSubdivisionChange(value);
  };

  const handleBubbleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setBubbleCount(value);
    onBubbleCountChange(value);
  };

  const handleReset = () => {
    setFocus(10.0);
    setAperture(0.0001);
    setMaxBlur(0.01);
    setBubbleSpeed(10);
    setBubbleSize(0.4);
    setWaveAmplitude(0.20);
    setWaveSpeed(4.3);
    setDistortion(0.05);
    setSubdivision(128);
    setBubbleCount(10);
    onFocusChange(10.0);
    onApertureChange(0.0001);
    onMaxBlurChange(0.01);
    onBubbleSpeedChange(10);
    onBubbleSizeChange(0.4);
    onWaveAmplitudeChange(0.20);
    onWaveSpeedChange(4.3);
    onDistortionChange(0.05);
    onSubdivisionChange(128);
    onBubbleCountChange(10);
  };

  const focusZ = 10 - focus;

  return (
    <>
      <style>
        {`
          .dof-controls-panel::-webkit-scrollbar {
            width: 8px;
          }
          .dof-controls-panel::-webkit-scrollbar-track {
            background: rgba(139, 92, 246, 0.1);
            border-radius: 4px;
          }
          .dof-controls-panel::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.5);
            border-radius: 4px;
          }
          .dof-controls-panel::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.7);
          }
        `}
      </style>
      <div
        className="dof-controls-panel"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.85)',
          padding: isExpanded ? '20px' : '12px',
          borderRadius: '12px',
          color: 'white',
          width: isExpanded ? '280px' : 'auto',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          transform: 'translateZ(0)',
        }}
      >
      {/* 标题栏 - 可点击展开/收起 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
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
          📷 {isExpanded ? '景深控制器' : `DOF (${focus.toFixed(1)})`}
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

      {/* 控制面板内容 - 可展开/收起 */}
      {isExpanded && (
        <div
          style={{
            marginTop: '15px',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}
        >
          {/* 焦点距离 */}
          <div style={{ marginBottom: '15px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '5px',
            fontSize: '12px',
            color: '#aaa',
          }}
        >
          焦点距离 (Focus){' '}
          <span style={{ fontSize: '10px', color: '#666' }}>相机→焦点</span>
        </label>
        <input
          type="range"
          min="0"
          max="25"
          step="0.5"
          value={focus}
          onChange={handleFocusChange}
          style={{ width: '100%', cursor: 'pointer' }}
        />
        <div style={{ marginTop: '5px', textAlign: 'right' }}>
          <span
            style={{
              color: '#8b5cf6',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            {focus.toFixed(1)}
          </span>
        </div>
        <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
          焦点Z位置:{' '}
          <span style={{ color: '#8b5cf6' }}>{focusZ.toFixed(1)}</span>
        </div>
      </div>

      {/* 光圈大小 */}
      <div style={{ marginBottom: '15px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '5px',
            fontSize: '12px',
            color: '#aaa',
          }}
        >
          光圈大小 (Aperture){' '}
          <span style={{ fontSize: '10px', color: '#666' }}>f值倒数</span>
        </label>
        <input
          type="range"
          min="0.00001"
          max="0.005"
          step="0.00001"
          value={aperture}
          onChange={handleApertureChange}
          style={{ width: '100%', cursor: 'pointer' }}
        />
        <div style={{ marginTop: '5px', textAlign: 'right' }}>
          <span
            style={{
              color: '#8b5cf6',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            {aperture.toFixed(5)}
          </span>
        </div>
      </div>

      {/* 最大模糊 */}
      <div style={{ marginBottom: '15px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '5px',
            fontSize: '12px',
            color: '#aaa',
          }}
        >
          最大模糊 (Max Blur)
        </label>
        <input
          type="range"
          min="0.001"
          max="0.1"
          step="0.001"
          value={maxBlur}
          onChange={handleMaxBlurChange}
          style={{ width: '100%', cursor: 'pointer' }}
        />
        <div style={{ marginTop: '5px', textAlign: 'right' }}>
          <span
            style={{
              color: '#8b5cf6',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            {maxBlur.toFixed(3)}
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
          🎈 气泡上升速度{' '}
          <span style={{ fontSize: '10px', color: '#666' }}>Y轴运动</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={bubbleSpeed}
          onChange={handleBubbleSpeedChange}
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
            {bubbleSpeed.toFixed(0)} units/s
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
          🫧 气泡尺寸{' '}
          <span style={{ fontSize: '10px', color: '#666' }}>随机范围</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.1"
          value={bubbleSize}
          onChange={handleBubbleSizeChange}
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
            ×{bubbleSize.toFixed(1)} <span style={{ fontSize: '10px', color: '#666' }}>({(bubbleSize * 0.8).toFixed(2)} - {(bubbleSize * 1.8).toFixed(2)})</span>
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
          🌊 波浪强度{' '}
          <span style={{ fontSize: '10px', color: '#666' }}>起伏幅度</span>
        </label>
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.05"
          value={waveAmplitude}
          onChange={handleWaveAmplitudeChange}
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
            {waveAmplitude.toFixed(2)}
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
          ⚡ 波浪速度{' '}
          <span style={{ fontSize: '10px', color: '#666' }}>动画快慢</span>
        </label>
        <input
          type="range"
          min="0.0"
          max="10.0"
          step="0.1"
          value={waveSpeed}
          onChange={handleWaveSpeedChange}
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
            {waveSpeed.toFixed(1)}
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
          🌀 扭曲强度{' '}
          <span style={{ fontSize: '10px', color: '#666' }}>旋转形变</span>
        </label>
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.05"
          value={distortion}
          onChange={handleDistortionChange}
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
            {distortion.toFixed(2)}
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
          🔺 顶点细分{' '}
          <span style={{ fontSize: '10px', color: '#666' }}>平滑度</span>
        </label>
        <input
          type="range"
          min="16"
          max="128"
          step="16"
          value={subdivision}
          onChange={handleSubdivisionChange}
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
            {subdivision}
          </span>
        </div>
      </div>

      {/* 气泡数量 */}
      <div style={{ marginBottom: '15px', borderTop: '1px solid rgba(139, 92, 246, 0.2)', paddingTop: '15px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '5px',
            fontSize: '12px',
            color: '#aaa',
          }}
        >
          🎈 气泡数量
        </label>
        <input
          type="range"
          min="5"
          max="30"
          step="1"
          value={bubbleCount}
          onChange={handleBubbleCountChange}
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
            {bubbleCount}
          </span>
        </div>
      </div>

          {/* 重置按钮 */}
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '8px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#7c3aed';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#8b5cf6';
            }}
          >
            重置景深
          </button>
        </div>
      )}
    </div>
    </>
  );
}

