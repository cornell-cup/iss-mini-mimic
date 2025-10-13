import ephem
from datetime import datetime, timezone
import math
import requests

def get_latest_iss_tle():
    """Fetch the latest ISS TLE data from Celestrak."""
    try:
        response = requests.get('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE')
        if response.status_code == 200:
            tle_data = response.text.strip().split('\n')
            return {
                "ISS_TLE_Line1": tle_data[1],
                "ISS_TLE_Line2": tle_data[2],
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        else:
            raise Exception(f"Failed to fetch TLE data: Status code {response.status_code}")
    except Exception as e:
        print(f"Error fetching TLE data: {e}")
        # Fall back to stored TLE if network fetch fails
        return {"ISS_TLE_Line1": "1 25544U 98067A   23309.60400512  .00020365  00000+0  36212-3 0  9997",
                "ISS_TLE_Line2": "2 25544  51.6449 348.0623 0001122  73.1629  30.1676 15.50139045423725", 
                "timestamp": "2023-11-05T14:55:24.546327"}

# Get current TLE data
lines = get_latest_iss_tle()

satellite = ephem.readtle("ISS (ZARYA)", lines["ISS_TLE_Line1"], lines["ISS_TLE_Line2"])

dt = datetime.now(timezone.utc)
print(f"Current time (UTC): {dt}")
print(f"TLE epoch: {lines['timestamp']}")
satellite.compute(dt)

# Get latitude and longitude in degrees
lat = math.degrees(satellite.sublat)
lon = math.degrees(satellite.sublong)

print(f"ISS Position - Latitude: {lat:.6f}, Longitude: {lon:.6f}")