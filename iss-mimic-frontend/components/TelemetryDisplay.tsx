'use client';

import { useTelemetry } from '../contexts/TelemetryContext';

// Simple component to display telemetry data in other pages
export default function TelemetryDisplay({ itemId, showLabel = true, className = "" }: { 
  itemId: string; 
  showLabel?: boolean;
  className?: string;
}) {
  const { telemetryItems } = useTelemetry();
  const telemetry = telemetryItems[itemId];
  
  if (!telemetry) {
    return <span className={className}>Loading...</span>;
  }
  
  return (
    <span className={className}>
      {showLabel && `${telemetry.name}: `}
      {telemetry.value}
      {telemetry.unit && ` ${telemetry.unit}`}
    </span>
  );
}
