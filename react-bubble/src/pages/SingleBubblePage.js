import { Canvas } from '@react-three/fiber'
import { Environment, Shadow, OrbitControls, MeshDistortMaterial, Float } from '@react-three/drei'

export default function SingleBubblePage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ fov: 65 }}>
        <Float floatIntensity={1.5} speed={0.5}>
          <Bubble scale={1} />
        </Float>
        <Shadow scale={2} position={[0, -1.35, 0]} opacity={0.15} />
        <OrbitControls />
        <Environment preset="apartment" background blur={1} />
      </Canvas>
    </div>
  )
}

function Bubble(props) {
  return (
    <mesh {...props}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial
        distort={0.25}
        transmission={1.05}
        thickness={-0.5}
        roughness={0}
        iridescence={1}
        iridescenceIOR={1}
        iridescenceThicknessRange={[0, 1200]}
        clearcoat={1}
        clearcoatRoughness={0}
        envMapIntensity={1.5}
      />
    </mesh>
  )
}
