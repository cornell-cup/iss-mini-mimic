'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import SolarPanel from '@/components/SolarPanel';
import React, {useState, ChangeEvent, FormEvent} from 'react';
import BluetoothConnectionInfo from '@/components/BluetoothConnectionInfo';
import { useBluetooth } from '@/contexts/BluetoothContext';
import { createRobotPacket, setButtonBit } from '@/utils/robotPackets';
import SolarPanel2 from '@/components/SolarPanel_v2';
import SolarPanel3 from '@/components/SolarPanel_v3';

export default function IssModel() {
    // Alpha angle states - per group
    const [selectedAlphaGroup, setSelectedAlphaGroup] = useState("all");
    const [alphaSliderValue, setAlphaSliderValue] = useState(0);
    
    // Store alpha angles for each group
    const [groupAlphaAngles, setGroupAlphaAngles] = useState({
        group1: 0, // Red and Orange panels
        group2: 0  // Green and Purple panels
    });
    
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
        sendPacket,
    } = useBluetooth();

    //Send all angles functions
    const sendAllAngles = () => {
        if (isConnected) {
            const packet = createRobotPacket({ 
                angles: { 
                    angle0: panelBetaAngles.panel1,  // Panel 1 beta
                    angle1: panelBetaAngles.panel2,  // Panel 2 beta
                    angle2: panelBetaAngles.panel3,  // Panel 3 beta
                    angle3: panelBetaAngles.panel4,  // Panel 4 beta
                    angle4: groupAlphaAngles.group1, // Group 1 alpha
                    angle5: groupAlphaAngles.group2  // Group 2 alpha
                },
                buttons: { byte0: 1 } 
            });
            sendPacket(packet);
            console.log("All angles packet:", packet);
        }
    };

    // Alpha handlers
    const handleAlphaSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
        setAlphaSliderValue(Number(event.target.value));
    };

    const handleAlphaGroupSelection = (event: ChangeEvent<HTMLSelectElement>) => {
        setSelectedAlphaGroup(event.target.value);
        
        // Update slider to show the selected group's current alpha angle
        if (event.target.value !== "all") {
            setAlphaSliderValue(groupAlphaAngles[event.target.value as keyof typeof groupAlphaAngles]);
        } else {
            // When "all" is selected, show 0 or some default value
            setAlphaSliderValue(0);
        }
    };

    const handleSubmitAlpha = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        // Create a copy of the current alpha angles
        let updatedAlphaAngles = {...groupAlphaAngles};
        
        if (selectedAlphaGroup === "all") {
            // Update all groups
            updatedAlphaAngles = {
                group1: alphaSliderValue,
                group2: alphaSliderValue
            };
        } else {
            // Update only the selected group
            updatedAlphaAngles[selectedAlphaGroup as keyof typeof updatedAlphaAngles] = alphaSliderValue;
        }
        
        // Update state
        setGroupAlphaAngles(updatedAlphaAngles);
        
        // Send packet with the updated values immediately
        if (isConnected) {
            const packet = createRobotPacket({ 
                angles: { 
                    angle0: panelBetaAngles.panel1,
                    angle1: panelBetaAngles.panel2,
                    angle2: panelBetaAngles.panel3,
                    angle3: panelBetaAngles.panel4,
                    angle4: updatedAlphaAngles.group1,
                    angle5: updatedAlphaAngles.group2
                },
                buttons: { byte0: 1 } 
            });
            sendPacket(packet);
            console.log("Sending alpha update:", packet);
        }
    };
    
    const handleResetAlpha = () => {
        // Create a copy of the current alpha angles
        let updatedAlphaAngles = {...groupAlphaAngles};
        
        if (selectedAlphaGroup === "all") {
            // Reset all groups
            updatedAlphaAngles = {
                group1: 0,
                group2: 0
            };
        } else {
            // Reset only the selected group
            updatedAlphaAngles[selectedAlphaGroup as keyof typeof updatedAlphaAngles] = 0;
        }
        
        // Update state
        setGroupAlphaAngles(updatedAlphaAngles);
        setAlphaSliderValue(0);
        
        // Send packet with the updated values immediately
        if (isConnected) {
            const packet = createRobotPacket({ 
                angles: { 
                    angle0: panelBetaAngles.panel1,
                    angle1: panelBetaAngles.panel2,
                    angle2: panelBetaAngles.panel3,
                    angle3: panelBetaAngles.panel4,
                    angle4: updatedAlphaAngles.group1,
                    angle5: updatedAlphaAngles.group2
                },
                buttons: { byte0: 1 } 
            });
            sendPacket(packet);
            console.log("Reset alpha angles:", packet);
        }
    };

    // Beta handlers
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

    const handleSubmitBeta = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        // Create a copy of the current beta angles
        let updatedBetaAngles = {...panelBetaAngles};
        
        if (selectedPanelBeta === "all") {
            // Update all panels in our local copy
            updatedBetaAngles = {
                panel1: betaSliderValue,
                panel2: betaSliderValue,
                panel3: betaSliderValue,
                panel4: betaSliderValue
            };
        } else {
            // Update only the selected panel in our local copy
            updatedBetaAngles[selectedPanelBeta as keyof typeof updatedBetaAngles] = betaSliderValue;
        }
        
        // Update state
        setPanelBetaAngles(updatedBetaAngles);
        
        // Send packet with the updated values immediately
        if (isConnected) {
            const packet = createRobotPacket({ 
                angles: { 
                    angle0: updatedBetaAngles.panel1,
                    angle1: updatedBetaAngles.panel2,
                    angle2: updatedBetaAngles.panel3,
                    angle3: updatedBetaAngles.panel4,
                    angle4: groupAlphaAngles.group1,
                    angle5: groupAlphaAngles.group2
                },
                buttons: { byte0: 1 } 
            });
            sendPacket(packet);
            console.log("Sending beta update:", packet);
        }
    };
    
    const handleResetBeta = () => {
        // Create a copy of the current beta angles
        let updatedBetaAngles = {...panelBetaAngles};
        
        if (selectedPanelBeta === "all") {
            // Reset all panels
            updatedBetaAngles = {
                panel1: 0,
                panel2: 0,
                panel3: 0,
                panel4: 0
            };
        } else {
            // Reset only the selected panel
            updatedBetaAngles[selectedPanelBeta as keyof typeof updatedBetaAngles] = 0;
        }
        
        // Update state
        setPanelBetaAngles(updatedBetaAngles);
        setBetaSliderValue(0);
        
        // Send packet with the updated values immediately
        if (isConnected) {
            const packet = createRobotPacket({ 
                angles: { 
                    angle0: updatedBetaAngles.panel1,
                    angle1: updatedBetaAngles.panel2,
                    angle2: updatedBetaAngles.panel3,
                    angle3: updatedBetaAngles.panel4,
                    angle4: groupAlphaAngles.group1,
                    angle5: groupAlphaAngles.group2
                },
                buttons: { byte0: 1 } 
            });
            sendPacket(packet);
            console.log("Reset beta angles:", packet);
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
                <div className="mb-3">
                    <label htmlFor="alpha-group-select" className="form-label">Select Group:</label>
                    <select 
                        id="alpha-group-select" 
                        className="form-select"
                        value={selectedAlphaGroup}
                        onChange={handleAlphaGroupSelection}
                    >
                        <option value="all">All Groups</option>
                        <option value="group1">Group 1 (Red and Orange)</option>
                        <option value="group2">Group 2 (Green and Purple)</option>
                    </select>
                </div>
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
                <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleResetAlpha}
                >
                    Reset
                </button>
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
                    {/*Mesh for grouping the 4 panels to be moved by alpha angle*/}
                    <mesh rotation={[groupAlphaAngles.group2 * (Math.PI/180),0,0]}>
                    {/* Group 2: Green Panel */}
                    <SolarPanel3 
                        position={[2, 0, 1.5]} 
                        rotation={[0, 0, panelBetaAngles.panel3 * (Math.PI/180)]} 
                        color="green"
                    />

                    <SolarPanel3 
                        position={[4.5, 0, 1.5]} 
                        rotation={[0, 0, panelBetaAngles.panel3 * (Math.PI/180)]} 
                        color="green"
                    />


                    {/* Group 2: Purple Panel */}
                    <SolarPanel3 
                        position={[4.5, 0, -1.5]} 
                        rotation={[0, 0, panelBetaAngles.panel4 * (Math.PI/180)]} 
                        color="purple"
                    />

                    <SolarPanel3 
                        position={[2, 0, -1.5]} 
                        rotation={[0, 0, panelBetaAngles.panel4 * (Math.PI/180)]} 
                        color="purple"
                    />
                    </mesh>

                    {/*Mesh for grouping the 4 panels to be moved by alpha angle*/}
                    <mesh rotation={[groupAlphaAngles.group1 * (Math.PI/180),0,0]}>
                    {/* Group 1: Orange Panel */}
                    <SolarPanel3 
                        position={[-2, 0, 1.5]} 
                        rotation={[0, 0, panelBetaAngles.panel2 * (Math.PI/180)]} 
                        color="orange" 
                    />

                    <SolarPanel3 
                        position={[-4.5, 0, 1.5]} 
                        rotation={[0, 0, panelBetaAngles.panel2 * (Math.PI/180)]} 
                        color="orange"
                    />


                    {/* Group 1: Red Panel */}
                    

                    <SolarPanel3 
                        position={[-4.5, 0, -1.5]} 
                        rotation={[0, 0, panelBetaAngles.panel1 * (Math.PI/180)]} 
                        color="red"
                    />

                    <SolarPanel3 
                        position={[-2, 0, -1.5]} 
                        rotation={[0, 0, panelBetaAngles.panel1 * (Math.PI/180)]} 
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