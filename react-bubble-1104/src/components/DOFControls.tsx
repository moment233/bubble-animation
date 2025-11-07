'use client';

import { useState } from 'react';

interface DOFControlsProps {
  onFocusChange: (value: number) => void;
  onApertureChange: (value: number) => void;
  onMaxBlurChange: (value: number) => void;
}

export default function DOFControls({
  onFocusChange,
  onApertureChange,
  onMaxBlurChange,
}: DOFControlsProps) {
  const [focus, setFocus] = useState(10.0);
  const [aperture, setAperture] = useState(0.0001);
  const [maxBlur, setMaxBlur] = useState(0.01);
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

  const handleReset = () => {
    setFocus(10.0);
    setAperture(0.0001);
    setMaxBlur(0.01);
    onFocusChange(10.0);
    onApertureChange(0.0001);
    onMaxBlurChange(0.01);
  };

  const focusZ = 10 - focus;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.85)',
        padding: isExpanded ? '20px' : '12px',
        borderRadius: '12px',
        color: 'white',
        width: isExpanded ? '280px' : 'auto',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        zIndex: 1000,
        transition: 'all 0.3s ease',
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
  );
}

