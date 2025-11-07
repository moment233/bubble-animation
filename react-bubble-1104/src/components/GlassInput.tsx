'use client';

import { useState } from 'react';

export default function GlassInput() {
  const [inputValue, setInputValue] = useState('');

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '338px',
        height: '180px',
        maxWidth: 'calc(100vw - 60px)',
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px) saturate(10%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '20px',
          padding: '16px 20px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        <textarea
          placeholder="Explain your wish..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            borderRadius: '0',
            padding: '0',
            color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '15px',
            outline: 'none',
            transition: 'all 0.3s ease',
            resize: 'none',
            fontFamily: 'inherit',
            lineHeight: '1.5',
            verticalAlign: 'top',
          }}
        />
      </div>
    </div>
  );
}

