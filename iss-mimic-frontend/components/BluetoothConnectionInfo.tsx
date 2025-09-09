"use client";

import { JSX } from 'react';
import { useBluetooth } from '../contexts/BluetoothContext';
import styles from './XrpRobotConnect.module.css';

export default function XrpRobotConnect(): JSX.Element {
  const { 
    isConnected, 
    connecting, 
    connectionStatus, 
    statusColor, 
    telemetryData,
    connectToDevice, 
    disconnectFromDevice 
  } = useBluetooth();

  const toggleConnection = (): void => {
    if (isConnected) {
      disconnectFromDevice();
    } else {
      connectToDevice();
    }
  };

  return (
    <div className={styles.xrpContainer}>
      <button 
        className={`${styles.connectButton} ${isConnected ? styles.connected : ''}`}
        onClick={toggleConnection}
        disabled={connecting}
      >
        {isConnected ? 'Connected' : 'Connect'}
      </button>
      <div 
        className={styles.statusDisplay}
        style={{ backgroundColor: statusColor }}
      >
        {connectionStatus}
      </div>
      <div className={styles.telemetryDisplay}>
        {telemetryData}
      </div>
    </div>
  );
}