"use client";

import { useState, useEffect } from 'react';
import { useBluetooth } from '@/contexts/BluetoothContext';
import { createRobotPacket, setButtonBit } from '@/utils/robotPackets';
import styles from './SimpleRobotControls.module.css';

export default function SimpleRobotControls() {
  const { isConnected, sendPacket } = useBluetooth();
  const [buttonStates, setButtonStates] = useState<number>(0);
  
  // Example of sending custom packets
  const moveRobot = (direction: 'forward' | 'backward' | 'left' | 'right' | 'stop') => {
    if (!isConnected) return;
    
    let axisValues = { angle0: 0, angle1: 0, angle2: 0, angle3: 0};
    
    switch (direction) {
      case 'forward':
        axisValues.angle1 = 90; // Full forward
        break;
      case 'backward':
        axisValues.angle1 = 180; // Full backward
        break;
      case 'left':
        axisValues.angle0 = 270; // Full left
        break;
      case 'right':
        axisValues.angle0 = 360; // Full right
        break;
      case 'stop':
      default:
        // Keep all axes at center
        break;
    }
    
    const packet = createRobotPacket({ 
      angles: axisValues,
      buttons: { byte0: 1 } 
    });
    console.log("Sending packet:", packet);
    sendPacket(packet);
  };
  
  const toggleButton = (buttonIndex: number) => {
    const newButtonStates = setButtonBit(buttonStates, buttonIndex, !(buttonStates & (1 << buttonIndex)));
    setButtonStates(newButtonStates);
    
    // Send the updated button states
    const packet = createRobotPacket({ 
      buttons: { byte0: newButtonStates }
    });
    console.log("Sending packet:", packet);
    sendPacket(packet);
  };
  
  return (
    <div className={styles.controls}>
      <h2>Robot Controls</h2>
      
      <div className={styles.directionPad}>
        <button 
          onClick={() => moveRobot('forward')}
          disabled={!isConnected}
        >
          Forward
        </button>
        
        <div className={styles.middleRow}>
          <button 
            onClick={() => moveRobot('left')}
            disabled={!isConnected}
          >
            Left
          </button>
          
          <button 
            onClick={() => moveRobot('stop')}
            disabled={!isConnected}
          >
            Stop
          </button>
          
          <button 
            onClick={() => moveRobot('right')}
            disabled={!isConnected}
          >
            Right
          </button>
        </div>
        
        <button 
          onClick={() => moveRobot('backward')}
          disabled={!isConnected}
        >
          Backward
        </button>
      </div>
      
      <div className={styles.buttonControls}>
        <h3>Action Buttons</h3>
        <div className={styles.buttonGrid}>
          {[0, 1, 2, 3].map(index => (
            <button
              key={index}
              className={(buttonStates & (1 << index)) ? styles.active : ''}
              onClick={() => toggleButton(index)}
              disabled={!isConnected}
            >
              Button {index}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}