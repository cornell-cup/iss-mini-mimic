import { NextResponse } from 'next/server';
import * as satellite from 'satellite.js';
import fs from 'fs';
import path from 'path';

interface ISSJsonData {
  ISS_TLE_Line1: string;
  ISS_TLE_Line2: string;
  timestamp: string;
}

export async function GET() {
  try {
    // 1. Read from JSON or fetch new TLE data if needed
    const jsonFilePath = path.resolve(process.cwd(), './utils/Iss_Tle.json');
    let jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8')) as ISSJsonData;
    
    const storedTimestamp = new Date(jsonData.timestamp);
    const currentTime = new Date();
    const eightHoursInMs = 8 * 60 * 60 * 1000;
    
    // Refresh TLE data if older than 8 hours
    if ((currentTime.getTime() - storedTimestamp.getTime()) > eightHoursInMs) {
      const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE');
      
      if (response.ok) {
        const text = await response.text();
        const lines = text.trim().split('\n');
        
        jsonData = {
          ISS_TLE_Line1: lines[1],
          ISS_TLE_Line2: lines[2],
          timestamp: currentTime.toISOString()
        };
        
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
      }
    }
    
    // 2. Calculate ISS position
    const satrec = satellite.twoline2satrec(
      jsonData.ISS_TLE_Line1,
      jsonData.ISS_TLE_Line2
    );
    
    const positionAndVelocity = satellite.propagate(satrec, currentTime);
    const gmst = satellite.gstime(currentTime);
    const position = positionAndVelocity ? satellite.eciToGeodetic(positionAndVelocity.position, gmst) : null;
    
    const lat = position ? satellite.degreesLat(position.latitude) : 0.001;
    const lon = position ? satellite.degreesLong(position.longitude) : 0.001;
    
    // 3. Return both TLE data and calculated position
    return NextResponse.json({
      position: {
        lat,
        lon,
        timestamp: currentTime.toISOString()
      },
      tleData: {
        line1: jsonData.ISS_TLE_Line1,
        line2: jsonData.ISS_TLE_Line2,
        timestamp: jsonData.timestamp
      }
    });
  } catch (error) {
    console.error('Error handling ISS position data:', error);
    return NextResponse.json({ error: 'Failed to get ISS position' }, { status: 500 });
  }
}