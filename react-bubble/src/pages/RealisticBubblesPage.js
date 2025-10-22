import { useState, useEffect, Suspense } from 'react'
import { Canvas, useThree, useLoader } from '@react-three/fiber'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import * as THREE from 'three'
import RealisticBubble from '../components/RealisticBubble'
import RealisticDroplets from '../components/RealisticDroplets'

// Z轴深度范围常量
const Z_DEPTH_MIN = -15
const Z_DEPTH_MAX = 15

// 生成整个屏幕范围的随机位置
function generateScatteredPosition() {
  const x = (Math.random() - 0.5) * 35
  const y = -20 + Math.random() * 40
  const z = Z_DEPTH_MIN + Math.random() * (Z_DEPTH_MAX - Z_DEPTH_MIN)
  return [x, y, z]
}

// 17个气泡配置
const bubblesConfig = [
  {
    size: 1.3,
    scale: [1.0, 1.0, 1.0],
    speed: 18,
    spikes: 0.65,
    processing: 2.6,
    offset: 0
  },
  {
    size: 1.3,
    scale: [1.1, 0.95, 1.0],
    speed: 22,
    spikes: 0.7,
    processing: 2.8,
    offset: 1.5
  },
  {
    size: 1.3,
    scale: [1.05, 1.05, 1.0],
    speed: 15,
    spikes: 0.6,
    processing: 2.5,
    offset: 3.0
  },
  {
    size: 1.3,
    scale: [0.95, 1.15, 1.0],
    speed: 20,
    spikes: 0.75,
    processing: 3.0,
    offset: 4.5
  },
  {
    size: 1.3,
    scale: [1.15, 0.9, 1.0],
    speed: 17,
    spikes: 0.68,
    processing: 2.7,
    offset: 6.0
  },
  {
    size: 1.2,
    scale: [2.5, 1.4, 1.0],
    speed: 19,
    spikes: 0.7,
    processing: 2.9,
    offset: 2.0
  },
  {
    size: 1.2,
    scale: [1.2, 2.3, 1.0],
    speed: 16,
    spikes: 0.65,
    processing: 2.7,
    offset: 3.5
  },
  {
    size: 1.2,
    scale: [1.9, 1.9, 1.0],
    speed: 21,
    spikes: 0.72,
    processing: 2.8,
    offset: 5.0
  },
  {
    size: 1.2,
    scale: [1.1, 2.5, 1.0],
    speed: 18,
    spikes: 0.78,
    processing: 3.1,
    offset: 1.0
  },
  {
    size: 2.0,
    scale: [1.0, 1.0, 1.0],
    speed: 110,
    spikes: 1.8,
    processing: 0.35,
    offset: 2.5
  },
  {
    size: 1.3,
    scale: [1.0, 1.0, 1.0],
    speed: 20,
    spikes: 0.6,
    processing: 2.5,
    offset: 4.0
  },
  {
    size: 1.3,
    scale: [1.05, 1.05, 1.0],
    speed: 18,
    spikes: 0.7,
    processing: 2.8,
    offset: 5.5
  },
  {
    size: 1.3,
    scale: [1.0, 1.0, 1.0],
    speed: 22,
    spikes: 0.65,
    processing: 2.6,
    offset: 0.5
  },
  {
    size: 1.3,
    scale: [1.0, 1.0, 1.0],
    speed: 16,
    spikes: 0.75,
    processing: 3.0,
    offset: 2.0
  },
  {
    size: 1.3,
    scale: [1.2, 0.85, 1.0],
    speed: 24,
    spikes: 0.8,
    processing: 2.2,
    offset: 3.5
  },
  // 完美球体气泡
  {
    size: 1.5,
    scale: [1.0, 1.0, 1.0],
    speed: 0,
    spikes: 0,
    processing: 0,
    offset: 0,
    isPerfectSphere: true
  },
  {
    size: 1.8,
    scale: [1.0, 1.0, 1.0],
    speed: 0,
    spikes: 0,
    processing: 0,
    offset: 0,
    isPerfectSphere: true
  },
  {
    size: 1.2,
    scale: [1.0, 1.0, 1.0],
    speed: 0,
    spikes: 0,
    processing: 0,
    offset: 0,
    isPerfectSphere: true
  }
]

// 场景内容组件
function SceneContent() {
  const { scene } = useThree()
  const [bubbles, setBubbles] = useState([])
  const [burstEffects, setBurstEffects] = useState([])

  // 加载 HDR 环境贴图
  const envMap = useLoader(RGBELoader, '/radial_ramp_01.hdr')

  // 设置环境和背景
  useEffect(() => {
    if (envMap) {
      envMap.mapping = THREE.EquirectangularReflectionMapping
      scene.environment = envMap
      scene.background = new THREE.Color(0x000000)
    }
  }, [envMap, scene])

  // 初始化气泡
  useEffect(() => {
    const initialBubbles = bubblesConfig.map((config, index) => ({
      id: index,
      config,
      initialPosition: generateScatteredPosition()
    }))
    setBubbles(initialBubbles)
  }, [])

  // 处理气泡破裂
  const handleBubbleBurst = (position, config, onRespawn) => {
    const effectId = Date.now() + Math.random()

    // 添加破裂效果
    setBurstEffects((prev) => [
      ...prev,
      {
        id: effectId,
        position: position.clone(),
        config,
        onRespawn
      }
    ])
  }

  // 处理液滴完成
  const handleDropletsComplete = (effectId, onRespawn) => {
    // 先触发重生
    if (onRespawn) {
      onRespawn()
    }

    // 移除效果
    setBurstEffects((prev) => prev.filter((e) => e.id !== effectId))
  }

  return (
    <>
      {/* 气泡 */}
      {bubbles.map((bubble) => (
        <RealisticBubble key={bubble.id} config={bubble.config} envMap={envMap} onBurst={handleBubbleBurst} initialPosition={bubble.initialPosition} />
      ))}

      {/* 破裂效果 */}
      {burstEffects.map((effect) => (
        <RealisticDroplets
          key={effect.id}
          position={effect.position}
          bubbleConfig={effect.config}
          envMap={envMap}
          onComplete={() => handleDropletsComplete(effect.id, effect.onRespawn)}
        />
      ))}
    </>
  )
}

export default function RealisticBubblesPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas camera={{ fov: 60, position: [0, 0, 30], near: 0.1, far: 100 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  )
}
