'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import SolarPanel from '@/components/SolarPanel';

export default function Sphere() {
    return (
    <div style={{ height: '100vh', width: '100vw' }}>
    <Canvas>
        <ambientLight intensity={0.5} />
        <Stars
            radius={0.001}
            depth={35}
            count={10000}
            factor={1}
            saturation={0}
            fade
            speed={2}
          />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <mesh>
        <sphereGeometry args={[1, 32, 32]} /> {/* args: radius, widthSegments, heightSegments */}
        <meshStandardMaterial color="blue" />
        </mesh> 
        <SolarPanel position={[2, 0, 0]} rotation={[0, Math.PI / 2  , 0]} />
        <SolarPanel position={[-2, 0, 0]} rotation={[0, Math.PI / 2  , 0]} />
        <OrbitControls />
    </Canvas>
    </div>
    );
}