'use client';

import { useEffect, useState } from 'react';
import { useBluetooth } from '../contexts/BluetoothContext';
import { useTelemetry } from '../contexts/TelemetryContext';

// The robot reports every 500 ms; older than this means it stopped reporting
const STALE_AFTER_MS = 3000;

// Each row: label, real ISS telemetry id, and where its value sits in the robot report
const JOINTS = [
  { label: 'Starboard SARJ', itemId: 'S0000003', sarj: 0 },
  { label: 'Port SARJ', itemId: 'S0000004', sarj: 1 },
  { label: 'BGA 1', itemId: 'P4000007', servo: 0 },
  { label: 'BGA 2', itemId: 'P4000008', servo: 1 },
  { label: 'BGA 3', itemId: 'P6000007', servo: 2 },
  { label: 'BGA 4', itemId: 'P6000008', servo: 3 },
  { label: 'BGA 5', itemId: 'S4000007', servo: 4 },
  { label: 'BGA 6', itemId: 'S4000008', servo: 5 },
  { label: 'BGA 7', itemId: 'S6000007', servo: 6 },
  { label: 'BGA 8', itemId: 'S6000008', servo: 7 },
];

const formatAngle = (angle: number | null | undefined) =>
  angle == null ? '—' : `${angle.toFixed(1)}°`;

// Real ISS values side by side with what the mini ISS reports doing
export default function MiniIssTelemetry() {
  const { isConnected, robotJoints } = useBluetooth();
  const { telemetryItems } = useTelemetry();

  // Re-render once a second so the stale check notices when reports stop
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  let status = 'Not connected';
  if (isConnected) {
    if (!robotJoints) status = 'Waiting for robot…';
    else if (now - robotJoints.receivedAt > STALE_AFTER_MS) status = 'Robot stopped reporting';
    else status = 'Live';
  }

  return (
    <>
      <h5 className="mb-1 fw-bold">Mini ISS</h5>
      <div className="small mb-2 text-white-50">{status}</div>
      <table className="table table-sm table-dark mb-0 small" style={{ background: 'transparent' }}>
        <thead>
          <tr>
            <th>Joint</th>
            <th className="text-end">Real ISS</th>
            <th className="text-end">Mini ISS</th>
          </tr>
        </thead>
        <tbody>
          {JOINTS.map((joint) => {
            const real = telemetryItems[joint.itemId]?.value;
            const mini = joint.servo !== undefined
              ? robotJoints?.servoAngles[joint.servo]
              : robotJoints?.sarjAngles[joint.sarj ?? 0];
            // SARJs report null while the motors are switched off in main.py
            const miniText = robotJoints && mini == null && joint.sarj !== undefined
              ? 'off'
              : formatAngle(mini);
            return (
              <tr key={joint.itemId}>
                <td>{joint.label}</td>
                <td className="text-end">{real ? formatAngle(Number(real)) : '—'}</td>
                <td className="text-end">{miniText}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="small mt-2 text-white-50">
        BGA = servo angle the robot commanded (0–180°); servos can&apos;t report their real position.
      </div>
    </>
  );
}
