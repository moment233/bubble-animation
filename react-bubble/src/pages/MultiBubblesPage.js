import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import InteractiveBubble from '../components/InteractiveBubble'
import BurstEffect from '../components/BurstEffect'

// 生成随机气泡配置
const generateBubbleConfig = () => {
  return {
    size: 0.15 + Math.random() * 0.15, // 15-30 在3D空间中的单位
    color: new THREE.Color(Math.random(), Math.random(), Math.random()),
    initialPosition: {
      x: (Math.random() - 0.5) * 6,
      y: (Math.random() - 0.5) * 4,
      z: (Math.random() - 0.5) * 3
    },
    floatSpeed: 0.3 + Math.random() * 0.4,
    floatAmplitude: 0.2 + Math.random() * 0.3,
    swaySpeed: 0.2 + Math.random() * 0.3,
    swayAmplitude: 0.15 + Math.random() * 0.25,
    depthSpeed: 0.15 + Math.random() * 0.2,
    depthAmplitude: 0.3 + Math.random() * 0.5,
    timeOffset: Math.random() * Math.PI * 2
  }
}

export default function MultiBubblesPage() {
  const [bubbles, setBubbles] = useState([])
  const [burstEffects, setBurstEffects] = useState([])
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  // 初始化6个气泡
  useEffect(() => {
    const initialBubbles = []
    for (let i = 0; i < 6; i++) {
      initialBubbles.push({
        id: i,
        config: generateBubbleConfig()
      })
    }
    setBubbles(initialBubbles)
  }, [])

  // 鼠标移动监听
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouse({
        x: e.clientX,
        y: e.clientY
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // 处理气泡破裂
  const handleBubbleBurst = (position, config, onRespawn) => {
    // 添加破裂效果
    const effectId = Date.now() + Math.random()
    setBurstEffects((prev) => [
      ...prev,
      {
        id: effectId,
        position,
        bubbleSize: config.size,
        color: config.color
      }
    ])

    // 破裂效果完成后重生气泡
    setTimeout(() => {
      const newConfig = generateBubbleConfig()
      onRespawn(newConfig)

      // 移除破裂效果
      setBurstEffects((prev) => prev.filter((effect) => effect.id !== effectId))
    }, 500)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #ffd2c1, #f9d0d3)' }}>
      <Canvas camera={{ fov: 60, position: [0, 0, 5] }}>
        {/* 灯光 */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 5, 5]} intensity={0.4} castShadow />
        <directionalLight position={[-5, 3, 3]} intensity={0.25} />
        <directionalLight position={[0, -2, 3]} intensity={0.15} />

        {/* 气泡 */}
        {bubbles.map((bubble) => (
          <InteractiveBubble key={bubble.id} initialConfig={bubble.config} onBurst={handleBubbleBurst} mouse={mouse} />
        ))}

        {/* 破裂效果 */}
        {burstEffects.map((effect) => (
          <BurstEffect
            key={effect.id}
            position={effect.position}
            bubbleSize={effect.bubbleSize}
            color={effect.color}
            onComplete={() => {
              setBurstEffects((prev) => prev.filter((e) => e.id !== effect.id))
            }}
          />
        ))}
      </Canvas>
    </div>
  )
}
