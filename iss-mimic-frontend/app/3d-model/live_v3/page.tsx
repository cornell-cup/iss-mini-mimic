'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import React, {useState, ChangeEvent, FormEvent, useEffect} from 'react';
import BluetoothConnectionInfo from '@/components/BluetoothConnectionInfo';
import { useBluetooth } from '@/contexts/BluetoothContext';
import { createIssPacket } from '@/utils/robotPackets';
import SolarPanel2 from '@/components/SolarPanel_v2';
import TelemetryDisplay from '@/components/TelemetryDisplay';
import MiniIssTelemetry from '@/components/MiniIssTelemetry';
import { useTelemetry } from '@/contexts/TelemetryContext';
import SolarPanel3 from '@/components/SolarPanel_v3';

export default function IssModel() {

    const { telemetryItems } = useTelemetry();
    const telemetrySARJ1 = telemetryItems["S0000003"];
    const telemetrySARJ2 = telemetryItems["S0000004"];
    const telemetryBGA1 = telemetryItems["P4000007"];
    const telemetryBGA2 = telemetryItems["P4000008"];
    const telemetryBGA3 = telemetryItems["P6000007"];
    const telemetryBGA4 = telemetryItems["P6000008"];
    const telemetryBGA5 = telemetryItems["S4000007"];
    const telemetryBGA6 = telemetryItems["S4000008"];
    const telemetryBGA7 = telemetryItems["S6000007"];
    const telemetryBGA8 = telemetryItems["S6000008"];

    const {
        isConnected,
        sendPacket,
    } = useBluetooth();

    // null until the first value arrives, so the robot holds position instead of jumping to 0
    const angleOf = (item?: { value: string }) => item?.value ? Number(item.value) : null;

    const sendTelemetryPacket = () => {
        if (isConnected) {
            // BGA n drives servo n (1-4 port/left, 5-8 starboard/right)
            const packet = createIssPacket(
                [telemetryBGA1, telemetryBGA2, telemetryBGA3, telemetryBGA4,
                 telemetryBGA5, telemetryBGA6, telemetryBGA7, telemetryBGA8].map(angleOf),
                [angleOf(telemetrySARJ1), angleOf(telemetrySARJ2)]
            );
            sendPacket(packet);
        }
    };

    // Send when telemetry changes, and resend every second as a heartbeat: the robot
    // drops a live connection after 5 s of silence (see drop_stale_link), which is how
    // it recovers when Windows keeps a dead Bluetooth link open
    useEffect(() => {
        sendTelemetryPacket();
        if (!isConnected) return;
        const heartbeat = setInterval(sendTelemetryPacket, 1000);
        return () => clearInterval(heartbeat);
    }, [
        telemetrySARJ1?.value,
        telemetrySARJ2?.value,
        telemetryBGA1?.value,
        telemetryBGA2?.value,
        telemetryBGA3?.value,
        telemetryBGA4?.value,
        telemetryBGA5?.value,
        telemetryBGA6?.value,
        telemetryBGA7?.value,
        telemetryBGA8?.value,
        isConnected // Also monitor connection state
    ]);

    return (
    <div className="position-relative">
        {/* Bluetooth Button and Info */}
        <div className="position-absolute top-0 start-0 p-3 bg-dark bg-opacity-75 text-white m-3 rounded shadow-sm" style={{ zIndex: 10, maxWidth: '500px' }}>
            <BluetoothConnectionInfo />
        </div>

        <div className="position-absolute top-0 end-0 p-3 bg-dark bg-opacity-75 text-white m-3 rounded shadow-sm" style={{ zIndex: 10, maxWidth: '300px' }}>
            <h5 className="mb-3 fw-bold">Telemetry Info</h5>
                <TelemetryDisplay itemId="S0000003" className="d-block mb-2" />
                <TelemetryDisplay itemId="S0000004" className="d-block mb-2" />
                <TelemetryDisplay itemId="P4000007" className="d-block mb-2" />
                <TelemetryDisplay itemId="P4000008" className="d-block mb-2" />
                <TelemetryDisplay itemId="P6000007" className="d-block mb-2" />
                <TelemetryDisplay itemId="P6000008" className="d-block mb-2" />
                <TelemetryDisplay itemId="S4000007" className="d-block mb-2" />
                <TelemetryDisplay itemId="S4000008" className="d-block mb-2" />
                <TelemetryDisplay itemId="S6000007" className="d-block mb-2" />
                <TelemetryDisplay itemId="S6000008" className="d-block mb-2" />
        </div>

        {/* What the mini ISS reports back, beside the real ISS values */}
        <div className="position-absolute bottom-0 start-0 p-3 bg-dark bg-opacity-75 text-white m-3 rounded shadow-sm" style={{ zIndex: 10, width: '320px' }}>
            <MiniIssTelemetry />
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
                                        <mesh rotation={[telemetrySARJ2?.value ? Number(telemetrySARJ2.value)*(Math.PI/180) : 0,0,0]}>
                                        {/* Group 2: Green Panel */}
                                        <SolarPanel3 
                                            position={[2, 0, 1.5]} 
                                            rotation={[0, 0, telemetryBGA7?.value ? Number(telemetryBGA7.value)*(Math.PI/180) : 0]} 
                                            color="green"
                                        />
                    
                                        <SolarPanel3 
                                            position={[4.5, 0, 1.5]} 
                                            rotation={[0, 0, telemetryBGA7?.value ? Number(telemetryBGA7.value)*(Math.PI/180) : 0]} 
                                            color="green"
                                        />
                    
                    
                                        {/* Group 2: Purple Panel */}
                                        <SolarPanel3 
                                            position={[4.5, 0, -1.5]} 
                                            rotation={[0, 0, telemetryBGA5?.value ? Number(telemetryBGA5.value)*(Math.PI/180) : 0]} 
                                            color="purple"
                                        />
                    
                                        <SolarPanel3 
                                            position={[2, 0, -1.5]} 
                                            rotation={[0, 0, telemetryBGA5?.value ? Number(telemetryBGA5.value)*(Math.PI/180) : 0]} 
                                            color="purple"
                                        />
                                        </mesh>
                    
                                        {/*Mesh for grouping the 4 panels to be moved by alpha angle*/}
                                        <mesh rotation={[telemetrySARJ1?.value ? Number(telemetrySARJ1.value)*(Math.PI/180) : 0,0,0]}>
                                        {/* Group 1: Orange Panel */}
                                        <SolarPanel3 
                                            position={[-2, 0, 1.5]} 
                                            rotation={[0, 0, telemetryBGA3?.value ? Number(telemetryBGA3.value)*(Math.PI/180) : 0]} 
                                            color="orange" 
                                        />
                    
                                        <SolarPanel3 
                                            position={[-4.5, 0, 1.5]} 
                                            rotation={[0, 0, telemetryBGA3?.value ? Number(telemetryBGA3.value)*(Math.PI/180) : 0]} 
                                            color="orange"
                                        />
                    
                    
                                        {/* Group 1: Red Panel */}
                                        
                    
                                        <SolarPanel3 
                                            position={[-4.5, 0, -1.5]} 
                                            rotation={[0, 0, telemetryBGA1?.value ? Number(telemetryBGA1.value)*(Math.PI/180) : 0]} 
                                            color="red"
                                        />
                    
                                        <SolarPanel3 
                                            position={[-2, 0, -1.5]} 
                                            rotation={[0, 0, telemetryBGA1?.value ? Number(telemetryBGA1.value)*(Math.PI/180) : 0]} 
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