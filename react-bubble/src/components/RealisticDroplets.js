import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { bubbleVertexShader, bubbleFragmentShader } from '../shaders/bubbleShaders'

export default function RealisticDroplets({ position, bubbleConfig, envMap, onComplete }) {
  const [droplets, setDroplets] = useState([])
  const { camera } = useThree()

  useEffect(() => {
    // 生成液滴
    const dropletCount = 5 + Math.floor(Math.random() * 4) // 5-8个液滴
    const newDroplets = []

    for (let i = 0; i < dropletCount; i++) {
      const angle = (Math.PI * 2 * i) / dropletCount + Math.random() * 0.5
      const speed = 0.15 + Math.random() * 0.15
      const dropletSize = bubbleConfig.size * (0.08 + Math.random() * 0.04)

      newDroplets.push({
        id: i,
        position: new THREE.Vector3(position.x, position.y, position.z),
        velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed * 0.5, (Math.random() - 0.5) * 0.05),
        rotation: new THREE.Vector3(Math.random() * 0.15, Math.random() * 0.15, Math.random() * 0.15),
        rotationVel: new THREE.Vector3(Math.random() * 0.15, Math.random() * 0.15, Math.random() * 0.15),
        size: dropletSize,
        startTime: performance.now(),
        duration: 350 + Math.random() * 150,
        scale: 1,
        visible: true
      })
    }

    setDroplets(newDroplets)
  }, [position, bubbleConfig.size])

  useFrame(() => {
    const currentTime = performance.now()
    let allComplete = true

    setDroplets((prevDroplets) => {
      return prevDroplets.map((droplet) => {
        const elapsed = currentTime - droplet.startTime
        const progress = elapsed / droplet.duration

        if (progress < 1) {
          allComplete = false

          // 更新位置
          const newPosition = droplet.position.clone()
          newPosition.add(droplet.velocity)

          // 重力影响
          const newVelocity = droplet.velocity.clone()
          newVelocity.y -= 0.008

          // 更新旋转
          const newRotation = droplet.rotation.clone()
          newRotation.add(droplet.rotationVel)

          // 淡出和缩小
          const fadeProgress = Math.pow(progress, 1.5)
          const fadeScale = 1 - fadeProgress * 0.7

          return {
            ...droplet,
            position: newPosition,
            velocity: newVelocity,
            rotation: newRotation,
            scale: fadeScale,
            visible: fadeScale > 0.1
          }
        } else {
          return { ...droplet, visible: false }
        }
      })
    })

    if (allComplete && droplets.length > 0 && onComplete) {
      onComplete()
    }
  })

  return (
    <group>
      {droplets.map((droplet) =>
        droplet.visible ? (
          <mesh key={droplet.id} position={droplet.position} rotation={droplet.rotation} scale={droplet.scale}>
            <sphereGeometry args={[droplet.size, 16, 16]} />
            <shaderMaterial
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
        ) : null
      )}
    </group>
  )
}
