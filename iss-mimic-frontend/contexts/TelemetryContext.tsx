'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  {id: "S0000003", name: "Starboard Solar Alpha Rotary Joint (SARJ) Angle Position [°]"},
  { id: "S0000004", name: "Port Solar Alpha Rotary Joint (SARJ) Angle Position [°]" },
  //{ id: "NODE3000005", name: "Urine Tank [%]" },
  { id: "P4000007", name: "BGA 1" },
  //{ id: "P4000008", name: "BGA 2" },
  { id: "P6000007", name: "BGA 3" },
  //{ id: "P6000008", name: "BGA 4" },
  { id: "S4000007", name: "BGA 5" },
  //{ id: "S4000008", name: "BGA 6" },
  { id: "S6000007", name: "BGA 7" },
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

// If no telemetry or time update arrives for this long, the ISS is assumed to be
// in Loss of Signal (LOS) — out of contact with the ground relay. The TIME_000001
// signal normally ticks about once a second, so several seconds of total silence
// reliably indicates LOS (or an ISSLIVE outage) rather than a slow connection.
const LOS_TIMEOUT_MS = 10000;
const LOS_CHECK_INTERVAL_MS = 3000;

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
  // Timestamp (ms) of the last update received from any subscription. Used to
  // detect LOS: if this stops advancing, no data is flowing.
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    const markActivity = () => { lastUpdateRef.current = Date.now(); };

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
        // Lightstreamer reports several "CONNECTED:*" variants (WS-STREAMING,
        // HTTP-STREAMING, STREAM-SENSING, etc.); treat any of them as connected.
        setIsConnected(status.startsWith("CONNECTED:"));
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
        markActivity();
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
        markActivity();
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

    // Watchdog: if no update has arrived for LOS_TIMEOUT_MS, the feed is silent.
    // During LOS the TIME signal stops too, so its own staleness handler never
    // fires — this catches that case and shows an explicit "No Signal (LOS)"
    // state instead of leaving the UI stuck on "Connecting..." / "Loading...".
    const losWatchdog = setInterval(() => {
      if (Date.now() - lastUpdateRef.current > LOS_TIMEOUT_MS) {
        setSignalStatus("No Signal (LOS)");
        setSignalClass("bg-danger");
      }
    }, LOS_CHECK_INTERVAL_MS);

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      clearInterval(losWatchdog);
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
