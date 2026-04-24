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
  {id: "S0000003", name: "Starboard Solar Alpha Rotary Joint (SSARJ) Angle Position [°]"},
  { id: "S0000004", name: "Port Solar Alpha Rotary Joint (PSARJ) Angle Position [°]" },
  //{ id: "NODE3000005", name: "Urine Tank [%]" },
  
  { id: "S4000001", name: "1A: Voltage" },
  { id: "S4000002", name: "1A: Current" },
  { id: "S4000007", name: "1A: Angle" },

  { id: "P4000001", name: "2A: Voltage" },
  { id: "P4000002", name: "2A: Current" },
  { id: "P4000007", name: "2A: Angle" },

  { id: "S4000004", name: "3A: Voltage" },
  { id: "S4000005", name: "3A: Current" },
  { id: "S4000008", name: "3A: Angle" },

  { id: "S6000004", name: "4A: Voltage" },
  { id: "S6000005", name: "4A: Current" },
  { id: "S6000008", name: "4A: Angle" },

  { id: "S6000004", name: "1B: Voltage" },
  { id: "S6000005", name: "1B: Current" },
  { id: "S6000008", name: "1B: Angle" },

  { id: "P6000004", name: "2B: Voltage" },
  { id: "P6000005", name: "2B: Current" },
  { id: "P6000008", name: "2B: Angle" },

  { id: "S6000001", name: "3B: Voltage" },
  { id: "S6000002", name: "3B: Current" },
  { id: "S6000007", name: "3B: Angle" },

  { id: "P6000001", name: "4B: Voltage" },
  { id: "P6000002", name: "4B: Current" },
  { id: "P6000007", name: "4B: Angle" },

  { id: "NODE3000005", name: "Urine Tank [%]" },
  { id: "USLAB000059", name: "Cabin Temperature [°C]" },
  { id: "USLAB000058", name: "Cabin Pressure [torr]" },
  { id: "AIRLOCK000054", name: "Airlock Pressure [torr]" },
  { id: "AIRLOCK000049", name: "Crewlock Pressure [torr]" },
  { id: "NODE3000009", name: "Clean Water Tank [%]" },
  { id: "NODE3000008", name: "Waste Water Tank [%]" },
  { id: "NODE3000010", name: "Oxygen Generator State" },
  { id: "NODE3000011", name: "O2 Production Rate [lb/day]" },
  { id: "USLAB000062", name: "Vacuum Resource System Valve Position" },
  { id: "USLAB000063", name: "Vacuum Exhaust System Valve Position" },

  //{ id: "P4000008", name: "BGA 2" },
  //Deprecated: { id: "P6000007", name: "BGA 3" },
  //{ id: "P6000008", name: "BGA 4" },
  // Deprecated: { id: "S4000007", name: "BGA 5" },
  //{ id: "S4000008", name: "BGA 6" },
  // Deprecated: { id: "S6000007", name: "BGA 7" },
  //{ id: "S6000008", name: "BGA 8" },
  /*{ id: "S0000018", name: "CMG 1 Active" },
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
          //Check, it was no signal before
          setSignalStatus("Signal OK");
          setSignalClass("bg-success");
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
