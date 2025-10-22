import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function BurstEffect({ position, bubbleSize, color, onComplete }) {
  const [droplets, setDroplets] = useState([])
  const startTime = useRef(performance.now())

  useEffect(() => {
    // 生成液滴
    const dropletCount = 5 + Math.floor(Math.random() * 4) // 5-8个液滴
    const newDroplets = []

    for (let i = 0; i < dropletCount; i++) {
      const angle = (Math.PI * 2 * i) / dropletCount + Math.random() * 0.5
      const speed = 0.015 + Math.random() * 0.015

      newDroplets.push({
        id: i,
        position: new THREE.Vector3(position.x, position.y, position.z),
        velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed * 0.5, (Math.random() - 0.5) * 0.005),
        size: bubbleSize * (0.1 + Math.random() * 0.05),
        startTime: performance.now(),
        duration: 300 + Math.random() * 150
      })
    }

    setDroplets(newDroplets)
  }, [position, bubbleSize])

  useFrame(() => {
    const currentTime = performance.now()
    let allComplete = true

    setDroplets((prevDroplets) => {
      const updatedDroplets = prevDroplets.map((droplet) => {
        const elapsed = currentTime - droplet.startTime
        const progress = elapsed / droplet.duration

        if (progress < 1) {
          allComplete = false

          // 更新位置
          const newPosition = droplet.position.clone()
          newPosition.add(droplet.velocity)

          // 重力影响
          const newVelocity = droplet.velocity.clone()
          newVelocity.y -= 0.001

          return {
            ...droplet,
            position: newPosition,
            velocity: newVelocity,
            scale: 1 - Math.pow(progress, 1.5) * 0.7,
            visible: true
          }
        } else {
          return { ...droplet, visible: false }
        }
      })

      return updatedDroplets
    })

    if (allComplete && droplets.length > 0) {
      if (onComplete) onComplete()
    }
  })

  return (
    <group>
      {droplets.map((droplet) =>
        droplet.visible ? (
          <mesh key={droplet.id} position={droplet.position} scale={droplet.scale || 1}>
            <sphereGeometry args={[droplet.size, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.61} metalness={0.21} />
          </mesh>
        ) : null
      )}
    </group>
  )
}
