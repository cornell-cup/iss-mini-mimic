'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
//import { getLatestIssPosition } from '@/utils/iss_position_service';

interface IssPosition {
  lat: number;
  lon: number;
  timestamp: string;
}

interface IssPositionContextType {
  position: IssPosition | null;
  isLoading: boolean;
  error: string | null;
  refreshPosition: () => Promise<void>;
}

const IssPositionContext = createContext<IssPositionContextType | undefined>(undefined);

export function IssPositionProvider({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState<IssPosition | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const refreshPosition = async () => {
    setIsLoading(true);
    setError(null);
    try {
    const response = await fetch('/api/iss-position');
    if (!response.ok) throw new Error('Failed to fetch ISS position');
    const data = await response.json();
    setPosition(data.position);
  } catch (err) {
    console.error('Failed to fetch ISS position:', err);
    setError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    setIsLoading(false);
  }
  };
  
  useEffect(() => {
    refreshPosition();
    
    // Update position every 10 secs
    const interval = setInterval(refreshPosition, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <IssPositionContext.Provider value={{ position, isLoading, error, refreshPosition }}>
      {children}
    </IssPositionContext.Provider>
  );
}

export function useIssPosition() {
  const context = useContext(IssPositionContext);
  if (context === undefined) {
    throw new Error('useIssPosition must be used within an IssPositionProvider');
  }
  return context;
}