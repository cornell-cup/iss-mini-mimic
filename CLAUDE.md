# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ISS Mimic Mini is a full-stack application that functions as a command-and-control center for an XRP Robot that physically mimics the International Space Station's solar array movements. It consumes real-time ISS telemetry via Lightstreamer, computes orbital position via TLE propagation, and sends binary control packets to the robot over Web Bluetooth.

## Commands

### Frontend (`iss-mimic-frontend/`)

```bash
npm install          # Install dependencies
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Build for production with Turbopack
npm start            # Start production server
```

> Web Bluetooth requires Chrome (or a Chromium-based browser).

There are no tests configured in this project.

### ML Classification Model (`ml_classification_model/`)

```bash
py -m uvicorn api:app --reload --port 8000
```

## Architecture

### Frontend: Next.js App Router Structure

The app uses **React Context as a dependency injection root** in `app/layout.tsx`. Three providers wrap the entire app tree, ensuring state persists across route navigation:

```
BluetoothProvider → TelemetryProvider → IssPositionProvider → {children}
```

This is critical: the BLE connection and Lightstreamer socket must not be torn down when navigating between routes.

### Three Data Pipelines

**1. Lightstreamer Telemetry (`contexts/TelemetryContext.tsx`)**
- Persistent WebSocket/HTTP-Stream to ISS live data servers via `lightstreamer-client-web`
- MERGE subscription mode for high-frequency updates
- Specific item IDs (e.g., `S0000003` = SARJ angles, `P4000007` = Beta Gimbal Assembly)
- Signal integrity logic: compares AOS timestamp against current UTC to detect "Stale Signal" / LOS

**2. ISS Position (`contexts/IssPositionContext.tsx` + `app/api/iss-position/route.ts`)**
- Polls internal API `/api/iss-position` every 10 seconds
- Server-side API route uses `satellite.js` for TLE propagation (orbital elements → lat/lon)
- **8-hour file-system cache** in `utils/Iss_Tle.json` to avoid Celestrak rate limits

**3. Web Bluetooth (`contexts/BluetoothContext.tsx`)**
- GATT Service UUID: `27df26c5-83f4-4964-bae0-d7b7cb0a1f54` (Pestoble Service)
- Gamepad characteristic (`...41a9`): `WriteWithoutResponse` for high-frequency control packets
- Telemetry characteristic (`...d0c`): Notifications for data from robot

### Binary Packet Protocol (`utils/robotPackets.ts`)

The robot requires strictly formatted 26-byte `Uint8Array` (not JSON):
- Byte 0: Protocol version `0x03`
- Angles encoded as Little Endian 2-byte pairs: low byte = `angle & 0xFF`, high byte = `(angle >> 8) & 0xFF`
- Button states compressed via bitmasking
- `byte0` doubles as an opcode: value `3` = position update (X/Y coordinates), other values = servo angles

### 3D Visualization Modes (`app/3d-model/`)

| Mode | Route | Data Source | Trigger |
|------|-------|-------------|---------|
| Live | `live_v3` | `TelemetryContext` | `useEffect` on telemetry value change |
| Demo | `live_v3_demo` | `Math.random()` | 7-second interval |
| Manual | `manual_v3` | User slider input | `onSubmit` (transactional) |

**3D scene hierarchy mirrors ISS mechanics**: SARJ Group (rotates X-axis) contains BGA children (rotate Z-axis). This parent-child nesting replicates how Beta Gimbals physically attach to and rotate with Alpha Joints.

Each mode uses **dual-dispatch**: the same packet that updates React state (visuals) is also sent over Bluetooth (hardware), keeping the digital twin and physical robot synchronized.

### Map View (`app/map/`)

Projects ISS geodetic coordinates onto a flat equirectangular Earth texture plane. Longitude maps to X, latitude maps to Z (inverted because 3D "up" ≠ map "north"). Manual mode normalizes Cartesian coordinates to 0–100 percentages before sending to the robot, since physical and 3D space dimensions differ.

### Backend Components

**`iss-mimic-backend/`** — MicroPython firmware for the XRP Robot. Implements a BLE GATT server that receives the 26-byte packets and drives servos.

**`iss_positioning_server/`** — Standalone Python script using `ephem` to calculate ISS position from TLE data (alternative to the Next.js API route).

**`ml_classification_model/`** — Educational K-NN and logistic regression hemisphere classifier served via FastAPI. Designed for middle-school demos showing how data quality affects AI accuracy. Trained models are committed as `.joblib` files.
