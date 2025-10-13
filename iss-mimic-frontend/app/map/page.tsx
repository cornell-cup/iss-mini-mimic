'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import SolarPanel from '@/components/SolarPanel';
import React, {useState, ChangeEvent, FormEvent, useEffect} from 'react';
import BluetoothConnectionInfo from '@/components/BluetoothConnectionInfo';
import { useBluetooth } from '@/contexts/BluetoothContext';
import { createRobotPacket } from '@/utils/robotPackets';
import { Room } from '@/components/Room';
import PositionDisplay from '@/components/PositionDisplay';
import { useIssPosition } from '@/contexts/IssPositionContext';



export default function IssModel() {
    const [sliderValue, setSliderValue] = useState(0);
    const [angle, setAngle] = useState(0);
    const {position, isLoading} = useIssPosition();

    const width = 2058/3;
    const depth = 1036/3;

    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    const map_lon_to_x = () => {
        if (!position) return spherePosition.x;
        // Map longitude (-180 to 180) to (-halfWidth to halfWidth)
        const normalizedLon = (position.lon + 180) / 360; // 0 to 1
        return (normalizedLon * width) - halfWidth;
    };

    const map_lat_to_y = () => {
        if (!position) return spherePosition.y;
        // Map latitude (-90 to 90) to (halfDepth to -halfDepth)
        // Note: We invert Y because in 3D space, +Y is up but on maps, +latitude is up
        const normalizedLat = (90 - position.lat) / 180; // 0 to 1
        return (normalizedLat * depth) - halfDepth;
    };
    
    // Sphere position control
    const [spherePosition, setSpherePosition] = useState({ x: 0, y: 0, z: 10 });

    // Update sphere position when ISS position changes
    useEffect(() => {
        if (position && !isLoading) {
            setSpherePosition(prev => ({
                ...prev,
                x: map_lon_to_x(),
                y: map_lat_to_y()
            }));
        }
        // We only want to update when position changes
    }, [position, isLoading]);
    
    const { 
        isConnected,
        sendPacket,
    } = useBluetooth();

    /*const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
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
    };*/
    
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

            {/* Lat Lon Info */}
              <h5 className="mb-3 fw-bold">Live ISS Position</h5>
              <h5 className="mb-3">Latitude</h5>
              <PositionDisplay coordinate="lat" showLabel={false} />
              <h5 className="mb-3">Longitude</h5>
              <PositionDisplay coordinate="lon" showLabel={false} />
              {position && (
                <div className="mt-3 small">
                    <div>Mapped X: {map_lon_to_x().toFixed(1)}</div>
                    <div>Mapped Y: {map_lat_to_y().toFixed(1)}</div>
                </div>
            )}
            
            
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
                    position={[spherePosition.x, spherePosition.z, spherePosition.y]}
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