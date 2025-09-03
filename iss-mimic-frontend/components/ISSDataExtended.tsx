'use client';

import { useEffect, useState } from 'react';
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

// List of telemetry items to monitor
const TELEMETRY_ITEMS = [
  { id: "S0000004", name: "ADCO State Vector TLM Flag" },
];

export default function ISSDataExtended() {
  // State variables to store the telemetry data
  const [telemetryItems, setTelemetryItems] = useState<Record<string, TelemetryItem>>({});
  const [signalStatus, setSignalStatus] = useState<string>('Connecting...');
  const [signalClass, setSignalClass] = useState<string>('bg-yellow-500'); // For styling

  useEffect(() => {
    // Initialize the Lightstreamer client
    const lsClient = new LightstreamerClient("https://push.lightstreamer.com", "ISSLIVE");
    lsClient.connectionOptions.setSlowingEnabled(false);

    // Create a subscription for all telemetry items
    const telemetryIds = TELEMETRY_ITEMS.map(item => item.id);
    const telemetrySub = new Subscription("MERGE", telemetryIds, ["TimeStamp", "Value"]);

    // Create a subscription for the time signal
    const timeSub = new Subscription('MERGE', 'TIME_000001', ['TimeStamp', 'Value', 'Status.Class', 'Status.Indicator']);

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
            setSignalClass("bg-yellow-500");
          } else {
            setSignalStatus("Signal Acquired");
            setSignalClass("bg-green-500");
          }
        } else {
          setSignalStatus("Signal Lost");
          setSignalClass("bg-red-500");
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

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">ISS Telemetry Data</h2>
        <span className={`px-3 py-1 rounded-full text-white ${signalClass}`}>
          {signalStatus}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TELEMETRY_ITEMS.map(item => {
          const telemetry = telemetryItems[item.id];
          return (
            <div key={item.id} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">{item.name}</h3>
              <p className="text-2xl font-mono text-center">
                {telemetry?.value || "Loading..."}
                {telemetry?.unit && <span className="text-sm ml-1">{telemetry.unit}</span>}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Timestamp: {telemetry?.timestamp || "Loading..."}
              </p>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
        Live data from International Space Station via Lightstreamer
      </div>
    </div>
  );
}
