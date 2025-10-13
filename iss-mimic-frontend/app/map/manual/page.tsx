'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import SolarPanel from '@/components/SolarPanel';
import React, {useState, ChangeEvent, FormEvent} from 'react';
import BluetoothConnectionInfo from '@/components/BluetoothConnectionInfo';
import { useBluetooth } from '@/contexts/BluetoothContext';
import { createRobotPacket } from '@/utils/robotPackets';
import { Room } from '@/components/Room';



export default function IssModel() {
    const [sliderValue, setSliderValue] = useState(0);
    const [angle, setAngle] = useState(0);

    const width = 2058/3;
    const depth = 1036/3;
    const min_x = -width/2 + 1;
    const max_x = width/2 - 1;
    const min_y = -depth/2 + 1;
    const max_y = depth/2 - 1;
    
    // Sphere position control
    const [spherePosition, setSpherePosition] = useState({ x: 0, y: 0, z: 10 });
    
    const { 
        isConnected,
        sendPacket,
    } = useBluetooth();

    const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSliderValue(Number(event.target.value));
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setAngle(sliderValue);
        if (isConnected) {
            // Send the angle as a byte array (0-360 mapped to 0-255)
            const packet = createRobotPacket({ 
                angles: { angle0: sliderValue },
                buttons: { byte0: 1 } 
                });
            sendPacket(packet);
            console.log(packet);
        }
    };
    
    // Handle position changes
    const handlePositionChange = (axis: string, value: number) => {
        setSpherePosition(prev => ({
            ...prev,
            [axis]: value
        }));
    };

    return (
    <div className="position-relative">
        {/* Bluetooth Button and Info */}
        <div className="position-absolute top-0 start-0 p-3 bg-dark bg-opacity-75 text-white m-3 rounded shadow-sm" style={{ zIndex: 10, maxWidth: '500px' }}>
            <BluetoothConnectionInfo />
        </div>

        {/* Controls overlay */}
        <div className="position-absolute top-0 end-0 p-3 bg-dark bg-opacity-75 text-white m-3 rounded shadow-sm" style={{ zIndex: 10, maxWidth: '300px' }}>
            <h5 className="mb-3 fw-bold">Angle for Solar Panels</h5>
            <form onSubmit={handleSubmit} className="mb-4">
                <label htmlFor="my-slider">Select angle:</label>
                <input
                    type="range"
                    className="form-range mb-2"
                    id="my-slider"
                    min="0"
                    max="360"
                    value={sliderValue}
                    onChange={handleSliderChange}
                />
                <div className="d-flex gap-2 mb-3">
                    <input 
                        type="number"
                        className="form-control"
                        onChange={(e) => setSliderValue(Number(e.target.value))} 
                        value={sliderValue}
                    />
                    <button type="submit" className="btn btn-primary">Set</button>
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => {
                            setSliderValue(0); 
                            setAngle(0);
                            const packet = createRobotPacket({ 
                                angles: { angle0: 0 },
                                buttons: { byte0: 2 } 
                            });
                            sendPacket(packet);
                        }}
                    >
                        Reset
                    </button>
                </div>
            </form>
            
            {/* Sphere position controls */}
            <h5 className="mb-2 fw-bold">ISS Position</h5>
            <div className="mb-2">
                <label htmlFor="x-position">X Position:</label>
                <input
                    type="range"
                    className="form-range"
                    id="x-position"
                    min={min_x}
                    max={max_x}
                    step="0.1"
                    value={spherePosition.x}
                    onChange={(e) => handlePositionChange('x', Number(e.target.value))}
                />
                <span>{spherePosition.x.toFixed(1)}</span>
            </div>
            
            <div className="mb-2">
                <label htmlFor="y-position">Y Position:</label>
                <input
                    type="range"
                    className="form-range"
                    id="y-position"
                    min={min_y}
                    max={max_y}
                    step="0.1"
                    value={spherePosition.y}
                    onChange={(e) => handlePositionChange('y', Number(e.target.value))}
                />
                <span>{spherePosition.y.toFixed(1)}</span>
            </div>
            
            <div className="mb-2">
                <label htmlFor="z-position">Z Position:</label>
                <input
                    type="range"
                    className="form-range"
                    id="z-position"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={spherePosition.z}
                    onChange={(e) => handlePositionChange('z', Number(e.target.value))}
                />
                <span>{spherePosition.z.toFixed(1)}</span>
            </div>
            <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                    setSpherePosition({ x: 0, y: 0, z: 10 });
                }}
            >
                Reset
            </button>
        </div>
        
        {/* 3D Canvas */}
        <div style={{ height: '100vh', width: '100vw' }}>
            <Canvas camera={{ position: [10, 450, 10], fov: 50 }}>
                {/* Room appropriate lighting */}
                <ambientLight intensity={1.2} />
                <pointLight position={[0, 6, 0]} intensity={0.8} />
                <pointLight position={[5, 4, -2]} intensity={0.5} color="#fff6e5" />
                <pointLight position={[-5, 4, 2]} intensity={0.5} color="#e5f2ff" />
                
                {/* Room environment */}
                <Room />
                
                {/* ISS Sphere with controllable position */}
                <mesh 
                    position={[spherePosition.x, spherePosition.z, -spherePosition.y]}
                >
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial color="blue" />
                    <SolarPanel position={[2, 0, 0]} rotation={[0, Math.PI / 2, 0]} color="green"/>
                    <SolarPanel position={[4.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} color="green"/>
                    <SolarPanel 
                        position={[-2, 0, 0]} 
                        rotation={[Number(angle)*(Math.PI/180), Math.PI / 2, 0]} 
                        color="orange" 
                    />   
                    <SolarPanel 
                        position={[-4.5, 0, 0]} 
                        rotation={[Number(angle)*(Math.PI/180), Math.PI / 2, 0]} 
                        color="orange" 
                    />   
                </mesh> 
                
                <OrbitControls 
                    target={[0, 0, 0]}
                    minAzimuthAngle={-Math.PI / 20} 
                    maxAzimuthAngle={Math.PI / 700}
                />
            </Canvas>
        </div>
    </div>
    );
}