"use client";

import { createContext, useState, useContext, useEffect, useCallback, useRef, ReactNode, JSX } from 'react';

// BLE UUIDs
const SERVICE_UUID_PESTOBLE = '27df26c5-83f4-4964-bae0-d7b7cb0a1f54';
const CHARACTERISTIC_UUID_GAMEPAD = '452af57e-ad27-422c-88ae-76805ea641a9';
const CHARACTERISTIC_UUID_TELEMETRY = '266d9d74-3e10-4fcd-88d2-cb63b5324d0c';

interface BluetoothContextType {
  isConnected: boolean;
  connecting: boolean;
  connectionStatus: string;
  statusColor: string;
  telemetryData: string;
  connectToDevice: () => Promise<void>;
  disconnectFromDevice: () => Promise<void>;
  sendPacket: (byteArray: number[] | Uint8Array) => void;
}

// Create context with a default value
const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

interface BluetoothProviderProps {
  children: ReactNode;
}

export function BluetoothProvider({ children }: BluetoothProviderProps): JSX.Element {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Not Connected');
  const [statusColor, setStatusColor] = useState<string>('black');
  const [telemetryData, setTelemetryData] = useState<string>('No Data');
  const [connecting, setConnecting] = useState<boolean>(false);
  
  // Use refs to persist these objects across renders
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const gamepadCharacteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const telemetryCharacteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  // Handle telemetry data updates
  const handleTelemetryCharacteristic = useCallback((event: Event): void => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (!value) return;
    
    let asciiString = '';
    for (let i = 0; i < Math.min(8, value.byteLength); i++) {
      asciiString += String.fromCharCode(value.getUint8(i));
    }
    setTelemetryData(asciiString);
  }, []);

  // Handle device disconnection
  const handleDisconnection = useCallback((): void => {
    console.log('Device disconnected');
    setIsConnected(false);
    setConnectionStatus('Not Connected');
    setStatusColor('black');
    // Optional: Auto-reconnect logic here
  }, []);

  // Connect to the device
  const connectToDevice = useCallback(async (): Promise<void> => {
    if (connecting || isConnected) return;
    
    try {
      setConnecting(true);
      setConnectionStatus('Connecting');
      setStatusColor('black');
      
      // Use existing device or request a new one
      if (!deviceRef.current) {
        if (!navigator.bluetooth) {
          throw new Error('Web Bluetooth API not supported in this browser');
        }
        
        const selectedDevice = await navigator.bluetooth.requestDevice({ 
          filters: [{ services: [SERVICE_UUID_PESTOBLE] }] 
        });
        deviceRef.current = selectedDevice;
      }
      
      const server = await deviceRef.current.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }
      
      const service = await server.getPrimaryService(SERVICE_UUID_PESTOBLE);
      
      // Connect to the gamepad characteristic
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID_GAMEPAD);
      gamepadCharacteristicRef.current = characteristic;
      
      // Connect to telemetry if available
      try {
        const telemetryCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID_TELEMETRY);
        await telemetryCharacteristic.startNotifications();
        telemetryCharacteristic.addEventListener('characteristicvaluechanged', handleTelemetryCharacteristic);
        telemetryCharacteristicRef.current = telemetryCharacteristic;
      } catch (err) {
        console.log("Telemetry characteristic not available.");
      }
      
      // Set up disconnect handler
      deviceRef.current.addEventListener('gattserverdisconnected', handleDisconnection);
      
      setIsConnected(true);
      setConnectionStatus(`Connected to ${deviceRef.current.name}`);
      setStatusColor('#4dae50'); // green
    } catch (error) {
      console.error('Connection error:', error);
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          setConnectionStatus('No Device Selected');
        } else {
          setConnectionStatus(`Connection Failed: ${error.message}`);
        }
      } else {
        setConnectionStatus('Connection Failed');
      }
      setStatusColor('#eb5b5b'); // red
    } finally {
      setConnecting(false);
    }
  }, [connecting, isConnected, handleTelemetryCharacteristic, handleDisconnection]);

  // Disconnect from the device
  const disconnectFromDevice = useCallback(async (): Promise<void> => {
    if (!deviceRef.current || connecting || !isConnected) return;
    
    try {
      setConnecting(true);
      setConnectionStatus('Disconnecting');
      setStatusColor('gray');
      
      if (telemetryCharacteristicRef.current) {
        await telemetryCharacteristicRef.current.stopNotifications();
        telemetryCharacteristicRef.current.removeEventListener(
          'characteristicvaluechanged', 
          handleTelemetryCharacteristic
        );
        telemetryCharacteristicRef.current = null;
      }
      
      deviceRef.current.removeEventListener('gattserverdisconnected', handleDisconnection);
      
      if (deviceRef.current.gatt?.connected) {
        await deviceRef.current.gatt.disconnect();
      }
      
      setIsConnected(false);
      setConnectionStatus('Not Connected');
      setStatusColor('black');
    } catch (error) {
      console.error('Disconnection error:', error);
      setConnectionStatus('Error Disconnecting');
      setStatusColor('#eb5b5b');
    } finally {
      setConnecting(false);
    }
  }, [connecting, isConnected, handleDisconnection, handleTelemetryCharacteristic]);

  // Send data packet to the robot
  const sendPacket = useCallback((byteArray: number[] | Uint8Array): void => {
    if (!isConnected || !gamepadCharacteristicRef.current) return;
  
  try {
    // Create a new Uint8Array with standard ArrayBuffer backing
    const data = new Uint8Array(
      byteArray instanceof Uint8Array 
        ? Array.from(byteArray) // Convert to regular array first
        : byteArray
    );
      
    gamepadCharacteristicRef.current.writeValueWithoutResponse(data);
  } catch (error) {
    console.error('Error sending data:', error);
  }
  }, [isConnected]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (deviceRef.current && isConnected) {
        // Just remove event listener without disconnecting
        deviceRef.current.removeEventListener('gattserverdisconnected', handleDisconnection);
      }
    };
  }, [isConnected, handleDisconnection]);

  // Provide values and functions
  const value: BluetoothContextType = {
    isConnected,
    connecting,
    connectionStatus,
    statusColor,
    telemetryData,
    connectToDevice,
    disconnectFromDevice,
    sendPacket,
  };

  return (
    <BluetoothContext.Provider value={value}>
      {children}
    </BluetoothContext.Provider>
  );
}

// Custom hook to use the Bluetooth context
export function useBluetooth(): BluetoothContextType {
  const context = useContext(BluetoothContext);
  if (context === undefined) {
    throw new Error('useBluetooth must be used within a BluetoothProvider');
  }
  return context;
}