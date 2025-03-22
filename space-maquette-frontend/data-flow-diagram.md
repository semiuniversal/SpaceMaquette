# Space Maquette Frontend Data Flow Diagram

## Overview

This document outlines the data flow architecture for the Space Maquette frontend application, illustrating how data moves between components, the server, and the ClearCore controller.

## Main Data Flow Paths

```
+----------------+    WebSocket    +----------------+    TCP/IP     +----------------+
|                |<--------------->|                |<------------->|                |
|  React         |    REST API     |  Server        |    Commands   |  ClearCore     |
|  Frontend      |<--------------->|  Application   |<------------->|  Controller    |
|                |                 |                |               |                |
+----------------+                 +----------------+               +----------------+
       ^                                   ^
       |                                   |
       v                                   v
+----------------+                 +----------------+
|  Browser       |                 |  SQLite        |
|  LocalStorage  |                 |  Database      |
+----------------+                 +----------------+
```

## Detailed Data Flow

### Frontend to Server Communication

1. **WebSocket Events (Real-time)**
   - Position updates (X, Y, Z, Pan, Tilt)
   - System status changes
   - Scan progress updates
   - Video stream control

2. **REST API Endpoints (Request/Response)**
   - Configuration management
   - Show metadata storage/retrieval
   - Map data operations
   - User authentication (future)

### Server to ClearCore Communication

1. **Command Protocol**
   - System commands (PING, RESET, STATUS)
   - Motion commands (HOME, MOVE, STOP)
   - Rangefinder commands (MEASURE, SCAN)
   - Servo commands (TILT, PAN)
   - Configuration commands (CONFIG LOAD/SAVE, GET, SET)

2. **Response Handling**
   - Command acknowledgments
   - Status reports
   - Error messages
   - Scan data

### Data Persistence

1. **Browser Storage**
   - User preferences
   - UI state
   - Session information

2. **Server Database**
   - Show metadata
   - Configuration settings
   - Scan results
   - No-go region maps
   - System logs

## State Management

### Frontend State

```
AppState
├── SystemState
│   ├── connectionStatus
│   ├── clearCoreStatus
│   ├── emergencyStop
│   └── currentMode (Curator/Debug)
│
├── MotionState
│   ├── position (x, y, z)
│   ├── orientation (pan, tilt)
│   ├── zMode (auto/manual)
│   ├── velocities
│   └── homeStatus
│
├── CameraState
│   ├── streamActive
│   ├── effects
│   └── fullscreen
│
├── MapState
│   ├── overheadImage
│   ├── heightMap
│   ├── noGoRegions
│   ├── visibleLayers
│   └── selectedScanRegions
│
├── ScanState
│   ├── scanActive
│   ├── scanPaused
│   ├── progress
│   ├── timeRemaining
│   └── scanHistory
│
├── BackdropState
│   ├── backdropType
│   ├── chromaKeySettings
│   ├── solidColor
│   └── skyboxSelection
│
├── MetadataState
│   ├── title
│   ├── artist
│   ├── date
│   ├── materials
│   ├── dimensions
│   └── description
│
└── DebugState
    ├── terminalHistory
    ├── commandInput
    └── configValues
```

### Server State

```
ServerState
├── ConnectionState
│   ├── clientConnections
│   ├── clearCoreConnection
│   └── videoStreamStatus
│
├── SystemState
│   ├── currentConfiguration
│   ├── systemLogs
│   └── errorState
│
├── DataState
│   ├── showMetadata
│   ├── scanData
│   ├── mapData
│   └── noGoRegions
│
└── OperationState
    ├── activeOperations
    ├── scanQueue
    └── operationHistory
```

## Event Flow Examples

### Example 1: User Initiates Motion

1. User clicks "Move Forward" button in frontend
2. Frontend dispatches action to update MotionState
3. WebSocket event sent to server with new target position
4. Server validates motion request
5. Server sends command to ClearCore: "MOVE X Y Z"
6. ClearCore acknowledges command and begins motion
7. ClearCore sends position updates during motion
8. Server receives updates and broadcasts via WebSocket
9. Frontend receives updates and updates position display
10. Motion completes, final position stored in database

### Example 2: Scanning Process

1. User selects region and initiates scan
2. Frontend sends scan request with region coordinates
3. Server calculates scan path and estimated time
4. Server sends confirmation to frontend
5. User confirms scan
6. Server sends SCAN command to ClearCore
7. ClearCore begins scanning process
8. Progress updates sent from ClearCore to server
9. Server broadcasts progress via WebSocket
10. Frontend updates progress bar and map display
11. Scan completes, data processed by server
12. Height map generated and stored in database
13. Frontend notified of completion
14. Height map displayed as overlay on map

## Data Structures

### Position Data
```json
{
  "x": 125.00,
  "y": 125.00,
  "z": 55.00,
  "pan": 180.00,
  "tilt": 90.00
}
```

### System Status
```json
{
  "connected": true,
  "clearCoreStatus": "READY",
  "rangefinderActive": true,
  "eStop": false,
  "servoStatus": "ACTIVE",
  "firmwareVersion": "1.0.0",
  "lastUpdated": "2025-03-20T04:25:00Z"
}
```

### Scan Region
```json
{
  "id": "scan-001",
  "x1": 50,
  "y1": 50,
  "x2": 150,
  "y2": 150,
  "step": 1,
  "estimatedTime": 1320,
  "status": "pending"
}
```

### Show Metadata
```json
{
  "title": "Cosmic Drift",
  "artist": "Jane Doe",
  "date": "2025",
  "materials": "Mixed media, electronics",
  "dimensions": "200 × 150 × 100 cm",
  "description": "An interactive installation exploring spatial relationships."
}
```

### No-Go Region
```json
{
  "id": "nogo-001",
  "type": "polygon",
  "points": [
    {"x": 50, "y": 50},
    {"x": 100, "y": 50},
    {"x": 100, "y": 100},
    {"x": 50, "y": 100}
  ],
  "color": "#ff0000"
}
```

## WebSocket Event Types

- `position_update`: Real-time position information
- `status_change`: System status changes
- `scan_progress`: Updates during scanning process
- `error`: Error notifications
- `command_response`: Responses to commands
- `connection_status`: Connection state changes

## REST API Endpoints

- `GET /api/config`: Retrieve configuration
- `POST /api/config`: Update configuration
- `GET /api/metadata`: Get show metadata
- `POST /api/metadata`: Update show metadata
- `GET /api/map`: Get map data
- `POST /api/map/overhead`: Upload new overhead image
- `GET /api/scan/regions`: Get scan regions
- `POST /api/scan/regions`: Create new scan region
- `GET /api/nogo`: Get no-go regions
- `POST /api/nogo`: Update no-go regions
