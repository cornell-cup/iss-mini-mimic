# ISS Mini Mimic - Codebase Documentation for Gemini

## Executive Summary

**Project Name**: ISS Mini Mimic
**Type**: Real-time ISS visualization and robotics control system
**Tech Stack**: Next.js 15 + TypeScript + Three.js + MicroPython
**Purpose**: Educational platform that displays live ISS telemetry, visualizes ISS orientation in 3D, and controls physical robot to mimic ISS movements

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [API Reference](#api-reference)
7. [Communication Protocols](#communication-protocols)
8. [Development Guide](#development-guide)
9. [Troubleshooting](#troubleshooting)
10. [Extension Points](#extension-points)

---

## System Architecture

### High-Level Overview

The ISS Mini Mimic system consists of three main layers:

1. **Data Acquisition Layer**
   - Lightstreamer: Real-time ISS telemetry (SARJ angles, BGA temperatures)
   - Celestrak API: ISS orbital elements (TLE data)
   - Update frequencies: Telemetry (real-time), Position (10s intervals)

2. **Visualization Layer**
   - Next.js web application with React 19
   - Three.js 3D rendering engine
   - Multiple viewing modes: Live, Demo, Manual, Map
   - Responsive UI with Bootstrap and Tailwind CSS

3. **Control Layer**
   - Web Bluetooth API for wireless communication
   - XRP robot with MicroPython firmware
   - Servo motor control for physical ISS simulation
   - 26-byte binary packet protocol

### System Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                               │
├────────────────────────────────────────────────────────────────┤
│  [Lightstreamer]         [Celestrak API]                       │
│  ISS Telemetry           TLE Orbital Data                      │
└─────────┬───────────────────────┬────────────────────────────┘
          │                       │
          │                       │
┌─────────▼───────────────────────▼────────────────────────────┐
│                  FRONTEND APPLICATION                          │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Context Providers                        │    │
│  │  • TelemetryContext (Lightstreamer connection)       │    │
│  │  • IssPositionContext (Position calculation)         │    │
│  │  • BluetoothContext (Robot communication)            │    │
│  └──────────────┬───────────────────────────────────────┘    │
│                 │                                              │
│  ┌──────────────▼───────────────────────────────────────┐    │
│  │              UI Components                            │    │
│  │  • Homepage (Telemetry cards)                        │    │
│  │  • 3D Model Views (Live/Demo/Manual)                 │    │
│  │  • Map Views (ISS position on Earth)                 │    │
│  │  • Navigation & Connection Info                      │    │
│  └──────────────┬───────────────────────────────────────┘    │
│                 │                                              │
│  ┌──────────────▼───────────────────────────────────────┐    │
│  │         3D Rendering (Three.js)                       │    │
│  │  • ISS central body (blue sphere)                    │    │
│  │  • 8 Solar panels (color-coded)                      │    │
│  │  • Alpha rotation (SARJ group rotation)              │    │
│  │  • Beta rotation (Individual panel tilt)             │    │
│  └──────────────┬───────────────────────────────────────┘    │
└─────────────────┼────────────────────────────────────────────┘
                  │
                  │ BLE Packet Transmission
                  │
┌─────────────────▼────────────────────────────────────────────┐
│                  XRP ROBOT (MicroPython)                      │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  • BLE GATT Server (pestolink_adapted.py)           │    │
│  │  • Packet parser (v1 and v2 protocols)              │    │
│  │  • Servo controller (4 motors)                       │    │
│  │  • Battery monitor                                   │    │
│  │  • Telemetry display                                 │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Next.js | 15.5.2 | React meta-framework with App Router |
| UI Library | React | 19.1.0 | Component-based UI |
| Language | TypeScript | 5.x | Type-safe JavaScript |
| 3D Graphics | Three.js | 0.180.0 | WebGL 3D rendering |
| 3D React | @react-three/fiber | 9.3.0 | React renderer for Three.js |
| 3D Helpers | @react-three/drei | 10.7.4 | Three.js utilities |
| Real-time Data | lightstreamer-client-web | 9.2.3 | Push notification client |
| Orbital Math | satellite.js | 6.0.1 | TLE propagation |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| UI Components | Bootstrap | 5.3.8 | Component library |
| Build Tool | Turbopack | (built-in) | Fast bundler |

### Backend Technologies

| Category | Technology | Purpose |
|----------|-----------|---------|
| Language | MicroPython | Robot firmware programming |
| Platform | XRP Robot | Cornell robotics platform |
| Communication | Bluetooth Low Energy | Wireless control |
| Hardware Control | XRPLib + machine | Servo and motor control |

### Data Sources & APIs

| Service | URL | Purpose |
|---------|-----|---------|
| Lightstreamer | https://push.lightstreamer.com | Real-time ISS telemetry |
| Celestrak | https://celestrak.org/NORAD/elements/gp.php | ISS TLE data |
| ISS Position API | /api/iss-position | Internal position calculation |

---

## Project Structure

```
iss-mini-mimic/
│
├── iss-mimic-frontend/                    # Next.js Application
│   │
│   ├── app/                                # App Router (Next.js 13+)
│   │   ├── layout.tsx                      # Root layout with providers
│   │   ├── page.tsx                        # Homepage (telemetry dashboard)
│   │   │
│   │   ├── 3d-model/                      # 3D Visualization Routes
│   │   │   ├── live_v2/                   # Live mode version 2
│   │   │   ├── live_v3/                   # Live mode v3 (recommended)
│   │   │   │   └── page.tsx               # Real telemetry → 3D model
│   │   │   ├── live_v3_demo/              # Demo mode
│   │   │   │   └── page.tsx               # Random angles every 7s
│   │   │   ├── manual/                    # Manual control v1
│   │   │   ├── manual_v2/                 # Manual control v2
│   │   │   └── manual_v3/                 # Manual control v3 (smooth animations)
│   │   │       └── page.tsx               # Slider-controlled angles
│   │   │
│   │   ├── map/                           # ISS Position Visualization
│   │   │   ├── page.tsx                   # Live ISS position on Earth
│   │   │   └── manual/                    # Manual position control
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                           # API Routes
│   │   │   └── iss-position/
│   │   │       └── route.ts               # ISS lat/lon calculation
│   │   │
│   │   └── about/                         # About page
│   │       └── page.tsx
│   │
│   ├── components/                         # React Components
│   │   ├── Navbar.tsx                     # Navigation bar
│   │   ├── ISSDataExtended.tsx            # Telemetry display (cards)
│   │   ├── TelemetryDisplay.tsx           # Individual telemetry item
│   │   ├── PositionDisplay.tsx            # GPS coordinates formatter
│   │   ├── BluetoothConnectionInfo.tsx    # BLE status & controls
│   │   ├── Scene.tsx                      # Three.js scene setup
│   │   ├── Room.tsx                       # 3D room with Earth texture
│   │   ├── SolarPanel.tsx                 # Solar panel mesh v1
│   │   ├── SolarPanel_v2.tsx              # Solar panel mesh v2
│   │   └── SolarPanel_v3.tsx              # Solar panel mesh v3 (latest)
│   │
│   ├── contexts/                           # React Context API
│   │   ├── TelemetryContext.tsx           # Lightstreamer ISS data
│   │   ├── IssPositionContext.tsx         # ISS GPS coordinates
│   │   └── BluetoothContext.tsx           # Web Bluetooth management
│   │
│   ├── types/                              # TypeScript Definitions
│   │   └── web-bluetooth.d.ts             # Web Bluetooth API types
│   │
│   ├── utils/                              # Utility Functions
│   │   ├── robotPackets.ts                # BLE packet encoder
│   │   └── Iss_Tle.json                   # Cached TLE data (updated auto)
│   │
│   ├── public/                             # Static Assets
│   │   └── Equirectangular_Earth.jpg      # Earth texture for 3D
│   │
│   ├── package.json                        # Dependencies
│   ├── tsconfig.json                       # TypeScript config
│   ├── next.config.ts                      # Next.js config
│   ├── tailwind.config.js                  # Tailwind CSS config
│   └── postcss.config.mjs                  # PostCSS config
│
├── iss-mimic-backend/                      # MicroPython Robot Code
│   ├── main.py                             # Main robot loop
│   └── pestolink_adapted.py                # BLE protocol handler
│
├── iss_positioning_server/                 # Position Calculation (unused?)
│   └── iss_position.py                     # TLE-based position calc
│
└── README.md                               # Project documentation
```

---

## Core Components

### Frontend Context Providers

#### 1. TelemetryContext

**File**: `iss-mimic-frontend/contexts/TelemetryContext.tsx`

**Responsibilities**:
- Establishes connection to Lightstreamer push service
- Subscribes to ISS telemetry items
- Provides real-time data to components
- Manages connection state

**Subscribed Items**:
- `S0000003` - Starboard SARJ angle (degrees)
- `S0000004` - Port SARJ angle (degrees)
- `BGA1`, `BGA2`, `BGA3`, `BGA4`, `BGA5`, `BGA6`, `BGA7` - Beta Gimbal Assembly temps
- `SIGNAL` - Connection status indicator

**Hook Usage**:
```typescript
const { telemetry, isConnected } = useTelemetry();

// Access data
const sarjStarboard = telemetry.sarjStarboard; // string | null
const sarjPort = telemetry.sarjPort;
const bga1 = telemetry.bga1;
```

**Connection Details**:
- Server: `https://push.lightstreamer.com`
- Adapter: `ISSLIVE`
- Mode: `MERGE` (latest value on conflict)

---

#### 2. BluetoothContext

**File**: `iss-mimic-frontend/contexts/BluetoothContext.tsx`

**Responsibilities**:
- Manages Web Bluetooth API connection
- Discovers and connects to XRP robot
- Sends control packets to robot
- Receives telemetry notifications from robot
- Handles disconnection events

**BLE Configuration**:
```typescript
Service UUID: "27df26c5-83f4-4864-bae0-d7b7cb0a1f54"

Characteristics:
  Gamepad (Write): "452af57e-ad27-422c-88ae-76805ea641a9"
  Telemetry (Read/Notify): "266d9d74-3e10-4fcd-88d2-cb63b5324d0c"
```

**Hook Usage**:
```typescript
const {
  isConnected,
  connectToDevice,
  disconnectDevice,
  sendGamepadData,
  telemetryMessage
} = useBluetooth();

// Connect to robot
await connectToDevice();

// Send control packet
await sendGamepadData({
  servoAngles: [90, 45, 180, 270],  // Up to 6 angles
  buttonState: 0,
  buttonStateTwo: 0
});

// Disconnect
disconnectDevice();
```

**Features**:
- Auto-reconnection detection
- Connection status tracking
- Device info display (name, battery, signal)
- Telemetry message updates

---

#### 3. IssPositionContext

**File**: `iss-mimic-frontend/contexts/IssPositionContext.tsx`

**Responsibilities**:
- Fetches ISS GPS coordinates every 10 seconds
- Provides latitude and longitude to components
- Manages loading and error states

**Hook Usage**:
```typescript
const { position, loading, error } = useIssPosition();

// Access position
const lat = position?.lat;  // number
const lon = position?.lon;  // number
const timestamp = position?.timestamp;  // string
```

**Data Source**: Internal API endpoint `/api/iss-position`

---

### Key React Components

#### ISSDataExtended

**File**: `iss-mimic-frontend/components/ISSDataExtended.tsx`

**Purpose**: Displays telemetry data in card layout

**Features**:
- Shows SARJ angles (Starboard & Port)
- Displays BGA temperatures for 8 arrays
- Signal status indicator
- Connection status badge
- Responsive grid layout

---

#### BluetoothConnectionInfo

**File**: `iss-mimic-frontend/components/BluetoothConnectionInfo.tsx`

**Purpose**: Bluetooth connection controls and status

**Features**:
- Connect/Disconnect buttons
- Device name display
- Connection status indicator
- Battery level (from telemetry)
- Signal strength
- Telemetry message display

---

#### SolarPanel_v3

**File**: `iss-mimic-frontend/components/SolarPanel_v3.tsx`

**Purpose**: 3D mesh for ISS solar panel

**Props**:
```typescript
interface SolarPanelProps {
  position: [number, number, number];  // [x, y, z]
  rotation: [number, number, number];  // [x, y, z] in radians
  scale?: number;                       // Mesh scale
  color?: string;                       // Panel color
}
```

**Implementation**:
- Uses `@react-three/fiber` mesh components
- Box geometry for panel structure
- MeshStandardMaterial with color prop
- Positioned relative to ISS center

---

#### Room

**File**: `iss-mimic-frontend/components/Room.tsx`

**Purpose**: 3D environment with Earth texture

**Features**:
- Large sphere with Earth equirectangular texture
- Starfield background
- Ambient and directional lighting
- OrbitControls for camera movement

---

### 3D Visualization Pages

#### live_v3/page.tsx (Recommended Live Mode)

**File**: `iss-mimic-frontend/app/3d-model/live_v3/page.tsx`

**Data Flow**:
1. Fetch telemetry from `TelemetryContext`
2. Parse SARJ angles (alpha rotation)
3. Parse BGA data (beta rotation)
4. Update 3D solar panel rotations
5. Encode angles into packet
6. Send to robot via `BluetoothContext`

**Panel Configuration**:
```typescript
Port Side (Green & Purple):
  Group rotation: SARJ Port angle
  Panel 0 (Green): BGA1 individual rotation
  Panel 1 (Purple): BGA2 individual rotation

Starboard Side (Orange & Red):
  Group rotation: SARJ Starboard angle
  Panel 2 (Orange): BGA3 individual rotation
  Panel 3 (Red): BGA4 individual rotation
```

**3D Structure**:
```jsx
<Canvas>
  <Room />
  <group position={[0, 0, 0]}>  {/* ISS center */}
    <mesh>  {/* Blue sphere body */}
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="blue" />
    </mesh>

    {/* Port Side */}
    <group rotation={[0, 0, portAlpha]}>
      <SolarPanel_v3 position={[-2, 0, 0]} rotation={[portBeta1, 0, 0]} color="green" />
      <SolarPanel_v3 position={[-3, 0, 0]} rotation={[portBeta2, 0, 0]} color="purple" />
    </group>

    {/* Starboard Side */}
    <group rotation={[0, 0, starboardAlpha]}>
      <SolarPanel_v3 position={[2, 0, 0]} rotation={[starboardBeta1, 0, 0]} color="orange" />
      <SolarPanel_v3 position={[3, 0, 0]} rotation={[starboardBeta2, 0, 0]} color="red" />
    </group>
  </group>
</Canvas>
```

---

#### live_v3_demo/page.tsx (Demo Mode)

**File**: `iss-mimic-frontend/app/3d-model/live_v3_demo/page.tsx`

**Purpose**: Demonstration mode with simulated data

**Features**:
- Generates random angles every 7 seconds
- Countdown timer display
- Manual "Regenerate Angles" button
- Same visualization as live_v3
- Sends packets to robot

**Angle Generation**:
```typescript
const generateRandomAngles = () => {
  const randomAngle = () => Math.floor(Math.random() * 361);
  return {
    portAlpha: randomAngle(),
    starboardAlpha: randomAngle(),
    portBeta1: randomAngle(),
    portBeta2: randomAngle(),
    starboardBeta1: randomAngle(),
    starboardBeta2: randomAngle()
  };
};
```

**Update Cycle**:
- Timer starts at 7 seconds
- Counts down to 0
- Generates new angles
- Resets timer

---

#### manual_v3/page.tsx (Manual Control)

**File**: `iss-mimic-frontend/app/3d-model/manual_v3/page.tsx`

**Purpose**: Manual control with smooth animations

**Features**:
- Dropdown to select panel group (Port/Starboard)
- Dropdown to select specific panel (0-3)
- Alpha angle slider (0-360°) for group rotation
- Beta angle slider (0-360°) for panel tilt
- Smooth 2° step animations every 50ms
- Real-time 3D visualization
- Robot control via BLE

**Animation Logic**:
```typescript
// Step-based animation
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentAlpha(prev => {
      if (Math.abs(prev - targetAlpha) < 2) return targetAlpha;
      return prev < targetAlpha ? prev + 2 : prev - 2;
    });
  }, 50);  // 20 FPS

  return () => clearInterval(interval);
}, [targetAlpha]);
```

**UI Controls**:
- Group selector: "Port" or "Starboard"
- Panel selector: Panel index (0-3)
- Alpha slider: Group rotation (0-360°)
- Beta slider: Individual panel rotation (0-360°)

---

### Backend Components

#### main.py (Robot Control Loop)

**File**: `iss-mimic-backend/main.py`

**Purpose**: Main MicroPython script for XRP robot

**Main Loop**:
```python
while True:
    # Read BLE packet
    button_state, button_state_two, servoAngles = ble.read()

    # Update servo positions
    servo1.angle(servoAngles[0])  # Starboard SARJ
    servo2.angle(servoAngles[1])  # Port SARJ
    servo3.angle(servoAngles[2])  # BGA 1
    servo4.angle(servoAngles[3])  # BGA 2

    # Update telemetry display
    msg = f"A:{servoAngles[0]:3.0f}"
    ble.send(msg, "00ff00")  # Green text

    # Monitor battery
    battery_voltage = board.battery()

    time.sleep(0.1)  # 10 Hz loop
```

**Features**:
- 4 servo motor control
- Battery voltage monitoring
- Telemetry message display (8 characters, RGB color)
- Default positions when disconnected
- Commented PID motor control code (available for extension)

**Servo Mapping**:
- Servo 1: Starboard SARJ simulation
- Servo 2: Port SARJ simulation
- Servo 3: BGA 1 (beta rotation)
- Servo 4: BGA 2 (beta rotation)

---

#### pestolink_adapted.py (BLE Protocol)

**File**: `iss-mimic-backend/pestolink_adapted.py`

**Purpose**: Bluetooth GATT server and packet parser

**Key Classes**:

1. **BLELink** - Main BLE connection manager
   - Advertises BLE service
   - Manages GATT characteristics
   - Handles connections/disconnections
   - Provides read() and send() methods

2. **GamepadPacket** - Packet parser
   - Supports v1 (14-byte) and v2 (26-byte) protocols
   - Decodes button states
   - Decodes up to 6 servo angles

**Packet Format (Version 2)**:
```
Byte 0: Version (0x02)
Byte 1: Button state
Byte 2: Button state two
Bytes 3-4: Angle 1 (little-endian uint16)
Bytes 5-6: Angle 2
Bytes 7-8: Angle 3
Bytes 9-10: Angle 4
Bytes 11-12: Angle 5
Bytes 13-14: Angle 6
Bytes 15-25: Reserved (zeros)

Total: 26 bytes
```

**Angle Decoding**:
```python
def decode_angle(low_byte, high_byte):
    value = low_byte | (high_byte << 8)  # Combine bytes
    angle = (value / 65535) * 360         # Map to 0-360°
    return angle
```

**BLE API**:
```python
# Initialize
ble_link = BLELink(board)

# Check for data
if ble_link.is_connected and ble_link.any():
    button1, button2, angles = ble_link.read()
    # angles is list of 6 floats (0-360°)

# Send telemetry
ble_link.send("Hello", "ff0000")  # Red text on display
```

---

## Data Flow

### Live Mode Complete Flow

```
1. ISS → Lightstreamer Server
   (Real telemetry from ISS sensors)

2. Lightstreamer Server → Frontend (TelemetryContext)
   WebSocket connection
   Items: SARJ angles, BGA temps

3. TelemetryContext → live_v3/page.tsx
   React Context consumer
   Parse string angles to numbers

4. live_v3/page.tsx → State Variables
   sarjStarboard, sarjPort, bga1-4
   Convert to alpha/beta angles

5. State → Three.js Components
   Update mesh rotations
   Visual feedback in browser

6. State → robotPackets.ts
   Encode angles into 26-byte packet
   Format: [version, buttons, angles...]

7. robotPackets.ts → BluetoothContext
   sendGamepadData() function
   Uint8Array packet

8. BluetoothContext → XRP Robot (BLE)
   Write to gamepad characteristic
   UUID: 452af57e-ad27-422c-88ae-76805ea641a9

9. Robot (pestolink_adapted.py) → Packet Parser
   Receive BLE write event
   Decode 26-byte packet
   Extract 6 angles

10. Robot (main.py) → Servo Motors
    ble.read() returns angles
    servo.angle() sets position
    Physical movement

11. Robot → Telemetry Display
    ble.send() updates screen
    Shows current angle/status

12. Robot → Frontend (BLE notify)
    Telemetry characteristic
    UUID: 266d9d74-3e10-4fcd-88d2-cb63b5324d0c
    Shows on BluetoothConnectionInfo
```

### Manual Mode Flow

```
1. User Input → Range Slider onChange
   Event handler captures value

2. Slider Value → setTargetAlpha/Beta
   Update React state
   Trigger animation

3. Animation Loop → setCurrentAlpha/Beta
   Increment by 2° every 50ms
   Smooth transition to target

4. Current Angles → Three.js Rotation
   Update mesh rotation props
   Visual feedback

5. Current Angles → robotPackets.ts → BLE → Robot
   Same as live mode (steps 6-11 above)
```

### Position Calculation Flow

```
1. Frontend → /api/iss-position
   HTTP GET request every 10 seconds

2. API Route → Check TLE Cache
   Read Iss_Tle.json
   Check if timestamp > 8 hours old

3. If Stale → Fetch Fresh TLE
   GET https://celestrak.org/NORAD/elements/gp.php?CATNR=25544
   Parse TLE lines
   Update Iss_Tle.json

4. API Route → satellite.js
   Propagate TLE to current time
   Calculate geocentric coordinates

5. satellite.js → Convert to Lat/Lon
   ECI → ECEF → Geodetic
   Return {lat, lon, timestamp}

6. API Response → IssPositionContext
   Update position state

7. IssPositionContext → Components
   map/page.tsx uses for visualization
   PositionDisplay shows coordinates
```

---

## API Reference

### Frontend API Endpoints

#### GET /api/iss-position

**File**: `iss-mimic-frontend/app/api/iss-position/route.ts`

**Description**: Calculates current ISS latitude and longitude from TLE data

**Request**: No parameters required

**Response**:
```json
{
  "position": {
    "lat": 51.5074,
    "lon": -0.1278,
    "timestamp": "2025-01-14T15:30:45.123Z"
  },
  "tleData": {
    "line1": "1 25544U 98067A   25014.12345678  .00001234  00000-0  12345-4 0  9991",
    "line2": "2 25544  51.6444 123.4567 0001234  45.6789  12.3456 15.54012345123456",
    "timestamp": "2025-01-14T10:00:00.000Z"
  }
}
```

**Caching Logic**:
```typescript
const TLE_MAX_AGE = 8 * 60 * 60 * 1000; // 8 hours in ms

const isTleStale = (tleTimestamp: string): boolean => {
  const tleTime = new Date(tleTimestamp).getTime();
  const currentTime = Date.now();
  return (currentTime - tleTime) > TLE_MAX_AGE;
};
```

**Error Handling**:
- Returns cached TLE if fetch fails
- Logs errors to console
- Includes error in response if TLE unavailable

---

### External APIs

#### Celestrak TLE API

**URL**: `https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE`

**Description**: Provides Two-Line Element set for ISS

**Response Format**:
```
ISS (ZARYA)
1 25544U 98067A   25014.12345678  .00001234  00000-0  12345-4 0  9991
2 25544  51.6444 123.4567 0001234  45.6789  12.3456 15.54012345123456
```

**TLE Parameters**:
- Line 1: Epoch time, ballistic coefficient, decay rate
- Line 2: Inclination, RAAN, eccentricity, argument of perigee, mean anomaly, mean motion

---

#### Lightstreamer ISS Live API

**URL**: `https://push.lightstreamer.com`

**Service**: ISSLIVE

**Subscribed Items**:
| Item Code | Description | Unit | Update Frequency |
|-----------|-------------|------|------------------|
| S0000003 | Starboard SARJ angle | degrees | Real-time |
| S0000004 | Port SARJ angle | degrees | Real-time |
| BGA1 | Beta Gimbal Assembly 1 temp | varies | Real-time |
| BGA2 | Beta Gimbal Assembly 2 temp | varies | Real-time |
| BGA3 | Beta Gimbal Assembly 3 temp | varies | Real-time |
| BGA4 | Beta Gimbal Assembly 4 temp | varies | Real-time |
| SIGNAL | Connection status | string | Real-time |

**Connection Mode**: MERGE (latest value on conflict)

---

## Communication Protocols

### Bluetooth Packet Protocol

#### Packet Structure (Version 2)

```
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Byte 0  │ Byte 1  │ Byte 2  │ Byte 3-4│ Byte 5-6│ Byte 7-8│  ...    │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Version │ Button1 │ Button2 │ Angle 1 │ Angle 2 │ Angle 3 │  ...    │
│  0x02   │  uint8  │  uint8  │ uint16  │ uint16  │ uint16  │         │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

Total Size: 26 bytes
Angles: 6 x 16-bit little-endian (0-65535 maps to 0-360°)
Bytes 15-25: Reserved (zeros)
```

#### Encoding (Frontend)

**File**: `iss-mimic-frontend/utils/robotPackets.ts`

```typescript
export const encodePacket = (
  servoAngles: number[],      // Array of 0-360° angles
  buttonState: number = 0,    // 8-bit button mask
  buttonStateTwo: number = 0  // 8-bit button mask
): Uint8Array => {
  const packet = new Uint8Array(26);

  // Version byte
  packet[0] = 0x02;

  // Button states
  packet[1] = buttonState & 0xFF;
  packet[2] = buttonStateTwo & 0xFF;

  // Encode up to 6 angles
  for (let i = 0; i < 6; i++) {
    const angle = servoAngles[i] || 0;
    const angleValue = Math.round((angle / 360) * 65535);

    // Little-endian encoding
    packet[3 + i * 2] = angleValue & 0xFF;         // Low byte
    packet[4 + i * 2] = (angleValue >> 8) & 0xFF;  // High byte
  }

  // Remaining bytes stay zero
  return packet;
};
```

**Example**:
```typescript
const packet = encodePacket([90, 180, 270, 0, 45, 135]);
// Sends 6 angles to robot: 90°, 180°, 270°, 0°, 45°, 135°
```

#### Decoding (Backend)

**File**: `iss-mimic-backend/pestolink_adapted.py`

```python
class GamepadPacket:
    def decode(self, packet):
        version = packet[0]

        if version == 0x02:  # V2 protocol
            button_state = packet[1]
            button_state_two = packet[2]

            angles = []
            for i in range(6):
                low_byte = packet[3 + i * 2]
                high_byte = packet[4 + i * 2]

                # Combine bytes (little-endian)
                value = low_byte | (high_byte << 8)

                # Convert to angle (0-360°)
                angle = (value / 65535) * 360
                angles.append(angle)

            return button_state, button_state_two, angles
```

---

### Web Bluetooth API Usage

#### Connection Flow

```typescript
// 1. Request device
const device = await navigator.bluetooth.requestDevice({
  filters: [{ services: [SERVICE_UUID] }]
});

// 2. Connect to GATT server
const server = await device.gatt?.connect();

// 3. Get service
const service = await server?.getPrimaryService(SERVICE_UUID);

// 4. Get characteristics
const gamepadChar = await service?.getCharacteristic(GAMEPAD_UUID);
const telemetryChar = await service?.getCharacteristic(TELEMETRY_UUID);

// 5. Enable notifications
await telemetryChar?.startNotifications();
telemetryChar?.addEventListener('characteristicvaluechanged', handleNotify);

// 6. Write data
const packet = encodePacket([90, 180, 270, 0]);
await gamepadChar?.writeValue(packet);

// 7. Disconnect
device.gatt?.disconnect();
```

---

## Development Guide

### Setup Instructions

#### Frontend Setup

```bash
cd iss-mimic-frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

**Development Server**: http://localhost:3000

**Available Routes**:
- `/` - Homepage (telemetry dashboard)
- `/3d-model/live_v3` - Live 3D visualization
- `/3d-model/live_v3_demo` - Demo mode
- `/3d-model/manual_v3` - Manual control
- `/map` - Live ISS position map
- `/about` - About page

#### Backend Setup

1. **Install MicroPython IDE**: Download XRP IDE or Thonny
2. **Connect XRP Robot**: Via USB cable
3. **Upload Files**:
   - Upload `main.py` to robot
   - Upload `pestolink_adapted.py` to robot
4. **Run**: Press Run or reset robot
5. **Connect Frontend**: Use Bluetooth button in web app

---

### Adding New Features

#### Add New Telemetry Item

**Step 1**: Update TelemetryContext

```typescript
// contexts/TelemetryContext.tsx

// Add to subscription
client.subscribe(
  new Subscription("MERGE", [
    "S0000003",
    "S0000004",
    "NEW_ITEM_CODE"  // Add here
  ], fields)
);

// Add to state interface
interface Telemetry {
  // ... existing
  newItem: string | null;
}

// Add to initial state
const [telemetry, setTelemetry] = useState<Telemetry>({
  // ... existing
  newItem: null
});

// Add to update handler
subscription.addListener({
  onItemUpdate: (update) => {
    if (update.getItemName() === "NEW_ITEM_CODE") {
      setTelemetry(prev => ({
        ...prev,
        newItem: update.getValue("Value")
      }));
    }
  }
});
```

**Step 2**: Use in components

```typescript
const { telemetry } = useTelemetry();
console.log(telemetry.newItem);
```

---

#### Add New 3D Visualization Route

**Step 1**: Create directory and page

```bash
mkdir -p app/3d-model/my-new-mode
touch app/3d-model/my-new-mode/page.tsx
```

**Step 2**: Implement page component

```typescript
// app/3d-model/my-new-mode/page.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useTelemetry } from '@/contexts/TelemetryContext';
import { useBluetooth } from '@/contexts/BluetoothContext';
import SolarPanel_v3 from '@/components/SolarPanel_v3';
import Room from '@/components/Room';

export default function MyNewMode() {
  const { telemetry } = useTelemetry();
  const { sendGamepadData } = useBluetooth();

  // Your custom logic here

  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [5, 5, 5], fov: 75 }}>
        <Room />
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} />

        {/* ISS center */}
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="blue" />
        </mesh>

        {/* Solar panels */}
        <SolarPanel_v3
          position={[-2, 0, 0]}
          rotation={[0, 0, 0]}
          color="green"
        />
      </Canvas>
    </div>
  );
}
```

**Step 3**: Add navigation link

```typescript
// components/Navbar.tsx

<Nav.Link href="/3d-model/my-new-mode">
  My New Mode
</Nav.Link>
```

---

#### Modify Robot Behavior

**Example**: Add PID motor control

```python
# iss-mimic-backend/main.py

from XRPLib.defaults import *
from pestolink_adapted import BLELink

# Initialize motors with PID
left_motor = Motor.get_default_motor(1)
right_motor = Motor.get_default_motor(2)

# Initialize servos
servo1 = Servo(1)
servo2 = Servo(2)
servo3 = Servo(3)
servo4 = Servo(4)

# BLE setup
ble = BLELink(board)

while True:
    if ble.is_connected and ble.any():
        button1, button2, angles = ble.read()

        # Control servos
        servo1.angle(angles[0])
        servo2.angle(angles[1])
        servo3.angle(angles[2])
        servo4.angle(angles[3])

        # NEW: Use angles to control motors
        # Example: Angle 4 controls left motor speed
        # Example: Angle 5 controls right motor speed
        if len(angles) > 4:
            left_speed = (angles[4] - 180) / 180  # Map 0-360 to -1 to 1
            right_speed = (angles[5] - 180) / 180

            left_motor.set_speed(left_speed)
            right_motor.set_speed(right_speed)

        # Send telemetry
        msg = f"L:{left_speed:.2f}"
        ble.send(msg, "00ff00")
    else:
        # Default: stop motors
        left_motor.set_speed(0)
        right_motor.set_speed(0)

    time.sleep(0.1)
```

---

### Testing Strategies

#### Unit Testing (Frontend)

```bash
# Install testing library
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Create test file
touch components/__tests__/SolarPanel.test.tsx
```

```typescript
// components/__tests__/SolarPanel.test.tsx
import { render } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';
import SolarPanel_v3 from '../SolarPanel_v3';

describe('SolarPanel_v3', () => {
  it('renders without crashing', () => {
    render(
      <Canvas>
        <SolarPanel_v3 position={[0, 0, 0]} rotation={[0, 0, 0]} color="green" />
      </Canvas>
    );
  });

  it('applies correct color', () => {
    const { container } = render(
      <Canvas>
        <SolarPanel_v3 position={[0, 0, 0]} rotation={[0, 0, 0]} color="red" />
      </Canvas>
    );
    // Add assertions
  });
});
```

#### Integration Testing

**Test Flow**: Manual Mode → BLE → Robot

1. Open `/3d-model/manual_v3`
2. Connect Bluetooth device
3. Adjust alpha slider to 90°
4. Verify:
   - 3D model rotates
   - Robot servo moves to 90°
   - Telemetry message updates
5. Adjust beta slider to 180°
6. Verify individual panel rotation

---

#### E2E Testing with Playwright

```bash
npm install --save-dev @playwright/test

# Create test
mkdir -p e2e
touch e2e/live-mode.spec.ts
```

```typescript
// e2e/live-mode.spec.ts
import { test, expect } from '@playwright/test';

test('live mode displays telemetry', async ({ page }) => {
  await page.goto('http://localhost:3000/3d-model/live_v3');

  // Wait for telemetry to load
  await page.waitForSelector('[data-testid="telemetry-display"]');

  // Check SARJ angles are displayed
  const sarjStarboard = page.locator('[data-testid="sarj-starboard"]');
  await expect(sarjStarboard).toBeVisible();

  // Check canvas renders
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
});
```

---

## Troubleshooting

### Common Issues

#### Issue: Bluetooth Connection Fails

**Symptoms**: "Failed to connect" or no device found

**Solutions**:
1. Check browser compatibility (Chrome/Edge recommended)
2. Ensure robot is powered on and advertising
3. Verify BLE is enabled on computer
4. Check UUID matches between frontend and backend
5. Try clearing browser cache
6. Restart robot and refresh page

**Debug Steps**:
```typescript
// Enable verbose logging
console.log('Requesting device...');
const device = await navigator.bluetooth.requestDevice({...});
console.log('Device:', device.name, device.id);

const server = await device.gatt?.connect();
console.log('Connected:', server?.connected);
```

---

#### Issue: Telemetry Not Updating

**Symptoms**: SARJ angles show null or stale data

**Solutions**:
1. Check network connectivity
2. Verify Lightstreamer URL is accessible
3. Check subscription item codes (S0000003, S0000004)
4. Inspect browser console for connection errors
5. Test with https://push.lightstreamer.com directly

**Debug Steps**:
```typescript
// In TelemetryContext.tsx
subscription.addListener({
  onItemUpdate: (update) => {
    console.log('Item update:', update.getItemName(), update.getValue("Value"));
  },
  onSubscriptionError: (code, message) => {
    console.error('Subscription error:', code, message);
  }
});
```

---

#### Issue: 3D Model Not Rendering

**Symptoms**: Black screen or no Canvas visible

**Solutions**:
1. Check WebGL support: Visit https://get.webgl.org/
2. Update graphics drivers
3. Try different browser
4. Check Three.js version compatibility
5. Verify mesh positions are in view

**Debug Steps**:
```typescript
// Add helpers to scene
import { GridHelper, AxesHelper } from 'three';

<Canvas>
  <gridHelper args={[10, 10]} />
  <axesHelper args={[5]} />
  {/* Your meshes */}
</Canvas>
```

---

#### Issue: Robot Servos Not Moving

**Symptoms**: BLE connected but no physical movement

**Solutions**:
1. Check servo connections to XRP board
2. Verify servo power supply (battery charged)
3. Test servos individually with simple script
4. Check angle values in packet (0-360° range)
5. Verify pestolink_adapted.py is running

**Debug Steps**:
```python
# In main.py
while True:
    if ble.is_connected and ble.any():
        button1, button2, angles = ble.read()

        print(f"Received angles: {angles}")  # Debug print

        # Test individual servo
        print(f"Setting servo1 to {angles[0]}")
        servo1.angle(angles[0])
```

---

#### Issue: TLE Data Stale

**Symptoms**: "TLE data is >8 hours old" warning

**Solutions**:
1. Check internet connectivity
2. Verify Celestrak API is accessible
3. Manually fetch TLE: `curl https://celestrak.org/NORAD/elements/gp.php?CATNR=25544`
4. Check file permissions on Iss_Tle.json
5. Clear cache and force refresh

**Manual Update**:
```bash
# Fetch fresh TLE
curl "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE" > tle.txt

# Update Iss_Tle.json manually
# Replace line1 and line2 with data from tle.txt
```

---

#### Issue: Performance/FPS Drops

**Symptoms**: Laggy 3D visualization or slow updates

**Solutions**:
1. Reduce mesh complexity (lower geometry args)
2. Optimize render loop (use `useFrame` efficiently)
3. Reduce telemetry update frequency
4. Disable shadows if enabled
5. Lower canvas pixel ratio

**Optimization**:
```typescript
<Canvas
  dpr={[1, 1.5]}  // Limit pixel ratio
  performance={{ min: 0.5 }}  // Allow frame rate reduction
>
  {/* Simplified geometry */}
  <sphereGeometry args={[0.5, 16, 16]} />  {/* Fewer segments */}
</Canvas>
```

---

## Extension Points

### Potential Features

#### 1. Historical Telemetry Logging

**Implementation**:
- Add database (SQLite, PostgreSQL, Supabase)
- Log telemetry data every update
- Create `/history` route with chart library (Chart.js, Recharts)
- Display SARJ angle trends over time

**Code Snippet**:
```typescript
// In TelemetryContext.tsx
useEffect(() => {
  if (telemetry.sarjStarboard) {
    // Log to database
    fetch('/api/telemetry/log', {
      method: 'POST',
      body: JSON.stringify({
        timestamp: new Date(),
        sarjStarboard: telemetry.sarjStarboard,
        sarjPort: telemetry.sarjPort
      })
    });
  }
}, [telemetry]);
```

---

#### 2. Predictive ISS Pass Times

**Implementation**:
- Use satellite.js to calculate future passes
- Show next visible pass times for user's location
- Add notifications for upcoming passes
- Create `/passes` route with table/calendar view

**Libraries**:
- `satellite.js` - Orbital calculations
- `@turf/turf` - Geospatial calculations
- `react-big-calendar` - Calendar UI

---

#### 3. Multi-Robot Support

**Implementation**:
- Extend BluetoothContext to manage multiple devices
- Add device selection UI
- Synchronize multiple robots
- Display multiple 3D models

**Code Snippet**:
```typescript
interface RobotConnection {
  device: BluetoothDevice;
  name: string;
  isConnected: boolean;
}

const [robots, setRobots] = useState<RobotConnection[]>([]);

const connectToMultiple = async () => {
  const device1 = await navigator.bluetooth.requestDevice({...});
  const device2 = await navigator.bluetooth.requestDevice({...});

  setRobots([
    { device: device1, name: device1.name, isConnected: true },
    { device: device2, name: device2.name, isConnected: true }
  ]);
};
```

---

#### 4. Mobile PWA

**Implementation**:
- Add `manifest.json` for PWA
- Implement service worker for offline support
- Optimize UI for mobile (touch controls)
- Add install prompt

**Files to Add**:
```json
// public/manifest.json
{
  "name": "ISS Mini Mimic",
  "short_name": "ISS Mimic",
  "description": "Real-time ISS visualization and control",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0070f3",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

#### 5. Augmented Reality Mode

**Implementation**:
- Use WebXR API for AR
- Overlay 3D ISS model on camera feed
- Show ISS in real position relative to user
- Requires AR-compatible device

**Libraries**:
- `@react-three/xr` - WebXR integration
- `three/examples/jsm/webxr` - XR utilities

**Code Snippet**:
```typescript
import { XR, Controllers, Hands } from '@react-three/xr';

<XR>
  <Canvas>
    {/* ISS model in AR */}
    <SolarPanel_v3 ... />
  </Canvas>
</XR>
```

---

#### 6. Voice Control

**Implementation**:
- Web Speech API for voice commands
- Commands: "Set alpha to 90", "Connect robot", "Show map"
- Voice feedback for actions

**Code Snippet**:
```typescript
const recognition = new webkitSpeechRecognition();

recognition.onresult = (event) => {
  const command = event.results[0][0].transcript;

  if (command.includes('set alpha')) {
    const angle = parseInt(command.match(/\d+/)?.[0] || '0');
    setTargetAlpha(angle);
  }
};

recognition.start();
```

---

## Conclusion

The ISS Mini Mimic project is a sophisticated educational platform that demonstrates the integration of:

- **Real-time data streaming** (Lightstreamer)
- **Orbital mechanics** (TLE propagation with satellite.js)
- **3D visualization** (Three.js with React Three Fiber)
- **Wireless communication** (Web Bluetooth API)
- **Embedded systems** (MicroPython on XRP robot)
- **Modern web development** (Next.js 15, React 19, TypeScript)

The codebase is well-structured, modular, and extensible. Key strengths include:

1. **Clear separation of concerns**: Contexts for data, components for UI, utils for logic
2. **Multiple visualization modes**: Live, demo, manual, and map views
3. **Robust communication protocol**: Binary packet format with version support
4. **Educational value**: Demonstrates real ISS operations in accessible format

When working with this codebase, focus on:
- Maintaining type safety throughout
- Preserving the packet protocol structure for robot compatibility
- Testing with both simulated and live data
- Documenting new features clearly
- Ensuring graceful error handling

For additional information or clarification on specific components, refer to the source code and inline comments.

---

**Document Version**: 1.0
**Last Updated**: 2025-01-14
**Created for**: Gemini AI Assistant
