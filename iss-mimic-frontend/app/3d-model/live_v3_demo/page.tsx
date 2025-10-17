'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import React, {useState, ChangeEvent, FormEvent, useEffect} from 'react';
import BluetoothConnectionInfo from '@/components/BluetoothConnectionInfo';
import { useBluetooth } from '@/contexts/BluetoothContext';
import { createRobotPacket, setButtonBit } from '@/utils/robotPackets';
import SolarPanel2 from '@/components/SolarPanel_v2';
import TelemetryDisplay from '@/components/TelemetryDisplay';
import SolarPanel3 from '@/components/SolarPanel_v3';

export default function IssModel() {
    // State variables for random telemetry values
    const [telemetrySARJ1, setTelemetrySARJ1] = useState<number>(0);
    const [telemetrySARJ2, setTelemetrySARJ2] = useState<number>(0);
    const [telemetryBGA1, setTelemetryBGA1] = useState<number>(0);
    const [telemetryBGA3, setTelemetryBGA3] = useState<number>(0);
    const [telemetryBGA5, setTelemetryBGA5] = useState<number>(0);
    const [telemetryBGA7, setTelemetryBGA7] = useState<number>(0);
    
    // Additional state for time until next update
    const [timeUntilUpdate, setTimeUntilUpdate] = useState<number>(7);

    const { 
        isConnected,
        sendPacket,
    } = useBluetooth();

    // Function to generate a random angle between 0 and 360
    const generateRandomAngle = (): number => {
        return Math.floor(Math.random() * 361);
    };
    
    // Function to update all telemetry values with random angles
    const updateRandomTelemetry = () => {
        // Generate all new random values first
        const newSARJ1 = generateRandomAngle();
        const newSARJ2 = generateRandomAngle();
        const newBGA1 = generateRandomAngle();
        const newBGA3 = generateRandomAngle();
        const newBGA5 = generateRandomAngle();
        const newBGA7 = generateRandomAngle();
        
        // Send a single packet with all the new values
        if (isConnected) {
            console.log("Device is connected, sending telemetry update...");
            const packet = createRobotPacket({ 
                angles: { 
                    angle0: newBGA1,
                    angle1: newBGA3,
                    angle2: newBGA5,
                    angle3: newBGA7,
                    angle4: newSARJ1,
                    angle5: newSARJ2
                },
                buttons: { byte0: 1 } 
            });
            sendPacket(packet);
            console.log("Sending telemetry update:", packet);
        }
        
        // After sending the packet, update all state variables at once
        setTelemetrySARJ1(newSARJ1);
        setTelemetrySARJ2(newSARJ2);
        setTelemetryBGA1(newBGA1);
        setTelemetryBGA3(newBGA3);
        setTelemetryBGA5(newBGA5);
        setTelemetryBGA7(newBGA7);
        
        // Reset countdown timer
        setTimeUntilUpdate(7);
    };

    // Initialize random values when component mounts
    useEffect(() => {
        updateRandomTelemetry();
    }, []);

    // Set up interval to update random values every 7 seconds
    useEffect(() => {
        const updateInterval = setInterval(() => {
            setTimeUntilUpdate(prevTime => {
                if (prevTime <= 1) {
                    updateRandomTelemetry();
                    return 7;
                }
                return prevTime - 1;
            });
        }, 1000);
        
        return () => clearInterval(updateInterval);
    }, []);


    return (
    <div className="position-relative">
        {/* Bluetooth Button and Info */}
        <div className="position-absolute top-0 start-0 p-3 bg-dark bg-opacity-75 text-white m-3 rounded shadow-sm" style={{ zIndex: 10, maxWidth: '500px' }}>
            <BluetoothConnectionInfo />
        </div>

        <div className="position-absolute top-0 end-0 p-3 bg-dark bg-opacity-75 text-white m-3 rounded shadow-sm" style={{ zIndex: 10, maxWidth: '300px' }}>
            <h5 className="mb-3 fw-bold">Random Telemetry (Demo)</h5>
            <p>Next update in: {timeUntilUpdate} seconds</p>
            <div className="d-block mb-2">SARJ 1: {telemetrySARJ1}°</div>
            <div className="d-block mb-2">SARJ 2: {telemetrySARJ2}°</div>
            <div className="d-block mb-2">BGA 1 (P4): {telemetryBGA1}°</div>
            <div className="d-block mb-2">BGA 3 (P6): {telemetryBGA3}°</div>
            <div className="d-block mb-2">BGA 5 (S4): {telemetryBGA5}°</div>
            <div className="d-block mb-2">BGA 7 (S6): {telemetryBGA7}°</div>
            <button 
                className="btn btn-primary mt-2" 
                onClick={updateRandomTelemetry}
            >
                Generate New Random Values
            </button>
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
                    {/*Mesh for grouping the 4 panels to be moved by alpha angle*/}
                    <mesh rotation={[telemetrySARJ2 * (Math.PI/180), 0, 0]}>
                        {/* Group 2: Green Panel */}
                        <SolarPanel3 
                            position={[2, 0, 1.5]} 
                            rotation={[0, 0, telemetryBGA7 * (Math.PI/180)]} 
                            color="green"
                        />
                        <SolarPanel3 
                            position={[4.5, 0, 1.5]} 
                            rotation={[0, 0, telemetryBGA7 * (Math.PI/180)]} 
                            color="green"
                        />
                        
                        {/* Group 2: Purple Panel */}
                        <SolarPanel3 
                            position={[4.5, 0, -1.5]} 
                            rotation={[0, 0, telemetryBGA5 * (Math.PI/180)]} 
                            color="purple"
                        />
                        <SolarPanel3 
                            position={[2, 0, -1.5]} 
                            rotation={[0, 0, telemetryBGA5 * (Math.PI/180)]} 
                            color="purple"
                        />
                    </mesh>
                    
                    {/*Mesh for grouping the 4 panels to be moved by alpha angle*/}
                    <mesh rotation={[telemetrySARJ1 * (Math.PI/180), 0, 0]}>
                        {/* Group 1: Orange Panel */}
                        <SolarPanel3 
                            position={[-2, 0, 1.5]} 
                            rotation={[0, 0, telemetryBGA3 * (Math.PI/180)]} 
                            color="orange" 
                        />
                        <SolarPanel3 
                            position={[-4.5, 0, 1.5]} 
                            rotation={[0, 0, telemetryBGA3 * (Math.PI/180)]} 
                            color="orange"
                        />
                        
                        {/* Group 1: Red Panel */}
                        <SolarPanel3 
                            position={[-4.5, 0, -1.5]} 
                            rotation={[0, 0, telemetryBGA1 * (Math.PI/180)]} 
                            color="red"
                        />
                        <SolarPanel3 
                            position={[-2, 0, -1.5]} 
                            rotation={[0, 0, telemetryBGA1 * (Math.PI/180)]} 
                            color="red" 
                        />
                    </mesh>
                </mesh> 
                <OrbitControls />
            </Canvas>
        </div>
    </div>
    );
}