'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import SolarPanel from '@/components/SolarPanel';
import React, {useState, ChangeEvent, FormEvent} from 'react';
import BluetoothConnectionInfo from '@/components/BluetoothConnectionInfo';
import { useBluetooth } from '@/contexts/BluetoothContext';
import { createRobotPacket, setButtonBit } from '@/utils/robotPackets';
import SolarPanel2 from '@/components/SolarPanel_v2';

export default function IssModel() {
    // Separate state variables for each slider
    const [alphaSliderValue, setAlphaSliderValue] = useState(0);
    const [betaSliderValue, setBetaSliderValue] = useState(0);
    
    // Final angle values
    const [alphaAngle, setAlphaAngle] = useState(0);
    const [betaAngle, setBetaAngle] = useState(0);

    const { 
        isConnected,
        connecting,
        connectionStatus,
        statusColor,
        telemetryData,
        connectToDevice,
        disconnectFromDevice,
        sendPacket,
    } = useBluetooth();

    // Separate handlers for each slider
    const handleAlphaSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
        setAlphaSliderValue(Number(event.target.value));
    };

    const handleBetaSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
        setBetaSliderValue(Number(event.target.value));
    };

    const handleSubmitAlpha = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setAlphaAngle(alphaSliderValue);
        if (isConnected) {
            const packet = createRobotPacket({ 
                angles: { angle0: alphaSliderValue },
                buttons: { byte0: 1 } 
            });
            sendPacket(packet);
            console.log(packet);
        }
    };

    const handleSubmitBeta = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setBetaAngle(betaSliderValue);
        if (isConnected) {
            const packet = createRobotPacket({ 
                angles: { angle0: betaSliderValue },
                buttons: { byte0: 1 } 
            });
            sendPacket(packet);
            console.log(packet);
        }
    };

    return (
    <div className="position-relative">
        {/* Bluetooth Button and Info */}
        <div className="position-absolute top-0 start-0 p-3 bg-dark bg-opacity-75 text-white m-3 rounded shadow-sm" style={{ zIndex: 10, maxWidth: '500px' }}>
            <BluetoothConnectionInfo />
        </div>

        {/* Telemetry overlay */}
        <div className="position-absolute top-0 end-0 p-3 bg-dark bg-opacity-75 text-white m-3 rounded shadow-sm" style={{ zIndex: 10, maxWidth: '300px' }}>
            <h5 className="mb-3 fw-bold">Alpha Angle for Solar Panels</h5>
            <form onSubmit={handleSubmitAlpha}>
                <label htmlFor="alpha-slider">Select a value:</label>
                <input
                    type="range"
                    id="alpha-slider"
                    min="0"
                    max="360"
                    value={alphaSliderValue}
                    onChange={handleAlphaSliderChange}
                />
                <input  
                    onChange={(e) => setAlphaSliderValue(Number(e.target.value))} 
                    value={alphaSliderValue}
                    type="number"
                />
                <button type="submit" className="btn btn-primary">Set Alpha</button>
                <button type="button" className="btn btn-primary" onClick={() => {
                    setAlphaSliderValue(0); 
                    setAlphaAngle(0);
                    const packet = createRobotPacket({ 
                        angles: { angle0: 0 },
                        buttons: { byte0: 2 } 
                    });
                    sendPacket(packet);
                    console.log(packet);
                }}>Reset</button>
            </form>

            <h5 className="mb-3 mt-3 fw-bold">Beta Angle for Solar Panels</h5>
            <form onSubmit={handleSubmitBeta}>
                <label htmlFor="beta-slider">Select a value:</label>
                <input
                    type="range"
                    id="beta-slider"
                    min="0"
                    max="360"
                    value={betaSliderValue}
                    onChange={handleBetaSliderChange}
                />
                <input  
                    onChange={(e) => setBetaSliderValue(Number(e.target.value))} 
                    value={betaSliderValue}
                    type="number"
                />
                <button type="submit" className="btn btn-primary">Set Beta</button>
                <button type="button" className="btn btn-primary" onClick={() => {
                    setBetaSliderValue(0); 
                    setBetaAngle(0);
                    const packet = createRobotPacket({ 
                        angles: { angle0: 0 },
                        buttons: { byte0: 2 } 
                    });
                    sendPacket(packet);
                    console.log(packet);
                }}>Reset</button>
            </form>
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
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial color="blue" />
                    <SolarPanel2 position={[2, 0, 0]} rotation={[0, 0, 0]} color="green"/>
                    <SolarPanel2 position={[4.5, 0, 0]} rotation={[0, 0, 0]} color="green"/>
                    <SolarPanel2 position={[-2, 0, 0]} rotation={[Number(alphaAngle)*(Math.PI/180), 0, 0]} color="orange" />
                    <SolarPanel2 position={[-4.5, 0, 0]} rotation={[Number(alphaAngle)*(Math.PI/180), 0, Number(betaAngle)*(Math.PI/180)]} color="orange"/>
                </mesh> 
                <OrbitControls />
            </Canvas>
        </div>
    </div>
    );
}