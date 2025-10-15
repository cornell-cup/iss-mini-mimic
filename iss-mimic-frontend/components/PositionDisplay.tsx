'use client';

import { useIssPosition } from "@/contexts/IssPositionContext";

type CoordinateType = 'lat' | 'lon';

export default function PositionDisplay({ 
  coordinate, 
  showLabel = true, 
  className = "",
  decimals = 4
}: { 
  coordinate: CoordinateType;
  showLabel?: boolean;
  className?: string;
  decimals?: number;
}) {
  const { position, isLoading } = useIssPosition();
  
  if (isLoading || !position) {
    return <span className={className}>Loading...</span>;
  }

  const value = position[coordinate].toFixed(decimals);
  const unit = '°';
  const label = coordinate === 'lat' ? 'Latitude' : 'Longitude';
  const direction = coordinate === 'lat' 
    ? (position[coordinate] >= 0 ? 'N' : 'S') 
    : (position[coordinate] >= 0 ? 'E' : 'W');
  
  return (
    <span className={className}>
      {showLabel && `${label}: `}
      {value}
      {unit} {direction}
    </span>
  );
}