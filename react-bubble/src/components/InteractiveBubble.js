import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import SimplexNoise from '../utils/SimplexNoise'

const simplex = new SimplexNoise()

const BUBBLE_STATE = {
  FLOATING: 'floating',
  BURSTING: 'bursting'
}

export default function InteractiveBubble({ initialConfig, onBurst, mouse }) {
  const meshRef = useRef()
  const geometryRef = useRef()
  const [state, setState] = useState(BUBBLE_STATE.FLOATING)
  const [config, setConfig] = useState(initialConfig)

  // 存储原始顶点位置
  const originalPositions = useRef(null)

  // 初始化几何体和原始顶点
  useMemo(() => {
    const geometry = new THREE.SphereGeometry(config.size, 40, 40)
    const positions = geometry.attributes.position
    originalPositions.current = positions.array.slice()
    return geometry
  }, [config.size])

  // 动画循环
  useFrame(({ clock, camera }) => {
    if (!meshRef.current || state === BUBBLE_STATE.BURSTING) return

    const time = clock.getElapsedTime()
    const mesh = meshRef.current

    // 自动漂浮动画
    const floatOffset = config.timeOffset

    // 垂直漂浮（上下）
    const targetY = Math.sin(time * config.floatSpeed + floatOffset) * config.floatAmplitude
    mesh.position.y += (targetY - mesh.position.y) * 0.01

    // 水平摇摆（左右）
    const targetX = config.initialPosition.x + Math.cos(time * config.swaySpeed + floatOffset) * config.swayAmplitude
    mesh.position.x += (targetX - mesh.position.x) * 0.01

    // Z轴前后移动
    const targetZ = config.initialPosition.z + Math.sin(time * config.depthSpeed + floatOffset) * config.depthAmplitude
    mesh.position.z += (targetZ - mesh.position.z) * 0.01

    // 顶点形变（Perlin noise）
    const geometry = mesh.geometry
    const positions = geometry.attributes.position

    for (let i = 0; i < positions.count; i++) {
      const x = originalPositions.current[i * 3]
      const y = originalPositions.current[i * 3 + 1]
      const z = originalPositions.current[i * 3 + 2]

      const noise = simplex.noise3d(x * 0.006 + time * 0.0005, y * 0.006 + time * 0.0005, z * 0.006)

      const ratio = noise * 0.3 * 0.5 + 0.8

      positions.setXYZ(i, x * ratio, y * ratio, z * ratio)
    }

    positions.needsUpdate = true
    geometry.computeVertexNormals()

    // 独立的鼠标交互
    if (mouse) {
      const bubbleScreenPos = mesh.position.clone()
      bubbleScreenPos.project(camera)

      const width = window.innerWidth
      const height = window.innerHeight
      const bubbleX = ((bubbleScreenPos.x + 1) / 2) * width
      const bubbleY = ((-bubbleScreenPos.y + 1) / 2) * height

      const dx = mouse.x - bubbleX
      const dy = mouse.y - bubbleY
      const distToMouse = Math.sqrt(dx * dx + dy * dy)
      const maxDistance = Math.sqrt(width * width + height * height)
      const distanceRatio = Math.min(distToMouse / maxDistance, 1)

      // 根据距离调整旋转
      const rotationStrength = 1 - distanceRatio
      mesh.rotation.y = -0.5 + (mouse.x / width) * rotationStrength
      mesh.rotation.z = 0.5 - (mouse.y / height) * rotationStrength
    }
  })

  // 处理点击破裂
  const handleClick = (e) => {
    e.stopPropagation()
    if (state === BUBBLE_STATE.BURSTING) return

    setState(BUBBLE_STATE.BURSTING)

    // 收缩动画
    gsap.to(meshRef.current.scale, {
      x: 0.05,
      y: 0.05,
      z: 0.05,
      duration: 0.12,
      onComplete: () => {
        // 触发破裂效果和重生
        if (onBurst) {
          onBurst(meshRef.current.position, config, (newConfig) => {
            // 重生气泡
            setConfig(newConfig)
            setState(BUBBLE_STATE.FLOATING)
            meshRef.current.position.set(newConfig.initialPosition.x, newConfig.initialPosition.y, newConfig.initialPosition.z)
            meshRef.current.scale.set(1, 1, 1)
            meshRef.current.visible = true
          })
        }
        meshRef.current.visible = false
      }
    })
  }

  return (
    <mesh ref={meshRef} position={[config.initialPosition.x, config.initialPosition.y, config.initialPosition.z]} onClick={handleClick}>
      <sphereGeometry ref={geometryRef} args={[config.size, 40, 40]} />
      <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={0.5} roughness={0.61} metalness={0.21} />
    </mesh>
  )
}
