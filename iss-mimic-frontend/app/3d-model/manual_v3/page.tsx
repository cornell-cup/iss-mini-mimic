'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import React, { useState, ChangeEvent, FormEvent, useRef, useEffect } from 'react';
import BluetoothConnectionInfo from '@/components/BluetoothConnectionInfo';
import MiniIssTelemetry from '@/components/MiniIssTelemetry';
import { useBluetooth } from '@/contexts/BluetoothContext';
import { useTelemetry } from '@/contexts/TelemetryContext';
import { createIssPacket } from '@/utils/robotPackets';
import SolarPanel3 from '@/components/SolarPanel_v3';

// Animation configuration
const ANIMATION_STEP_SIZE = 2; // Degrees to move per step
const ANIMATION_INTERVAL_MS = 50; // Milliseconds between steps (50ms = 20 steps/sec)

// The robot drops a live (v3) connection after 5 s of silence, so resend while idle
const HEARTBEAT_MS = 1000;

// Joint order matches the v3 packet: slots 0-7 = BGA 1-8 (servo n = BGA n),
// slot 8 = starboard SARJ, slot 9 = port SARJ
const LIVE_IDS = [
    'P4000007', 'P4000008', 'P6000007', 'P6000008', // BGA 1-4 (port, servos 1-4)
    'S4000007', 'S4000008', 'S6000007', 'S6000008', // BGA 5-8 (starboard, servos 5-8)
    'S0000003', 'S0000004',                         // starboard SARJ, port SARJ
];
const STARBOARD_SARJ = 8;
const PORT_SARJ = 9;

const BGA_RESET = 90;
const SARJ_RESET = 0;
const INITIAL_ANGLES = [...Array(8).fill(BGA_RESET), SARJ_RESET, SARJ_RESET];

// Dropdown choices: which packet slots a slider change applies to
const BGA_TARGETS = [
    { value: 'all', label: 'All BGAs (servos 1–8)', slots: [0, 1, 2, 3, 4, 5, 6, 7] },
    { value: 'port', label: 'Port BGAs 1–4 (left)', slots: [0, 1, 2, 3] },
    { value: 'starboard', label: 'Starboard BGAs 5–8 (right)', slots: [4, 5, 6, 7] },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((slot) => ({
        value: `bga${slot + 1}`, label: `BGA ${slot + 1} (servo ${slot + 1})`, slots: [slot],
    })),
];
const SARJ_TARGETS = [
    { value: 'all', label: 'Both SARJs', slots: [STARBOARD_SARJ, PORT_SARJ] },
    { value: 'starboard', label: 'Starboard SARJ', slots: [STARBOARD_SARJ] },
    { value: 'port', label: 'Port SARJ', slots: [PORT_SARJ] },
];

// 3D model: one panel per BGA. Port (left, negative x) turns with the port SARJ,
// starboard (right) with the starboard SARJ. Inner panels are P4/S4, outer P6/S6.
const PANELS = [
    { bga: 0, position: [-2, 0, -1.5], color: 'red' },
    { bga: 1, position: [-2, 0, 1.5], color: 'red' },
    { bga: 2, position: [-4.5, 0, -1.5], color: 'orange' },
    { bga: 3, position: [-4.5, 0, 1.5], color: 'orange' },
    { bga: 4, position: [2, 0, -1.5], color: 'green' },
    { bga: 5, position: [2, 0, 1.5], color: 'green' },
    { bga: 6, position: [4.5, 0, -1.5], color: 'purple' },
    { bga: 7, position: [4.5, 0, 1.5], color: 'purple' },
] as const;

const toRadians = (degrees: number) => degrees * (Math.PI / 180);

export default function IssModel() {
    // Current angles of all 10 joints (what the model shows and the robot is sent)
    const [angles, setAngles] = useState<number[]>(INITIAL_ANGLES);
    // Refs so the animation and heartbeat timers always see the latest values
    const anglesRef = useRef<number[]>(INITIAL_ANGLES);
    const targetsRef = useRef<number[]>(INITIAL_ANGLES);
    const animationRef = useRef<NodeJS.Timeout | null>(null);

    const [selectedBga, setSelectedBga] = useState('all');
    const [bgaSliderValue, setBgaSliderValue] = useState(BGA_RESET);
    const [selectedSarj, setSelectedSarj] = useState('all');
    const [sarjSliderValue, setSarjSliderValue] = useState(SARJ_RESET);

    const { isConnected, sendPacket } = useBluetooth();
    const { telemetryItems } = useTelemetry();

    const sendAngles = (current: number[]) => {
        if (isConnected) {
            sendPacket(createIssPacket(current.slice(0, 8), current.slice(8, 10)));
        }
    };

    // Send on connect, then resend every second as a heartbeat
    useEffect(() => {
        sendAngles(anglesRef.current);
        if (!isConnected) return;
        const heartbeat = setInterval(() => sendAngles(anglesRef.current), HEARTBEAT_MS);
        return () => clearInterval(heartbeat);
    }, [isConnected]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) clearInterval(animationRef.current);
        };
    }, []);

    // Smoothly move the given slots toward their targets, sending each step to the robot
    const animateTo = (slots: number[], target: number) => {
        const targets = [...targetsRef.current];
        slots.forEach((slot) => { targets[slot] = target; });
        animateToTargets(targets);
    };

    const animateToTargets = (targets: number[]) => {
        targetsRef.current = targets;
        if (animationRef.current) return; // the running animation picks up the new targets

        animationRef.current = setInterval(() => {
            let allReached = true;
            const next = anglesRef.current.map((current, slot) => {
                const diff = targetsRef.current[slot] - current;
                if (Math.abs(diff) > 0.5) {
                    allReached = false;
                    return current + Math.sign(diff) * Math.min(ANIMATION_STEP_SIZE, Math.abs(diff));
                }
                return targetsRef.current[slot];
            });

            anglesRef.current = next;
            setAngles(next);
            sendAngles(next);

            // Stop animation when all angles reached
            if (allReached && animationRef.current) {
                clearInterval(animationRef.current);
                animationRef.current = null;
            }
        }, ANIMATION_INTERVAL_MS);
    };

    const slotsFor = (targets: typeof BGA_TARGETS, value: string) =>
        targets.find((t) => t.value === value)?.slots ?? [];

    // BGA handlers
    const handleBgaSelection = (event: ChangeEvent<HTMLSelectElement>) => {
        setSelectedBga(event.target.value);
        // Show the first selected joint's current angle on the slider
        setBgaSliderValue(Math.round(anglesRef.current[slotsFor(BGA_TARGETS, event.target.value)[0]]));
    };

    const handleSubmitBga = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        animateTo(slotsFor(BGA_TARGETS, selectedBga), bgaSliderValue);
    };

    const handleResetBga = () => {
        setBgaSliderValue(BGA_RESET);
        animateTo(slotsFor(BGA_TARGETS, selectedBga), BGA_RESET);
    };

    // SARJ handlers
    const handleSarjSelection = (event: ChangeEvent<HTMLSelectElement>) => {
        setSelectedSarj(event.target.value);
        setSarjSliderValue(Math.round(anglesRef.current[slotsFor(SARJ_TARGETS, event.target.value)[0]]));
    };

    const handleSubmitSarj = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        animateTo(slotsFor(SARJ_TARGETS, selectedSarj), sarjSliderValue);
    };

    const handleResetSarj = () => {
        setSarjSliderValue(SARJ_RESET);
        animateTo(slotsFor(SARJ_TARGETS, selectedSarj), SARJ_RESET);
    };

    // Start from the real ISS position: move every joint that has live data to it
    const handleCopyLive = () => {
        const targets = targetsRef.current.map((current, slot) => {
            const live = telemetryItems[LIVE_IDS[slot]]?.value;
            return live ? Math.round(Number(live)) : current;
        });
        animateToTargets(targets);
        setBgaSliderValue(targets[slotsFor(BGA_TARGETS, selectedBga)[0]]);
        setSarjSliderValue(targets[slotsFor(SARJ_TARGETS, selectedSarj)[0]]);
    };
    const hasLiveData = LIVE_IDS.some((id) => telemetryItems[id]?.value);

    return (
    <div className="position-relative">
        {/* Bluetooth Button and Info */}
        <div className="position-absolute top-0 start-0 p-3 bg-dark bg-opacity-75 text-white m-3 rounded shadow-sm" style={{ zIndex: 10, maxWidth: '500px' }}>
            <BluetoothConnectionInfo />
        </div>

        {/* Manual controls */}
        <div className="position-absolute top-0 end-0 p-3 bg-dark bg-opacity-75 text-white m-3 rounded shadow-sm" style={{ zIndex: 10, maxWidth: '300px' }}>
            <button
                type="button"
                className="btn btn-outline-light btn-sm mb-3 w-100"
                onClick={handleCopyLive}
                disabled={!hasLiveData}
            >
                Copy live ISS values
            </button>

            <h5 className="mb-3 fw-bold">BGA (Beta) Angles</h5>
            <form onSubmit={handleSubmitBga}>
                <div className="mb-3">
                    <label htmlFor="bga-select" className="form-label">Select BGA:</label>
                    <select
                        id="bga-select"
                        className="form-select"
                        value={selectedBga}
                        onChange={handleBgaSelection}
                    >
                        {BGA_TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <label htmlFor="bga-slider">Select a value:</label>
                <input
                    type="range"
                    id="bga-slider"
                    min="0"
                    max="360"
                    value={bgaSliderValue}
                    onChange={(e) => setBgaSliderValue(Number(e.target.value))}
                />
                <input
                    onChange={(e) => setBgaSliderValue(Number(e.target.value))}
                    value={bgaSliderValue}
                    type="number"
                    min="0"
                    max="360"
                />
                <button type="submit" className="btn btn-primary">Set BGA</button>
                <button type="button" className="btn btn-primary" onClick={handleResetBga}>
                    Reset
                </button>
            </form>

            <h5 className="mb-3 mt-3 fw-bold">SARJ (Alpha) Angles</h5>
            <form onSubmit={handleSubmitSarj}>
                <div className="mb-3">
                    <label htmlFor="sarj-select" className="form-label">Select SARJ:</label>
                    <select
                        id="sarj-select"
                        className="form-select"
                        value={selectedSarj}
                        onChange={handleSarjSelection}
                    >
                        {SARJ_TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                <label htmlFor="sarj-slider">Select a value:</label>
                <input
                    type="range"
                    id="sarj-slider"
                    min="0"
                    max="360"
                    value={sarjSliderValue}
                    onChange={(e) => setSarjSliderValue(Number(e.target.value))}
                />
                <input
                    onChange={(e) => setSarjSliderValue(Number(e.target.value))}
                    value={sarjSliderValue}
                    type="number"
                    min="0"
                    max="360"
                />
                <button type="submit" className="btn btn-primary">Set SARJ</button>
                <button type="button" className="btn btn-primary" onClick={handleResetSarj}>
                    Reset
                </button>
            </form>
            <div className="small mt-2 text-white-50">
                SARJs only move the robot once SARJ_ENABLED is on in main.py.
            </div>
        </div>

        {/* What the mini ISS reports back */}
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
                    {/* Port side (left): BGA 1-4, turned by the port SARJ */}
                    <mesh rotation={[toRadians(angles[PORT_SARJ]), 0, 0]}>
                        {PANELS.filter((p) => p.bga < 4).map((p) => (
                            <SolarPanel3
                                key={p.bga}
                                position={[...p.position]}
                                rotation={[0, 0, toRadians(angles[p.bga])]}
                                color={p.color}
                            />
                        ))}
                    </mesh>

                    {/* Starboard side (right): BGA 5-8, turned by the starboard SARJ */}
                    <mesh rotation={[toRadians(angles[STARBOARD_SARJ]), 0, 0]}>
                        {PANELS.filter((p) => p.bga >= 4).map((p) => (
                            <SolarPanel3
                                key={p.bga}
                                position={[...p.position]}
                                rotation={[0, 0, toRadians(angles[p.bga])]}
                                color={p.color}
                            />
                        ))}
                    </mesh>
                </mesh>
                <OrbitControls />
            </Canvas>
        </div>
    </div>
    );
}
