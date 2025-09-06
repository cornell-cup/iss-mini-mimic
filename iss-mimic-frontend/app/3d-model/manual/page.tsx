'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import SolarPanel from '@/components/SolarPanel';
import TelemetryDisplay from '@/components/TelemetryDisplay';
import { useTelemetry, TELEMETRY_ITEMS } from '@/components/TelemetryContext';

export default function IssModel() {
    const { telemetryItems } = useTelemetry();
    const telemetry = telemetryItems["S0000004"];

    return (
    <div className="position-relative">
        {/* Telemetry overlay */}
        <div className="position-absolute top-0 end-0 p-3 bg-dark bg-opacity-75 text-white m-3 rounded shadow-sm" style={{ zIndex: 10, maxWidth: '300px' }}>
            <h5 className="mb-3 fw-bold">ISS Telemetry</h5>
            <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between">
                    <span>Degree:</span>
                    <h1>ENTER VALUE HERE</h1>
                </div>
            </div>
        </div>
        

        {/* 3D Canvas */}
        <div style={{ height: '100vh', width: '100vw' }}>
            <Canvas>
                <ambientLight intensity={0.5} />
                <Stars
                    radius={0.001}
                    depth={35}
                    count={10000}
                    factor={1}
                    saturation={6}
                    fade
                    speed={2}
                />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <mesh>
                    <sphereGeometry args={[1, 32, 32]} /> {/* args: radius, widthSegments, heightSegments */}
                    <meshStandardMaterial color="blue" />
                    <SolarPanel position={[2, 0, 0]} rotation={[0, Math.PI / 2, 0]} color="green"/>
                    <SolarPanel position={[4.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} color="green"/>
                    <SolarPanel position={[-2, 0, 0]} rotation={[telemetry?.value ? Number(telemetry.value)*(Math.PI/180) : 0, Math.PI / 2, 0]} color="orange" />   
                    <SolarPanel position={[-4.5, 0, 0]} rotation={[telemetry?.value ? Number(telemetry.value)*(Math.PI/180) : 0, Math.PI / 2, 0]} color="orange" />   
                </mesh> 
                <OrbitControls />
            </Canvas>
        </div>
    </div>
    );
}