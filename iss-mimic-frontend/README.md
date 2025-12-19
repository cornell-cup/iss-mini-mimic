# **ISS Mimic Interface: Technical Documentation**

## **Project Overview**

The **ISS Mimic Frontend** is a high-performance Next.js graphical user interface designed to act as the command and control center for an XRP Robot. The application consumes real-time telemetry from the International Space Station (ISS) via Lightstreamer, calculating orbital physics via TLE propagation, and communicating directly with hardware via the Web Bluetooth API.

## **1. Execution & Setup**

The project requires a Node.js environment. It leverages Next.js 13+ (App Router) features.

### **Prerequisites**

* Node.js (LTS version recommended)
* A browser supporting the Web Bluetooth API (Chrome, preferebly).

### **Installation**

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

```

The application will be available at `http://localhost:3000`.

---

## **2. Project Architecture**

The application follows a modular architecture utilizing the Next.js App Router. State is managed via React Context providers to ensure persistent hardware connections across route navigation.

```
├── iss-mimic-frontend/              # Next.js Application
│   │
│   ├── app/                         # App Router (Next.js 13+)
│   │   ├── layout.tsx               # Root layout with providers
│   │   ├── page.tsx                 # Homepage (telemetry dashboard)
│   │   │
│   │   ├── 3d-model/                # 3D Visualization Routes
│   │   │   ├── live_v3/             # Live mode v3 (recommended)
│   │   │   │   └── page.tsx         # Real telemetry → 3D model
│   │   │   ├── live_v3_demo/        # Demo mode
│   │   │   │   └── page.tsx         # Random angles every 7s
│   │   │   └── manual_v3/           # Manual control v3 (smooth animations)
│   │   │       └── page.tsx         # Slider-controlled angles
│   │   │
│   │   ├── map/                     # ISS Position Visualization
│   │   │   ├── page.tsx             # Live ISS position on Earth
│   │   │   └── manual/              # Manual position control
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                     # API Routes
│   │   │   └── iss-position/
│   │   │       └── route.ts         # ISS lat/lon calculation
│   │   │
│   │   └── about/                   # About page
│   │       └── page.tsx
│   │
│   ├── components/                  # React Components
│   │   ├── Navbar.tsx               # Navigation bar
│   │   ├── ISSDataExtended.tsx      # Telemetry display (cards)
│   │   ├── TelemetryDisplay.tsx     # Individual telemetry item
│   │   ├── PositionDisplay.tsx      # GPS coordinates formatter
│   │   ├── BluetoothConnectionInfo.tsx # BLE status & controls
│   │   ├── Scene.tsx                # Three.js scene setup
│   │   ├── Room.tsx                 # 3D room with Earth texture
│   │   ├── SolarPanel.tsx           # Solar panel mesh v1
│   │   ├── SolarPanel_v2.tsx        # Solar panel mesh v2
│   │   └── SolarPanel_v3.tsx        # Solar panel mesh v3 (latest)
│   │
│   ├── contexts/                    # React Context API
│   │   ├── TelemetryContext.tsx     # Lightstreamer ISS data
│   │   ├── IssPositionContext.tsx   # ISS GPS coordinates
│   │   ├── BluetoothContext.tsx     # Web Bluetooth management
│   │
│   ├── types/                       # TypeScript Definitions
│   │   └── web-bluetooth.d.ts       # Web Bluetooth API types
│   │
│   ├── utils/                       # Utility Functions
│   │   ├── robotPackets.ts          # BLE packet encoder
│   │   └── Iss_Tle.json             # Cached TLE data (updated auto)
│   │
│   ├── public/                      # Static Assets
│   │   └── Equirectangular_Earth.jpg # Earth texture for 3D
│   │
│   ├── package.json                 # Dependencies
│   ├── tsconfig.json                # TypeScript config
│   ├── next.config.ts               # Next.js config
│   ├── tailwind.config.js           # Tailwind CSS config
│   └── postcss.config.mjs           # PostCSS config

```

---

## **3. Core Infrastructure & Technical Deep Dive**

The application's core logic is split into three pillars: **Global State Orchestration**, **Hardware Communication**, and **Telemetry**.

### **A. Global State Orchestration**

#### **`app/layout.tsx`**

This file serves as the dependency injection root. Unlike standard React applications, this layout wraps the entire application tree in three distinct Context Providers. This architectural choice ensures that:

1. **Bluetooth Persistence:** The connection to the XRP robot is not dropped when the user navigates between the Dashboard and the 3D Model views.
2. **Telemetry Continuity:** The Lightstreamer socket connection remains active globally to prevent data gaps.

```typescript
<BluetoothProvider>
  <TelemetryProvider>
    <IssPositionProvider>
      <Navbar />
      {children}
    </IssPositionProvider>
  </TelemetryProvider>
</BluetoothProvider>
```

---

### **B. Hardware Communication Layer (Bluetooth & Protocols)**

This layer handles the low-level communication with the XRP Robot using the Web Bluetooth API, bypassing the need for native backend drivers.

#### **`contexts/BluetoothContext.tsx`**

This context manages the lifecycle of the GATT (Generic Attribute Profile) server connection.

* **Service UUID:** Connects specifically to `27df26c5-83f4-4964-bae0-d7b7cb0a1f54` (Pestoble Service).

**Characteristics:**
* **Gamepad (`...41a9`):** Used for **WriteWithoutResponse**. This allows high-frequency packet transmission (control loops) without blocking the thread waiting for acknowledgments.
* **Telemetry (`...d0c`):** Uses **Notifications** to listen for incoming data from the robot asynchronously.


* **Data Handling:** Converts incoming `DataView` buffers into ASCII strings for telemetry display.

#### **`utils/robotPackets.ts`**

This is the binary encoder for the application. The robot does not understand JSON; it requires strictly formatted byte arrays. This utility performs **Bitwise Operations** to pack high-level state into a 26-byte `Uint8Array`.

* **Protocol Version 0x03:** The first byte defines the protocol version.
* **Little Endian Encoding:** Angles (0-360°) are split into two bytes (Low Byte, High Byte) using bitwise shifts (`>> 8`) and masking (`& 0xFF`).
```typescript
packet[1] = angle0 & 0xFF;         // Low byte
packet[2] = (angle0 >> 8) & 0xFF;  // High byte

```


* **Bitmasking:** Button states are compressed into single bytes where each bit represents a specific button, maximizing data efficiency.

#### **`types/web-bluetooth.d.ts`**

Since the Web Bluetooth API is experimental/standardizing, this file extends the global TypeScript interfaces (`Navigator`, `BluetoothDevice`, `BluetoothRemoteGATTCharacteristic`) to ensure type safety and IntelliSense support throughout the development environment.

---

### **C. Telemetry**

This layer is responsible for fetching, calculating, and distributing the real-world data that drives the mimic.

#### **`contexts/TelemetryContext.tsx`**

This provider interfaces with the **Lightstreamer Client SDK** to establish a persistent WebSocket/HTTP-Stream connection to ISS live data servers.

* **Subscription Mode:** Uses `MERGE` mode to handle high-frequency updates efficiently.
* **Data Points:** Subscribes to specific telemetry IDs (e.g., `S0000003` for SARJ angles) and Time Signals.
* **Signal Analysis:** Implements logic to detect "Stale Signals" or "Loss of Signal" (LOS) by comparing the AOS (Acquisition of Signal) timestamp against the calculated current UTC time.

#### **`contexts/IssPositionContext.tsx`**

A polling-based context that acts as a middleware between the UI and the backend calculation engine.

* **Strategy:** Polls the internal API `/api/iss-position` every 10 seconds.
* **Separation of Concerns:** By offloading the calculation to the backend API, the frontend UI thread remains unblocked for 3D rendering.

#### **`api/iss-position/route.ts`**

A server-side Next.js API route that performs orbital mechanics calculations.

* **TLE Propagation:** Uses `satellite.js` to propagate the ISS position based on Two-Line Element (TLE) sets. This converts orbital elements into Geodetic coordinates (Latitude/Longitude).
* **Smart Caching:** To avoid rate-limiting from external TLE providers (Celestrak), this route implements a file-system cache (`Iss_Tle.json`).
* *Logic:* It reads the local JSON. If the timestamp is older than 8 hours, it fetches fresh TLE data from Celestrak, updates the JSON, and *then* performs the calculation. This ensures high availability and low latency.



#### **`utils/Iss_Tle.json`**

A local storage file acting as a cache for the Two-Line Element sets.

```json
{
  "ISS_TLE_Line1": "1 25544U...",
  "ISS_TLE_Line2": "2 25544...",
  "timestamp": "2025-12-19T18:16:07.919Z"
}
```

--- 

## **4. Dashboard & Data Visualization Layer**

The application's entry point allows users to monitor the pulse of the station before engaging in 3D simulations. This layer is built using a **Compositional Component Pattern**, where data fetching logic is decoupled from presentation logic.

### **A. Composition Root: `app/page.tsx`**

This server component serves as the structural container for the dashboard. It implements the Bootstrap grid system to ensure responsive design across devices. While lightweight, it acts as the **View Controller**, instantiating the telemetry aggregator (`ISSDataExtended`) within a controlled layout context.

### **B. Telemetry Aggregator: `components/ISSDataExtended.tsx`**

This component is the central hub for the 2D dashboard. It acts as a **dual-consumer**, subscribing to two distinct data streams simultaneously:

1. **Lightstreamer Stream:** High-frequency sensor data (Solar Alpha Rotary Joints, Beta Gimbal Assemblies).
2. **REST Polling Stream:** Orbital position data (Latitude/Longitude/Altitude).

**Key Technical Features:**

* **Signal Integrity Monitoring:**
The dashboard does not just display data; it validates the connection health. It consumes `signalStatus` and `signalClass` from the `TelemetryContext`.
* *Green (Success):* "Signal Acquired" — Data is real-time.
* *Yellow (Warning):* "Stale Signal" — Data is flowing but timestamps indicate a lag (AOS > 1.5ms divergence).
* *Grey/Red:* Disconnected.


* **Configuration-Driven UI Rendering:**
Instead of hardcoding individual DOM elements for every sensor, the component iterates over the `TELEMETRY_ITEMS` constant. This **Data-Driven Design** allows developers to add new sensors to the dashboard simply by updating the configuration array, without touching the JSX rendering logic.

### **C. Atomic Presentation: `components/PositionDisplay.tsx`**

A specialized, reusable atom component designed to format raw geodetic data into human-readable navigational standards.

* **Type Safety:** strictly typed via TypeScript (`type CoordinateType = 'lat' | 'lon'`) to prevent rendering errors.
* **Geodetic Logic:** automatically converts signed float values into Cardinal Directions.
* *Latitude:* Positive → **N**, Negative → **S**
* *Longitude:* Positive → **E**, Negative → **W**


* **State Awareness:** It connects directly to the `IssPositionContext`. If the API is polling (`isLoading`), it handles the loading state gracefully, preventing layout shifts (CLS) during data refreshes.

---

### **Component Implementation Details**

#### **Dashboard Logic Flow**

When `ISSDataExtended` mounts:

1. **Context Injection:** It hooks into `useTelemetry` to access the WebSocket stream.
2. **Dynamic Mapping:**
```typescript
{TELEMETRY_ITEMS.map(item => {
  // O(1) Lookup for telemetry data
  const telemetry = telemetryItems[item.id];
  return ( ... )
})}

```


This ensures that the rendering complexity is linear  relative to the number of sensors, maintaining high frame rates even with extensive data sets.

#### **Coordinate Formatting Logic**

The `PositionDisplay` component encapsulates the logic for cardinal direction resolution, ensuring that raw API data (e.g., `-51.6`) is presented to the user as standard navigational data (e.g., `51.6° S`).

```typescript
const direction = coordinate === 'lat'
  ? (position[coordinate] >= 0 ? 'N' : 'S')
  : (position[coordinate] >= 0 ? 'E' : 'W');
```
---

## **5. 3D Visualization & Simulation Layer (Demo Mode)**

The **Live V3 Demo** (`app/3d-model/live_v3_demo`) acts as a "Digital Twin Generator." Instead of consuming live data, it internally generates random telemetry vectors to test the rendering engine and the physical robot's servos simultaneously.

### **A. Simulation Engine: `app/3d-model/live_v3_demo/page.tsx`**

This page combines a React-Three-Fiber (R3F) canvas with a state-driven simulation loop.

#### **1. The Simulation Loop**

The core logic relies on a dual-dispatch mechanism. When `updateRandomTelemetry` triggers (either manually or via the 7-second interval), it performs two parallel actions:

* **Action A (Visuals):** Updates the React state (`setTelemetrySARJ1`, etc.), causing the 3D model to re-render instantly with new angles.
* **Action B (Hardware):** Constructs a binary packet and pushes it to the Bluetooth characteristic.

```typescript
// Dual-Dispatch Pattern
const updateRandomTelemetry = () => {
    // 1. Generate Physics Data
    const newSARJ1 = generateRandomAngle();
    // ... generate other angles

    // 2. Hardware Dispatch (if connected)
    if (isConnected) {
        const packet = createRobotPacket({
            angles: { angle0: newBGA1, ... }, // Mapping visual data to servo IDs
            buttons: { byte0: 1 }
        });
        sendPacket(packet);
    }

    // 3. Visual Dispatch (React State)
    setTelemetrySARJ1(newSARJ1);
    // ... update other states
};

```

*Note: This decoupling allows the UI to remain responsive even if the Bluetooth stack encounters latency.*

#### **2. 3D Scene Graph Architecture**

The 3D scene is constructed hierarchically to mimic the physical structure of the ISS Solar Arrays. We use **Group Nesting** to simulate the complex mechanics of the station:

* **Root Mesh:** Represents the station's core structure.
* **SARJ Group (Solar Alpha Rotary Joint):** Rotates along the X-axis (`rotation={[telemetrySARJ2 * (Math.PI/180), 0, 0]}`). This mimics the massive rotary joints that track the sun.
* **BGA Children (Beta Gimbal Assembly):** Inside the SARJ group, individual solar panels rotate along the Z-axis (`rotation={[0, 0, telemetryBGA7 * (Math.PI/180)]}`).



This parent-child relationship in the code replicates the real-world mechanics where the Beta Gimbals are physically attached to and rotating *with* the Alpha Joints.

---

### **B. Hardware Control Interface: `components/BluetoothConnectionInfo.tsx`**

This component manages the user's  connection with the robot.

* **State Management:** It consumes `useBluetooth` to toggle the connection state.
* **Visual Feedback:**
* **Dynamic Styling:** The button changes color based on `statusColor` (e.g., Green for connected, Red for error).
* **Telemetry Debug:** It displays raw `telemetryData` received *from* the robot (via notifications), allowing for bidirectional debugging (e.g., verifying if the robot received the packet).



---

### **C. Reusable 3D Components: `components/SolarPanel_v3.tsx`**

A pure presentational component designed for reusability. By accepting `props` for position, rotation, and color, a single mesh definition instantiates all 8 solar arrays on the station.

* **Geometry:** Uses `boxGeometry` to create a stylized, low-poly representation of the solar blankets.
* **Material:** Uses `meshLambertMaterial`, which interacts with the scene's `directionalLight` and `ambientLight` to create depth and shadows, essential for understanding orientation in 3D space.

---

## **6. Operational Modes: Live & Manual Control**

While the structure of the 3D scene remains consistent with the demo, the **Data Drivers** (the logic determining *why* and *when* the robot moves)are fundamentally different in these two views.

### **A. Live Mode (`app/3d-model/live_v3`)**

**"The Digital Twin Engine"**

In this mode, the application behaves as a passive conduit, synchronizing the physical robot and GUI with the actual International Space Station. The architecture shifts from a "Game Loop" (interval-based) to a Reactive Event-Driven model.

#### **1. Reactive Data Ingestion**

Instead of generating values, this component acts as a consumer of the global `TelemetryContext`. It maps specific Lightstreamer Item IDs to local variables.

```typescript
const { telemetryItems } = useTelemetry();
// Direct mapping of Telemetry IDs to functional variables
const telemetrySARJ1 = telemetryItems["S0000003"]; // Starboard Alpha Joint
const telemetryBGA1 = telemetryItems["P4000007"];  // Port Beta Gimbal

```

#### **2. The Telemetry Trigger (Effect Hook)**

The core logic resides in a specific `useEffect` hook. Unlike the demo which polls every 7 seconds, this hook fires **only** when specific telemetry values change. 

* **Optimization:** The dependency array `[telemetrySARJ1?.value, ...]` ensures that the React Reconciler only triggers a re-render and a Bluetooth packet when new data actually arrives.
* **Packet Construction:** The robot packet is built dynamically using the current live values. If a value is `undefined` (signal loss), it safely defaults to `0` or the last known position.

```typescript
useEffect(() => {
    sendTelemetryPacket();
}, [
    // The effect runs exclusively when these specific values change
    telemetrySARJ1?.value,
    telemetrySARJ2?.value,
    telemetryBGA1?.value,
    // ... other dependencies
    isConnected
]);

```

---

### **B. Manual Mode (`app/3d-model/manual_v3`)**

**"The Operator Console"**

This view inverts the control flow. The user becomes the "Sensor," giving them granular command over the robot's servos. This requires a more complex local state architecture to handle **Group vs. Individual** addressing.

#### **1. Granular State Management**

The ISS solar arrays have a hierarchical movement structure. The Manual Mode replicates this via nested state objects, allowing the user to control panels collectively or individually.

* **Alpha Joints (Groups):** Controlled as "Group 1" (Red/Orange) or "Group 2" (Green/Purple).
* **Beta Gimbals (Individuals):** Each panel can be targeted independently.

```typescript
// Complex state object for Group Addressing
const [groupAlphaAngles, setGroupAlphaAngles] = useState({
    group1: 0, // Controls Red and Orange panels simultaneously
    group2: 0  // Controls Green and Purple panels simultaneously
});

```

#### **2. The "Form-Command" Pattern**

Unlike Live mode, which is continuous, Manual mode uses a transaction-based approach.

1. **Selection:** User selects a target (e.g., "Red Panel 1" or "All Panels").
2. **Staging:** User adjusts the slider (updates `sliderValue` state, but *not* the robot yet).
3. **Commit:** User clicks "Set Alpha/Beta". This triggers `handleSubmit`, which:
* Calculates the new state tree based on the selection logic (All vs. Single).
* Constructs the packet.
* Flushes the command to the robot.



#### **3. Conditional Logic for Grouping**

The submit handlers implement logic to determine the scope of the command.

```typescript
if (selectedAlphaGroup === "all") {
    // Broadcast mode: Update entire state tree
    updatedAlphaAngles = { group1: alphaSliderValue, group2: alphaSliderValue };
} else {
    // Unicast mode: Update specific key using computed property names
    updatedAlphaAngles[selectedAlphaGroup] = alphaSliderValue;
}

```

### **Summary of Differences**

| Feature | Live Mode (`live_v3`) | Manual Mode (`manual_v3`) | Demo Mode (`live_v3_demo`) |
| --- | --- | --- | --- |
| **Data Source** | `TelemetryContext` (Lightstreamer) | User Input (UI Forms) | `Math.random()` |
| **Trigger** | Reactive (`useEffect` on value change) | Transactional (`onSubmit` event) | Interval (7s Timer) |
| **State Logic** | Read-Only (Unidirectional flow) | Read/Write  | Write-Only (Ephemeral) |
| **Addressing** | 1:1 Mapping (ID to Servo) | 1:Many Mapping (Groups/All) | Random Assignment |

---

This section details the **Orbital Tracking & Positioning Layer**. This module is responsible for projecting the spherical coordinates of the ISS (Latitude/Longitude) onto a flattened 2D plane within the 3D environment.

It features two distinct implementations: an autonomous **Live Tracker** that visualizes real-time position, and a **Manual Simulation** that allows for calibration and testing of coordinate transmission to the robot.

---

## **7. Map View: Orbital Tracking & Positioning Layer**

### **A. Core Rendering Environment: `components/Room.tsx`**

The "Map" is rendered as a textured plane within a Three.js group. To ensure high-fidelity visualization of the Earth texture without artifacts, we configure the texture encoding explicitly.

* **Texture Filtering:** Uses `THREE.LinearFilter` for both minification and magnification to smooth pixelation when zooming.
* **Color Space:** Enforces `THREE.SRGBColorSpace`. This is crucial because standard textures often appear washed out in React Three Fiber if the color space conversion isn't handled manually during the loader phase.
* **Geometry:** The Earth is a flat `planeGeometry` rotated -90° on the X-axis (`[-Math.PI / 2, 0, 0]`), effectively becoming the "floor" of the scene ( plane).

---

### **B. Live Tracking: Geodetic to Cartesian Projection**

**File:** `app/map/page.tsx`

The challenge in this view is converting the ISS's Geodetic coordinates (Latitude/Longitude) into the Cartesian coordinates (X/Z) used by the 3D engine.

#### **1. The Projection Algorithm**

The component normalizes the global coordinates into a scalar range  and then expands them to the scene dimensions.

* **Longitude () to X:**



*Logic:* Maps the range  to scene coordinates .
* **Latitude () to Z:**



*Logic:* Maps the range  to scene coordinates. Note that we invert the calculation because, in standard map projections, "Up" is North, but in 3D coordinate space,  often represents "forward/down".

#### **2. Reactive State Engine**

Similar to the telemetry dashboard, this component hooks into the `IssPositionContext`.

```typescript
useEffect(() => {
    if (position && !isLoading) {
        setSpherePosition(prev => ({
            ...prev,
            x: map_lon_to_x(),
            y: map_lat_to_y() // Mapped to Z-axis in render
        }));
    }
}, [position, isLoading]);

```

---

### **C. Manual Control & Dynamic Camera Math**

**File:** `map/manual/page.tsx`

This view is designed for **Calibration**. It allows the user to define arbitrary map dimensions and move the target manually. It features a sophisticated camera positioning algorithm and a normalized data protocol for the robot.

#### **1. Dynamic Frustum Calculation**

To ensure the map always fills 75% of the user's screen regardless of the arbitrary dimensions set by the user (`width`/`depth`), the camera height is calculated using trigonometry based on the Field of View (FOV).

```typescript
// Code Implementation
const coverageFactor = 0.9;
const maxDimension = Math.max(width, depth);
const cameraHeight = (maxDimension / coverageFactor / 2) / Math.tan((fov * Math.PI / 180) / 2);

```

This ensures that whether the user sets a map width of 100 or 10,000, the viewport automatically centers and zooms to fit the bounds perfectly.

#### **2. Robot Coordinate Normalization Protocol**

When sending position data to the physical XRP robot, raw Cartesian coordinates are useless because the physical space dimensions differ from the 3D scene dimensions.

We implement a **Normalization Protocol** that sends relative percentage values (0-100) instead of absolute units.

```typescript
const sendPositionPacket = () => {
    // Normalize to 0-100 integer range
    const x_normalized = Math.round((spherePosition.x / width) * 100);
    const y_normalized = Math.round((spherePosition.y / depth) * 100);

    const packet = createRobotPacket({
        coordinates: {
            x: x_normalized,
            y: y_normalized
        },
        buttons: { byte0: 3 } // OpCode 3: Position Update
    });
    sendPacket(packet);
};

```

* **OpCode 3:** The `byte0` of the buttons array is repurposed as an Operation Code. Value `3` tells the robot's firmware: "The following bytes are X/Y coordinates, not servo angles."





