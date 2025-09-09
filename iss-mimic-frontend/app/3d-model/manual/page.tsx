'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import SolarPanel from '@/components/SolarPanel';
import React, {useState, ChangeEvent, FormEvent} from 'react';
import BluetoothConnectionInfo from '@/components/BluetoothConnectionInfo';
import { useBluetooth } from '@/contexts/BluetoothContext';

export default function IssModel() {
    const [sliderValue, setSliderValue] = useState(0);
    const [angle, setAngle] = useState(0);

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

    const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSliderValue(Number(event.target.value));
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setAngle(sliderValue);
        if (isConnected) {
            // Send the angle as a byte array (0-360 mapped to 0-255)
            const byteValue = Math.round((sliderValue / 360) * 255);
            console.log("Sending byte value:", byteValue);
            console.log([byteValue]);
            sendPacket([1,127,127,127,127,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
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
            <h5 className="mb-3 fw-bold">Angle for Solar Panels</h5>
            <form onSubmit={handleSubmit}>
            <label htmlFor="my-slider">Select a value:</label>
            <input
                type="range"
                id="my-slider"
                min="0"
                max="360"
                value={sliderValue}
                onChange={handleSliderChange}
            />
            <input  
            onChange = {(e) => setSliderValue(Number(e.target.value))} 
            value = {sliderValue}/>
            <button type="submit" className="btn btn-primary">Set Angle</button>
            <button type="button" className="btn btn-primary" onClick={() => {setSliderValue(0); setAngle(0);}}>Reset</button>

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
                    <sphereGeometry args={[1, 32, 32]} /> {/* args: radius, widthSegments, heightSegments */}
                    <meshStandardMaterial color="blue" />
                    <SolarPanel position={[2, 0, 0]} rotation={[0, Math.PI / 2, 0]} color="green"/>
                    <SolarPanel position={[4.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} color="green"/>
                    <SolarPanel position={[-2, 0, 0]} rotation={[Number(angle)*(Math.PI/180), Math.PI / 2, 0]} color="orange" />   
                    <SolarPanel position={[-4.5, 0, 0]} rotation={[Number(angle)*(Math.PI/180), Math.PI / 2, 0]} color="orange" />   
                </mesh> 
                <OrbitControls />
            </Canvas>
        </div>
    </div>
    );
}