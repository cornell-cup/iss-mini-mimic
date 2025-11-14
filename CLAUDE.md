# ISS Mini Mimic - Codebase Guide for Claude

This document provides Claude with a comprehensive understanding of the ISS Mini Mimic project, enabling effective assistance with development, debugging, and feature implementation.

## Project Overview

**ISS Mini Mimic** is a real-time ISS (International Space Station) visualization and control system that combines live telemetry data, 3D visualization, and physical robotics integration. The system displays real ISS telemetry, mimics ISS solar panel movements in 3D, and controls an XRP robot to replicate ISS orientation.

### Core Technologies
- **Frontend**: Next.js 15.5.2 (React 19, TypeScript 5, Three.js, Tailwind CSS)
- **Backend**: MicroPython on XRP Robot platform
- **Communication**: Web Bluetooth API, Lightstreamer (real-time data)
- **Data Sources**: Celestrak (TLE data), Lightstreamer (ISS telemetry)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    ISS MINI MIMIC SYSTEM                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐       ┌──────────────────┐          │
│  │  Lightstreamer   │──────>│ TelemetryContext │          │
│  │  (ISS Data)      │       │  (Frontend)      │          │
│  └──────────────────┘       └────────┬─────────┘          │
│                                      │                     │
│  ┌──────────────────┐       ┌───────▼──────────┐          │
│  │  Celestrak API   │──────>│ IssPosition      │          │
│  │  (TLE Data)      │       │  Context         │          │
│  └──────────────────┘       └───────┬──────────┘          │
│                                      │                     │
│                             ┌────────▼──────────┐          │
│                             │  3D Visualization │          │
│                             │  (Three.js)       │          │
│                             └────────┬──────────┘          │
│                                      │                     │
│                             ┌────────▼──────────┐          │
│                             │ BluetoothContext  │          │
│                             │  (Web BLE API)    │          │
│                             └────────┬──────────┘          │
│                                      │                     │
│                             ┌────────▼──────────┐          │
│                             │   XRP Robot       │          │
│                             │  (MicroPython)    │          │
│                             └───────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
iss-mini-mimic/
├── iss-mimic-frontend/              # Next.js web application
│   ├── app/                          # Next.js App Router
│   │   ├── 3d-model/                # 3D visualization routes
│   │   │   ├── live_v2/             # Live telemetry v2
│   │   │   ├── live_v3/             # Live telemetry v3 (full panel control)
│   │   │   ├── live_v3_demo/        # Demo mode (random angles, 7s interval)
│   │   │   ├── manual/              # Basic manual control
│   │   │   ├── manual_v2/           # Manual control v2
│   │   │   └── manual_v3/           # Manual control v3 (smooth animations)
│   │   ├── map/                     # ISS position on Earth map
│   │   │   ├── page.tsx             # Live position
│   │   │   └── manual/              # Manual position control
│   │   ├── api/iss-position/        # ISS position calculation endpoint
│   │   ├── about/                   # About page
│   │   ├── layout.tsx               # Root layout with providers
│   │   └── page.tsx                 # Homepage - telemetry display
│   ├── components/                   # React components
│   │   ├── BluetoothConnectionInfo.tsx
│   │   ├── ISSDataExtended.tsx      # Main telemetry display
│   │   ├── Navbar.tsx
│   │   ├── PositionDisplay.tsx
│   │   ├── Room.tsx                 # 3D room with Earth texture
│   │   ├── Scene.tsx
│   │   ├── SolarPanel.tsx           # v1 solar panel mesh
│   │   ├── SolarPanel_v2.tsx
│   │   ├── SolarPanel_v3.tsx        # Latest version
│   │   └── TelemetryDisplay.tsx
│   ├── contexts/                     # React Context providers
│   │   ├── TelemetryContext.tsx     # ISS telemetry (Lightstreamer)
│   │   ├── BluetoothContext.tsx     # BLE connection management
│   │   └── IssPositionContext.tsx   # GPS coordinates
│   ├── types/
│   │   └── web-bluetooth.d.ts       # TypeScript definitions
│   ├── utils/
│   │   ├── robotPackets.ts          # Packet encoding for robot
│   │   └── Iss_Tle.json            # Cached TLE data
│   └── public/
│       └── Equirectangular_Earth.jpg
├── iss-mimic-backend/                # MicroPython for XRP robot
│   ├── main.py                       # Robot control loop
│   └── pestolink_adapted.py          # BLE communication protocol
└── iss_positioning_server/
    └── iss_position.py               # TLE-based position calculation
```

---

## Key Components Deep Dive

### Frontend Context Providers

#### 1. TelemetryContext (`contexts/TelemetryContext.tsx`)
**Purpose**: Manages real-time ISS telemetry data from Lightstreamer

**Key Features**:
- Connects to `https://push.lightstreamer.com`
- Subscribes to ISS sensor data (SARJ angles, BGA temperatures)
- Provides telemetry state to all child components

**Monitored Items**:
- `S0000003` - Starboard SARJ angle
- `S0000004` - Port SARJ angle
- `BGA1-BGA7` - Beta Gimbal Assembly temperatures
- `SIGNAL` - Connection status

**Usage Pattern**:
```typescript
const { telemetry, isConnected } = useTelemetry();
// telemetry contains current SARJ angles and BGA data
```

#### 2. BluetoothContext (`contexts/BluetoothContext.tsx`)
**Purpose**: Manages Web Bluetooth connection to XRP robot

**BLE Configuration**:
- Service UUID: `27df26c5-83f4-4864-bae0-d7b7cb0a1f54`
- Gamepad Characteristic: `452af57e-ad27-422c-88ae-76805ea641a9` (write)
- Telemetry Characteristic: `266d9d74-3e10-4fcd-88d2-cb63b5324d0c` (read/notify)

**Key Functions**:
- `connectToDevice()` - Initiates BLE connection
- `disconnectDevice()` - Terminates connection
- `sendGamepadData(angles)` - Sends servo control packet

**Usage Pattern**:
```typescript
const { isConnected, connectToDevice, sendGamepadData } = useBluetooth();
await sendGamepadData({ servoAngles: [angle1, angle2, angle3, angle4] });
```

#### 3. IssPositionContext (`contexts/IssPositionContext.tsx`)
**Purpose**: Provides ISS GPS coordinates (latitude/longitude)

**Features**:
- Fetches position every 10 seconds
- Uses backend API endpoint `/api/iss-position`
- Calculates position from TLE data via satellite.js

---

### Frontend Routes & Pages

#### 1. Homepage (`app/page.tsx`)
Displays current ISS telemetry in card layout with position information.

#### 2. 3D Model - Live v3 (`app/3d-model/live_v3/page.tsx`)
**Most Advanced Live Mode**
- Real-time 3D ISS model with 8 solar panels
- Panel color coding:
  - Green & Purple: Port side (SARJ 1)
  - Orange & Red: Starboard side (SARJ 2)
- Alpha rotation: Group rotation (SARJ angle)
- Beta rotation: Individual panel tilt (BGA angle)
- Automatically sends control packets to robot

#### 3. 3D Model - Demo (`app/3d-model/live_v3_demo/page.tsx`)
**Demonstration Mode**
- Random angle generation every 7 seconds
- Countdown timer display
- Manual regeneration button
- Same visualization as live_v3 but with simulated data

#### 4. 3D Model - Manual v3 (`app/3d-model/manual_v3/page.tsx`)
**Manual Control with Smooth Animations**
- Per-group alpha angle control (0-360°)
- Per-panel beta angle control (0-360°)
- Smooth 2° step animations every 50ms
- Dropdown selectors for group/panel
- Real-time slider controls

#### 5. Map - Live (`app/map/page.tsx`)
Displays ISS position on 2D Earth map visualization.

#### 6. Map - Manual (`app/map/manual/page.tsx`)
Manual X/Y/Z position control for ISS on map.

---

### Backend Components

#### 1. main.py (Robot Control Loop)
**Purpose**: Main MicroPython script running on XRP robot

**Key Functions**:
```python
# Reads BLE packets
button_state, button_state_two, servoAngles = ble.read()

# Controls 4 servos (SARJ simulation)
servo1.angle(servoAngles[0])  # Starboard SARJ
servo2.angle(servoAngles[1])  # Port SARJ
servo3.angle(servoAngles[2])  # BGA 1
servo4.angle(servoAngles[3])  # BGA 2
```

**Features**:
- Battery voltage monitoring
- Default servo positions when disconnected
- PID motor control (commented out, available for extension)

#### 2. pestolink_adapted.py (BLE Protocol)
**Purpose**: Bluetooth communication protocol implementation

**Packet Format (v2)**:
- Byte 0: Version (0x02)
- Bytes 1-2: Button states
- Bytes 3-4: Angle 1 (16-bit little-endian)
- Bytes 5-6: Angle 2
- ... up to 6 angles (26 bytes total)

**Key Features**:
- Supports v1 (14-byte) and v2 (26-byte) protocols
- Angle encoding: 0-360° mapped to 0-65535
- Auto-detects protocol version
- Telemetry transmission with color codes

---

## Data Flow Patterns

### Live Mode Data Flow
```
1. Lightstreamer → TelemetryContext (SARJ angles)
2. TelemetryContext → live_v3/page.tsx
3. Angles → SolarPanel components (3D visualization)
4. Angles → robotPackets.ts (encoding)
5. Encoded packet → BluetoothContext
6. BLE transmission → XRP Robot
7. Robot → Servo motors (physical movement)
```

### Manual Mode Data Flow
```
1. User input → Slider onChange
2. State update → setTargetAlpha/setTargetBeta
3. Animation loop → Step-based interpolation
4. Current angles → SolarPanel components
5. Current angles → robotPackets.ts
6. Encoded packet → BluetoothContext → Robot
```

---

## API Endpoints

### Frontend API Routes

#### GET `/api/iss-position`
**Purpose**: Calculate current ISS latitude/longitude

**Response**:
```json
{
  "position": {
    "lat": 51.234,
    "lon": -0.567,
    "timestamp": "2025-01-14T12:34:56.789Z"
  },
  "tleData": {
    "line1": "1 25544U 98067A   ...",
    "line2": "2 25544  51.6444 ...",
    "timestamp": "2025-01-14T10:00:00.000Z"
  }
}
```

**Logic**:
- Checks if cached TLE data is >8 hours old
- Fetches fresh TLE from Celestrak if needed
- Uses satellite.js for position calculation
- Updates `Iss_Tle.json` cache

---

## Robot Packet Protocol

### Encoding Function (`utils/robotPackets.ts`)

```typescript
export const encodePacket = (
  servoAngles: number[],
  buttonState: number = 0,
  buttonStateTwo: number = 0
): Uint8Array => {
  const packet = new Uint8Array(26);
  packet[0] = 0x02;  // Version byte
  packet[1] = buttonState;
  packet[2] = buttonStateTwo;

  for (let i = 0; i < 6; i++) {
    const angle = servoAngles[i] || 0;
    const angleValue = Math.round((angle / 360) * 65535);
    packet[3 + i * 2] = angleValue & 0xFF;        // Low byte
    packet[4 + i * 2] = (angleValue >> 8) & 0xFF; // High byte
  }

  return packet;
};
```

### Angle Mapping
- **Input**: 0-360 degrees
- **Encoding**: 16-bit unsigned integer (0-65535)
- **Formula**: `(angle / 360) * 65535`
- **Decoding (robot)**: `(value / 65535) * 360`

---

## Solar Panel Configuration

### Panel Organization
The ISS model has 8 solar panels organized in 2 groups (port and starboard):

#### Port Side (SARJ 1)
- **Group Alpha Rotation**: SARJ 1 angle (green/purple panels)
- **Panel 0 (Green)**: Individual beta rotation
- **Panel 1 (Purple)**: Individual beta rotation

#### Starboard Side (SARJ 2)
- **Group Alpha Rotation**: SARJ 2 angle (orange/red panels)
- **Panel 2 (Orange)**: Individual beta rotation
- **Panel 3 (Red)**: Individual beta rotation

### 3D Transformation Hierarchy
```
<group rotation={alpha}>  {/* SARJ rotation */}
  <SolarPanel position={[x, y, z]} rotation={[beta, 0, 0]} />
</group>
```

---

## Common Development Patterns

### Adding a New Telemetry Item
1. Update `TelemetryContext.tsx` subscription:
```typescript
client.subscribe(
  new Subscription("MERGE", ["S0000003", "S0000004", "NEW_ITEM"], fields)
);
```

2. Update telemetry state interface:
```typescript
interface Telemetry {
  // ... existing
  newItem: string | null;
}
```

3. Use in components:
```typescript
const { telemetry } = useTelemetry();
console.log(telemetry.newItem);
```

### Adding a New 3D Route
1. Create directory: `app/3d-model/my-new-mode/`
2. Create `page.tsx` with Canvas and Scene
3. Add SolarPanel components with desired control logic
4. Add navigation link in `Navbar.tsx`

### Modifying Robot Behavior
1. Edit `iss-mimic-backend/main.py`
2. Modify servo angle mappings or add motor control
3. Deploy to XRP robot via MicroPython IDE

---

## Debugging Tips

### Bluetooth Connection Issues
- Check browser support (Chrome/Edge recommended)
- Verify device is powered and advertising
- Check BLE UUID matches in both frontend and backend
- Monitor connection status via `BluetoothConnectionInfo` component

### Telemetry Not Updating
- Check Lightstreamer connection in browser console
- Verify item codes (e.g., S0000003) are correct
- Check signal status in telemetry data
- Test network connectivity

### 3D Visualization Issues
- Check Three.js version compatibility
- Verify angle calculations (degrees vs radians)
- Check mesh positioning and rotation order
- Test with manual mode to isolate data issues

### TLE Data Stale/Missing
- Check `/api/iss-position` response
- Verify Celestrak API accessibility
- Inspect `Iss_Tle.json` timestamp
- Check 8-hour cache expiration logic

---

## Testing Strategies

### Frontend Testing
```bash
npm run dev  # Start development server
# Navigate to different routes:
# - / (homepage)
# - /3d-model/live_v3 (live mode)
# - /3d-model/live_v3_demo (demo mode)
# - /3d-model/manual_v3 (manual control)
# - /map (live position)
```

### Robot Testing (Without Physical Robot)
- Use demo mode to test 3D visualization
- Use manual mode to verify angle calculations
- Test packet encoding with console logs
- Mock BLE connection for UI testing

### Integration Testing
1. Connect robot via Bluetooth
2. Use manual mode to verify servo response
3. Switch to live mode to test telemetry integration
4. Monitor robot servo movements match 3D visualization

---

## Environment Variables & Configuration

### Frontend Configuration Files
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript compiler options
- `tailwind.config.js` - Tailwind CSS customization
- `package.json` - Dependencies and scripts

### No Environment Variables Required
The application uses public APIs (Lightstreamer, Celestrak) with no authentication required.

---

## Recent Development Activity

### Current Branch: `feature/angleMotionMods`
**Modified Files**:
- `iss-mimic-backend/pestolink_adapted.py` - BLE protocol changes
- `iss-mimic-frontend/utils/Iss_Tle.json` - Updated TLE cache

**Recent Commits**:
- "merged" (latest)
- "slowing angular velocity"
- "Feature: 3D demo changes the angles every 7 secs"
- "Feature: 3d Model is now live with the new config for panels"

---

## Extension Opportunities

### Potential Features
1. **Historical Telemetry Tracking**: Log and visualize past SARJ angles
2. **Predictive ISS Pass Times**: Show when ISS will pass overhead
3. **Multi-Robot Support**: Control multiple robots simultaneously
4. **Mobile PWA**: Progressive Web App for mobile devices
5. **AR Mode**: Augmented reality ISS visualization
6. **More Telemetry Items**: Add power, atmospheric, and thermal data
7. **Custom Control Algorithms**: Implement PID control for smoother movements

### Code Extension Points
- Add new routes in `app/`
- Create new 3D components in `components/`
- Extend telemetry items in `TelemetryContext.tsx`
- Add new BLE characteristics in `pestolink_adapted.py`
- Implement custom robot behaviors in `main.py`

---

## Key Dependencies

### Frontend
```json
{
  "next": "15.5.2",
  "react": "19.1.0",
  "three": "0.180.0",
  "@react-three/fiber": "9.3.0",
  "@react-three/drei": "10.7.4",
  "lightstreamer-client-web": "9.2.3",
  "satellite.js": "6.0.1",
  "bootstrap": "5.3.8",
  "tailwindcss": "4"
}
```

### Backend (MicroPython)
- `XRPLib` - XRP robot platform library
- `machine` - Hardware control (servos, motors)
- `bluetooth` - BLE communication
- Standard library: `time`, `math`, `struct`

---

## Quick Reference

### Important File Locations
- **Live 3D Mode**: `iss-mimic-frontend/app/3d-model/live_v3/page.tsx`
- **Manual Control**: `iss-mimic-frontend/app/3d-model/manual_v3/page.tsx`
- **Demo Mode**: `iss-mimic-frontend/app/3d-model/live_v3_demo/page.tsx`
- **Telemetry Logic**: `iss-mimic-frontend/contexts/TelemetryContext.tsx`
- **Bluetooth Logic**: `iss-mimic-frontend/contexts/BluetoothContext.tsx`
- **Packet Encoding**: `iss-mimic-frontend/utils/robotPackets.ts`
- **Robot Main Loop**: `iss-mimic-backend/main.py`
- **BLE Protocol**: `iss-mimic-backend/pestolink_adapted.py`

### Key Constants
- **BLE Service UUID**: `27df26c5-83f4-4864-bae0-d7b7cb0a1f54`
- **Packet Version**: `0x02` (v2 protocol)
- **Packet Size**: 26 bytes
- **Max Servos**: 6 angles supported
- **Position Update Interval**: 10 seconds
- **Demo Angle Update**: 7 seconds
- **Animation Step**: 2 degrees per 50ms

### Color Codes
- **Green**: Port side panel 0
- **Purple**: Port side panel 1
- **Orange**: Starboard side panel 2
- **Red**: Starboard side panel 3

---

## Conclusion

This codebase demonstrates a sophisticated integration of web technologies, real-time data streaming, 3D visualization, and embedded robotics. The architecture is modular and extensible, with clear separation of concerns between data acquisition, visualization, and robot control layers.

When assisting with this project, focus on:
1. Maintaining type safety (TypeScript)
2. Preserving the packet protocol structure
3. Ensuring smooth 3D animations
4. Handling connection errors gracefully
5. Testing with both simulated and live data

For questions or clarifications about specific components, refer to the detailed sections above or examine the source code directly.
