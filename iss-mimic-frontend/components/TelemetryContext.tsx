'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { LightstreamerClient, Subscription } from 'lightstreamer-client-web';

// Define types for the update parameter
interface ItemUpdate {
  getValue: (fieldName: string) => string;
  getItemName: () => string;
}

// Define the structure for telemetry items
interface TelemetryItem {
  id: string;
  name: string;
  value: string;
  timestamp: string;
  unit?: string;
}

// Define what data we'll provide through the context
interface TelemetryContextType {
  telemetryItems: Record<string, TelemetryItem>;
  signalStatus: string;
  signalClass: string;
  isConnected: boolean;
}

// List of telemetry items to monitor
export const TELEMETRY_ITEMS = [
  { id: "S0000004", name: "ADCO State Vector TLM Flag" },
  /*{ id: "S0000005", name: "ADCO Attitude TLM Flag" },
  { id: "S0000018", name: "CMG 1 Active" },
  { id: "S0000019", name: "CMG 2 Active" },
  { id: "S0000020", name: "CMG 3 Active" },
  { id: "S0000021", name: "CMG 4 Active" },
  { id: "USLAB000018", name: "Cabin Temperature", unit: "°C" },
  { id: "USLAB000024", name: "Cabin Pressure", unit: "mmHg" },
  { id: "NODE3000002", name: "O2 Partial Pressure", unit: "mmHg" },
  { id: "NODE3000003", name: "CO2 Partial Pressure", unit: "mmHg" },*/
];

// Create the context with default values
const TelemetryContext = createContext<TelemetryContextType>({
  telemetryItems: {},
  signalStatus: 'Disconnected',
  signalClass: 'bg-warning',
  isConnected: false,
});

// Function to calculate current timestamp similar to the original code
const calculateCurrentTimestamp = () => {
  const date = new Date();
  const hoursUTC = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  
  const yearFirstDay = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - yearFirstDay.getTime()) / 86400000) + 1;
  
  return dayOfYear * 24 + hoursUTC + minutes / 60 + seconds / 3600;
};

// Provider component that will wrap your app and make telemetry data available
export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [telemetryItems, setTelemetryItems] = useState<Record<string, TelemetryItem>>({});
  const [signalStatus, setSignalStatus] = useState<string>('Connecting...');
  const [signalClass, setSignalClass] = useState<string>('bg-warning');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  useEffect(() => {
    // Initialize the Lightstreamer client
    const lsClient = new LightstreamerClient("https://push.lightstreamer.com", "ISSLIVE");
    lsClient.connectionOptions.setSlowingEnabled(false);

    // Create a subscription for all telemetry items
    const telemetryIds = TELEMETRY_ITEMS.map(item => item.id);
    const telemetrySub = new Subscription("MERGE", telemetryIds, ["TimeStamp", "Value"]);

    // Create a subscription for the time signal
    const timeSub = new Subscription('MERGE', 'TIME_000001', ['TimeStamp', 'Value', 'Status.Class', 'Status.Indicator']);

    // Add connection status listener
    lsClient.addListener({
      onStatusChange: function(status) {
        console.log(`Connection status: ${status}`);
        setIsConnected(status === "CONNECTED:STREAM-SENSING");
      }
    });

    // Add listener for the telemetry data
    telemetrySub.addListener({
      onSubscription: function() {
        console.log("Subscribed to telemetry data");
      },
      onUnsubscription: function() {
        console.log("Unsubscribed from telemetry data");
      },
      onItemUpdate: function(update: ItemUpdate) {
        const itemId = update.getItemName();
        const timestamp = update.getValue("TimeStamp");
        const value = update.getValue("Value");
        
        // Find the item in our list
        const itemInfo = TELEMETRY_ITEMS.find(item => item.id === itemId);
        
        if (itemInfo) {
          setTelemetryItems(prev => ({
            ...prev,
            [itemId]: {
              id: itemId,
              name: itemInfo.name,
              value: value,
              timestamp: timestamp,
              //unit: itemInfo.unit
            }
          }));
        }
      }
    });

    // Add listener for the signal status
    timeSub.addListener({
      onItemUpdate: function(update: ItemUpdate) {
        const status = update.getValue('Status.Class');
        const aosTimestamp = parseFloat(update.getValue('TimeStamp'));
        const currentTimestamp = calculateCurrentTimestamp();
        const difference = currentTimestamp - aosTimestamp;
        
        if (status === '24') {
          if (difference > 0.00153680542553047) {
            setSignalStatus("Stale Signal");
            setSignalClass("bg-warning");
          } else {
            setSignalStatus("Signal Acquired");
            setSignalClass("bg-success");
          }
        } else {
          setSignalStatus("Signal Lost");
          setSignalClass("bg-danger");
        }
      }
    });

    // Subscribe and connect
    lsClient.subscribe(telemetrySub);
    lsClient.subscribe(timeSub);
    lsClient.connect();

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      if (lsClient.getStatus() !== 'DISCONNECTED') {
        lsClient.unsubscribe(telemetrySub);
        lsClient.unsubscribe(timeSub);
        lsClient.disconnect();
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // The value that will be given to the context
  const value = {
    telemetryItems,
    signalStatus,
    signalClass,
    isConnected
  };

  // Return provider with the value passed to it
  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
}

// Export the custom hook that will be used to access the context
export function useTelemetry() {
  return useContext(TelemetryContext);
}
