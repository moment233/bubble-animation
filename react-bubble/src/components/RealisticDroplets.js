import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { bubbleVertexShader, bubbleFragmentShader } from '../shaders/bubbleShaders'

export default function RealisticDroplets({ position, bubbleConfig, envMap, onComplete }) {
  const groupRef = useRef()
  const dropletsDataRef = useRef([])
  const completedRef = useRef(false)
  const { camera, scene } = useThree()

  useEffect(() => {
    // 生成液滴
    const dropletCount = 5 + Math.floor(Math.random() * 4) // 5-8个液滴
    const droplets = []

    for (let i = 0; i < dropletCount; i++) {
      const angle = (Math.PI * 2 * i) / dropletCount + Math.random() * 0.5
      const speed = 0.15 + Math.random() * 0.15
      const dropletSize = bubbleConfig.size * (0.08 + Math.random() * 0.04)

      // 直接创建 THREE.Mesh
      const geometry = new THREE.SphereGeometry(dropletSize, 16, 16)
      const material = new THREE.ShaderMaterial({
        vertexShader: bubbleVertexShader,
        fragmentShader: bubbleFragmentShader,
        uniforms: {
          uCameraPos: { value: camera.position },
          envMap: { value: envMap }
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(position.x, position.y, position.z)
      scene.add(mesh)

      droplets.push({
        mesh,
        velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed * 0.5, (Math.random() - 0.5) * 0.05),
        rotationVel: new THREE.Vector3(Math.random() * 0.15, Math.random() * 0.15, Math.random() * 0.15),
        startTime: performance.now(),
        duration: 350 + Math.random() * 150
      })
    }

    dropletsDataRef.current = droplets
    completedRef.current = false

    // 清理函数
    return () => {
      droplets.forEach(({ mesh }) => {
        scene.remove(mesh)
        mesh.geometry.dispose()
        mesh.material.dispose()
      })
    }
  }, [position, bubbleConfig.size, envMap, camera, scene])

  useFrame(() => {
    if (completedRef.current) return

    const currentTime = performance.now()
    let allComplete = true

    dropletsDataRef.current.forEach((droplet) => {
      const elapsed = currentTime - droplet.startTime
      const progress = elapsed / droplet.duration

      if (progress < 1) {
        allComplete = false

        // 更新位置
        droplet.mesh.position.add(droplet.velocity)

        // 重力影响
        droplet.velocity.y -= 0.008

        // 更新旋转
        droplet.mesh.rotation.x += droplet.rotationVel.x
        droplet.mesh.rotation.y += droplet.rotationVel.y
        droplet.mesh.rotation.z += droplet.rotationVel.z

        // 淡出和缩小
        const fadeProgress = Math.pow(progress, 1.5)
        const fadeScale = 1 - fadeProgress * 0.7

        droplet.mesh.scale.setScalar(fadeScale)
        droplet.mesh.visible = fadeScale > 0.1
      } else {
        droplet.mesh.visible = false
      }
    })

    if (allComplete && dropletsDataRef.current.length > 0 && !completedRef.current) {
      completedRef.current = true
      if (onComplete) {
        onComplete()
      }
    }
  })

  // 返回空的 group，因为我们直接在 scene 中添加了 meshes
  return <group ref={groupRef} />
}
