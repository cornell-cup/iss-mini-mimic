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
  const [signalClass, setSignalClass] = useState<string>('bg-warning'); // For styling

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

  return (
    <div className="card shadow">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">ISS Telemetry Data</h5>
        <span className={`badge ${signalClass} text-white`}>
          {signalStatus}
        </span>
      </div>
      
      <div className="card-body">
        <div className="row row-cols-1 row-cols-md-2 g-4">
          {TELEMETRY_ITEMS.map(item => {
            const telemetry = telemetryItems[item.id];
            return (
              <div key={item.id} className="col">
                <div className="card h-100 bg-light">
                  <div className="card-body">
                    <h5 className="card-title" style={{ color: "black" }}>{item.name}</h5>
                    <p className="display-6 text-center text-mono" style={{ color: "black" }}>
                      {telemetry?.value || "Loading..."}
                      {telemetry?.unit && <small className="ms-1">{telemetry.unit}</small>}
                    </p>
                    <p className="card-text text-muted small text-center">
                      Timestamp: {telemetry?.timestamp || "Loading..."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-footer text-center text-white small" style={{ color: "white" }}>
        Live data from International Space Station via Lightstreamer
      </div>
    </div>
  );
}
