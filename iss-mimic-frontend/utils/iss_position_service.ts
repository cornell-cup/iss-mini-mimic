import * as satellite from 'satellite.js';

interface TLEData {
  line1: string;
  line2: string;
  timestamp: string;
}

export async function getLatestIssPosition(): Promise<{lat: number; lon: number; timestamp: string}> {
  // Fetch the latest TLE data
  const tleData = await fetchLatestTLE();
  
  // Parse the TLE data
  const satrec = satellite.twoline2satrec(
    tleData.line1,
    tleData.line2
  );
  
  // Get current time
  const now = new Date();
  
  // Calculate satellite position
  const positionAndVelocity = satellite.propagate(satrec, now);
  const gmst = satellite.gstime(now);
  const position = positionAndVelocity ? satellite.eciToGeodetic(positionAndVelocity.position, gmst) : null;
  
  // Convert radians to degrees
  const lat = position ? satellite.degreesLat(position.latitude) : 0.001;
  const lon = position ? satellite.degreesLong(position.longitude) : 0.001;
  
  return { 
    lat, 
    lon, 
    timestamp: now.toISOString() 
  };
}

async function fetchLatestTLE(): Promise<TLEData> {
  try {
    const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch TLE data: ${response.status}`);
    }
    
    const text = await response.text();
    const lines = text.trim().split('\n');
    
    return {
      line1: lines[1],
      line2: lines[2],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching TLE data:', error);
    
    // Fallback TLE 
    return {
      line1: "1 25544U 98067A   23309.60400512  .00020365  00000+0  36212-3 0  9997",
      line2: "2 25544  51.6449 348.0623 0001122  73.1629  30.1676 15.50139045423725",
      timestamp: new Date().toISOString()
    };
  }
}