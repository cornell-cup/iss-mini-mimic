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
    // Alpha angle state - single value affecting all panels
    const [alphaSliderValue, setAlphaSliderValue] = useState(0);
    const [alphaAngle, setAlphaAngle] = useState(0);
    
    // Beta angle states - per panel
    const [selectedPanelBeta, setSelectedPanelBeta] = useState("all");
    const [betaSliderValue, setBetaSliderValue] = useState(0);
    
    // Store individual beta angles for each panel
    const [panelBetaAngles, setPanelBetaAngles] = useState({
        panel1: 0, // Red
        panel2: 0, // Orange
        panel3: 0, // Green
        panel4: 0  // Purple
    });

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

    // Handlers
    const handleAlphaSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
        setAlphaSliderValue(Number(event.target.value));
    };

    const handleBetaSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
        setBetaSliderValue(Number(event.target.value));
    };

    const handleBetaPanelSelection = (event: ChangeEvent<HTMLSelectElement>) => {
        setSelectedPanelBeta(event.target.value);
        
        // Update slider to show the selected panel's current beta angle
        if (event.target.value !== "all") {
            setBetaSliderValue(panelBetaAngles[event.target.value as keyof typeof panelBetaAngles]);
        } else {
            // When "all" is selected, show 0 or some default value
            setBetaSliderValue(0);
        }
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
        
        if (selectedPanelBeta === "all") {
            // Update all panels
            setPanelBetaAngles({
                panel1: betaSliderValue,
                panel2: betaSliderValue,
                panel3: betaSliderValue,
                panel4: betaSliderValue
            });
        } else {
            // Update only the selected panel
            setPanelBetaAngles(prev => ({
                ...prev,
                [selectedPanelBeta]: betaSliderValue
            }));
        }
        
        if (isConnected) {
            const packet = createRobotPacket({ 
                angles: { angle0: betaSliderValue },
                buttons: { byte0: 1 } 
            });
            sendPacket(packet);
            console.log(packet);
        }
    };
    
    const handleResetBeta = () => {
        if (selectedPanelBeta === "all") {
            // Reset all panels
            setPanelBetaAngles({
                panel1: 0,
                panel2: 0,
                panel3: 0,
                panel4: 0
            });
        } else {
            // Reset only the selected panel
            setPanelBetaAngles(prev => ({
                ...prev,
                [selectedPanelBeta]: 0
            }));
        }
        
        setBetaSliderValue(0);
        
        if (isConnected) {
            const packet = createRobotPacket({ 
                angles: { angle0: 0 },
                buttons: { byte0: 2 } 
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
                <div className="mb-3">
                    <label htmlFor="panel-select" className="form-label">Select Panel:</label>
                    <select 
                        id="panel-select" 
                        className="form-select"
                        value={selectedPanelBeta}
                        onChange={handleBetaPanelSelection}
                    >
                        <option value="all">All Panels</option>
                        <option value="panel1">Red Panel 1</option>
                        <option value="panel2">Orange Panel 2</option>
                        <option value="panel3">Green Panel 3</option>
                        <option value="panel4">Purple Panel 4</option>
                    </select>
                </div>
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
                <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleResetBeta}
                >
                    Reset
                </button>
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
                    <SolarPanel2 
                    position={[2, 0, 0]} 
                    rotation={[0, 0, panelBetaAngles.panel3 * (Math.PI/180)]} 
                    color="green"/>

                    <SolarPanel2 
                    position={[4.5, 0, 0]} 
                    rotation={[0, 0, panelBetaAngles.panel4 * (Math.PI/180)]} 
                    color="purple"/>

                    <SolarPanel2 
                    position={[-2, 0, 0]} 
                    rotation={[0, 0, panelBetaAngles.panel2 * (Math.PI/180)]} 
                    color="orange" />

                    <SolarPanel2 
                    position={[-4.5, 0, 0]} 
                    rotation={[0, 0, panelBetaAngles.panel1 * (Math.PI/180)]} 
                    color="red"/>
                </mesh> 
                <OrbitControls />
            </Canvas>
        </div>
    </div>
    );
}