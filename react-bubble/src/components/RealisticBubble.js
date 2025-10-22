import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import SimplexNoise from '../utils/SimplexNoise'
import { bubbleVertexShader, bubbleFragmentShader } from '../shaders/bubbleShaders'

const simplex = new SimplexNoise()

const BUBBLE_STATE = {
  FLOATING: 'floating',
  BURSTING: 'bursting'
}

// Z轴深度范围常量
const Z_DEPTH_MIN = -15
const Z_DEPTH_MAX = 15

// 计算基于Z轴深度的缩放系数
function calculateDepthScale(z) {
  const normalizedZ = (z - Z_DEPTH_MIN) / (Z_DEPTH_MAX - Z_DEPTH_MIN)
  return 0.5 + normalizedZ * 1.0
}

export default function RealisticBubble({ config, envMap, onBurst, initialPosition }) {
  const meshRef = useRef()
  const geometryRef = useRef()
  const materialRef = useRef()
  const stateRef = useRef(BUBBLE_STATE.FLOATING)
  const burstStartTimeRef = useRef(null)
  const originalScaleRef = useRef(null)

  const { camera } = useThree()

  // 存储原始顶点位置
  const positionAttributeBase = useRef(null)

  // 物理参数
  const physics = useMemo(() => {
    const k = 0.8 + Math.random() * 0.4
    const params = {
      terminalVelocity: k * Math.sqrt(config.size) * 0.04,
      swayAmplitude: (0.5 + Math.random() * 1.5) * config.size * 0.6,
      swayFrequency: 0.3 / config.size,
      verticalVelocity: 0,
      zSwayAmplitude: 2.0 + Math.random() * 3.0,
      zSwayFrequency: 0.15 + Math.random() * 0.1,
      baseX: initialPosition[0],
      baseZ: initialPosition[2],
      swayPhase: Math.random() * Math.PI * 2,
      zSwayPhase: Math.random() * Math.PI * 2,
      noiseOffset: Math.random() * 1000
    }
    console.log('📊 气泡物理参数:', {
      size: config.size,
      terminalVelocity: params.terminalVelocity,
      initialPosition
    })
    return params
  }, [config.size, initialPosition])

  const physicsState = useRef(physics)

  // 初始化几何体
  useEffect(() => {
    if (geometryRef.current) {
      positionAttributeBase.current = geometryRef.current.getAttribute('position').clone()
    }
  }, [])

  // 更新环境贴图
  useEffect(() => {
    if (materialRef.current && envMap) {
      materialRef.current.uniforms.envMap.value = envMap
      materialRef.current.needsUpdate = true
    }
  }, [envMap])

  // 动画循环
  useFrame(({ clock }) => {
    if (!meshRef.current) return

    const mesh = meshRef.current
    const deltaTime = clock.getDelta()
    const currentTime = performance.now()

    // 处理收缩动画阶段
    if (stateRef.current === BUBBLE_STATE.BURSTING && burstStartTimeRef.current) {
      const elapsed = currentTime - burstStartTimeRef.current
      const shrinkDuration = 120 // 120ms
      const progress = Math.min(elapsed / shrinkDuration, 1)

      // 缩放到接近 0（保持原始比例）
      const scale = 1 - progress * 0.95
      if (originalScaleRef.current) {
        mesh.scale.set(originalScaleRef.current.x * scale, originalScaleRef.current.y * scale, originalScaleRef.current.z * scale)
      }

      mesh.visible = scale > 0.05

      if (progress >= 1) {
        // 收缩完成，触发液滴效果
        console.log('✅ 收缩动画完成，触发液滴')
        mesh.visible = false
        burstStartTimeRef.current = null

        if (onBurst) {
          onBurst(mesh.position.clone(), config, () => {
            console.log('🔄 液滴完成，开始重生')
            respawn()
          })
        }
      }

      return // 收缩期间不执行其他动画
    }

    // 如果正在破裂但没有开始时间（等待液滴完成），不执行动画
    if (stateRef.current === BUBBLE_STATE.BURSTING) return

    // 物理漂浮行为
    const p = physicsState.current

    // 1. 向上运动
    const damping = 0.03
    p.verticalVelocity += (p.terminalVelocity - p.verticalVelocity) * damping
    const yMovement = p.verticalVelocity * deltaTime * 30
    mesh.position.y += yMovement

    // 每60帧打印一次位置（避免刷屏）
    if (Math.random() < 0.016) {
      console.log(`⬆️ 气泡上升 - Y: ${mesh.position.y.toFixed(2)}, velocity: ${p.verticalVelocity.toFixed(4)}, movement: ${yMovement.toFixed(6)}`)
    }

    // 2. X轴摇摆
    p.swayPhase += p.swayFrequency * deltaTime * Math.PI
    let swayOffset = Math.sin(p.swayPhase) * p.swayAmplitude

    if (config.size > 3.0) {
      swayOffset += Math.sin(p.swayPhase * 1.7 + 1.2) * p.swayAmplitude * 0.3
    }

    mesh.position.x = p.baseX + swayOffset

    // 3. Z轴摇摆
    p.zSwayPhase += p.zSwayFrequency * deltaTime * Math.PI
    let zSwayOffset = Math.sin(p.zSwayPhase) * p.zSwayAmplitude
    mesh.position.z = p.baseZ + zSwayOffset

    // 4. 深度缩放（近大远小）
    const depthScale = calculateDepthScale(mesh.position.z)
    // 根据是否为完美球体应用不同的缩放
    if (!config.isPerfectSphere) {
      mesh.scale.set(config.scale[0] * depthScale, config.scale[1] * depthScale, config.scale[2] * depthScale)
    } else {
      mesh.scale.set(depthScale, depthScale, depthScale)
    }

    // 5. 湍流扰动
    const turbulenceX = simplex.noise3d(mesh.position.x * 0.1, currentTime * 0.0002, p.noiseOffset) * 0.01

    const turbulenceZ = simplex.noise3d(mesh.position.y * 0.1, currentTime * 0.0002, p.noiseOffset + 100) * 0.005

    mesh.position.x += turbulenceX
    mesh.position.z += turbulenceZ

    // 6. 边界处理
    if (mesh.position.x < -20) {
      mesh.position.x = 20
      p.baseX = 20
    } else if (mesh.position.x > 20) {
      mesh.position.x = -20
      p.baseX = -20
    }

    if (mesh.position.z < Z_DEPTH_MIN) {
      mesh.position.z = Z_DEPTH_MIN
      p.baseZ = Z_DEPTH_MIN
      p.zSwayPhase = Math.random() * Math.PI * 2
    } else if (mesh.position.z > Z_DEPTH_MAX) {
      mesh.position.z = Z_DEPTH_MAX
      p.baseZ = Z_DEPTH_MAX
      p.zSwayPhase = Math.random() * Math.PI * 2
    }

    // 7. 顶部边界
    if (mesh.position.y > 20) {
      if (Math.random() < 0.5) {
        handleBurst()
      } else {
        respawn()
      }
    }

    // 8. 顶点形变（非完美球体）
    if (!config.isPerfectSphere && positionAttributeBase.current) {
      updateVertices(currentTime)
    }

    // 9. 更新相机位置 uniform
    if (materialRef.current) {
      materialRef.current.uniforms.uCameraPos.value = camera.position
    }
  })

  // 顶点形变
  const updateVertices = (time) => {
    const geometry = geometryRef.current
    if (!geometry || !positionAttributeBase.current) return

    const animTime = time * 0.00001 * config.speed + config.offset
    const positionAttribute = geometry.getAttribute('position')
    const vector = new THREE.Vector3()

    for (let i = 0; i < positionAttributeBase.current.count; i++) {
      vector.fromBufferAttribute(positionAttributeBase.current, i)

      const noise = simplex.noise3d(vector.x * config.spikes, vector.y * config.spikes, vector.z * config.spikes + animTime)

      const ratio = noise * (0.05 * config.processing) + 0.98
      vector.multiplyScalar(ratio)
      positionAttribute.setXYZ(i, vector.x, vector.y, vector.z)
    }

    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()
  }

  // 处理破裂
  const handleBurst = () => {
    if (stateRef.current === BUBBLE_STATE.BURSTING) return
    const mesh = meshRef.current
    if (!mesh) return

    console.log('🎯 气泡破裂开始', {
      position: mesh.position,
      scale: mesh.scale,
      config: config
    })

    stateRef.current = BUBBLE_STATE.BURSTING
    burstStartTimeRef.current = performance.now()
    originalScaleRef.current = {
      x: mesh.scale.x,
      y: mesh.scale.y,
      z: mesh.scale.z
    }

    console.log('💾 保存的原始缩放:', originalScaleRef.current)
  }

  // 重生
  const respawn = () => {
    const mesh = meshRef.current
    if (!mesh) return

    // 重置位置到底部随机位置（包含新的Z轴深度）
    const x = (Math.random() - 0.5) * 35 // -17.5 到 17.5
    const y = -20
    const z = Z_DEPTH_MIN + Math.random() * (Z_DEPTH_MAX - Z_DEPTH_MIN) // -15 到 15

    mesh.position.set(x, y, z)
    mesh.visible = true

    // 计算基于新Z轴深度的缩放系数
    const depthScale = calculateDepthScale(z)

    // 随机调整大小增加多样性
    if (!config.isPerfectSphere) {
      // 普通气泡：随机大小和缩放 + 深度缩放
      const sizeVariation = 0.8 + Math.random() * 0.4
      mesh.scale.set(config.scale[0] * sizeVariation * depthScale, config.scale[1] * sizeVariation * depthScale, config.scale[2] * depthScale)
    } else {
      // 完美球体：保持完美比例 + 深度缩放
      mesh.scale.set(depthScale, depthScale, depthScale)
    }

    // 重新计算物理参数
    const p = physicsState.current
    p.baseX = x
    p.baseZ = z
    p.verticalVelocity = 0
    p.swayPhase = Math.random() * Math.PI * 2
    p.zSwayPhase = Math.random() * Math.PI * 2

    // 重置状态
    stateRef.current = BUBBLE_STATE.FLOATING
    burstStartTimeRef.current = null
    originalScaleRef.current = null
  }

  // 点击事件
  const handleClick = (e) => {
    e.stopPropagation()
    handleBurst()
  }

  // 计算初始深度缩放
  const initialDepthScale = useMemo(() => {
    return calculateDepthScale(initialPosition[2])
  }, [initialPosition])

  const initialScale = useMemo(() => {
    return [config.scale[0] * initialDepthScale, config.scale[1] * initialDepthScale, config.scale[2] * initialDepthScale]
  }, [config.scale, initialDepthScale])

  return (
    <mesh ref={meshRef} position={initialPosition} scale={initialScale} onClick={handleClick}>
      <sphereGeometry ref={geometryRef} args={[config.size, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        attach="material"
        vertexShader={bubbleVertexShader}
        fragmentShader={bubbleFragmentShader}
        uniforms={{
          uCameraPos: { value: camera.position },
          envMap: { value: envMap }
        }}
        transparent={true}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
