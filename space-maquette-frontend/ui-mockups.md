# Space Maquette Frontend UI Mockups

## Overall Layout

```
+--------------------------------------------------------------+
| LOGO  Space Maquette: [Artwork Name] by [Artist]    [E-STOP] |
+------+-----------------------------------------------------+
|      |                                                     |
|  N   |  +-------------------+  +----------------------+    |
|  A   |  |                   |  |                      |    |
|  V   |  |  Camera Preview   |  |     Map Preview      |    |
|      |  |                   |  |                      |    |
|  M   |  +-------------------+  +----------------------+    |
|  E   |                                                     |
|  N   |  +-------------------+  +----------------------+    |
|  U   |  |                   |  |                      |    |
|      |  |  Motion Controls  |  |   Status & Controls  |    |
|      |  |                   |  |                      |    |
|      |  +-------------------+  +----------------------+    |
|      |                                                     |
+------+-----------------------------------------------------+
| Status: Connected | X: 125.00 | Y: 125.00 | Z: 55.00 | ... |
+--------------------------------------------------------------+
```

## Curator Mode

### Header
```
+--------------------------------------------------------------+
| ⚙️ V1.0.0  Space Maquette: "Cosmic Drift" by Jane Doe  🔴 STOP|
+--------------------------------------------------------------+
```

### Camera Preview Panel
```
+-------------------+
| [Camera View]     |
|                   |
| 🔍 Zoom: 100%     |
| 🎥 Effects: None  |
+-------------------+
```

### Map Preview Panel
```
+----------------------+
| [Overhead Map]       |
|                      |
| 👁️ Layers:           |
| ☑️ Height Map        |
| ☑️ No-Go Regions     |
| ☐ Grid               |
|                      |
| 🖌️ Edit No-Go        |
| 📷 Take Overhead     |
| 🔍 Scan Region       |
+----------------------+
```

### Motion Controls Panel
```
+-------------------+
|       [↑]         |
|   [←] [■] [→]     |
|       [↓]         |
|                   |
| Z: [↑]  Pan: [←][→]|
|    [↓]  Tilt:[↑][↓]|
|                   |
| Z Mode: [Auto|Manual]|
|                   |
| [🎮 Keyboard Mode] |
+-------------------+
```

### Status & Controls Panel
```
+----------------------+
| System Status:       |
| ● ClearCore: Connected|
| ● Rangefinder: Active |
| ● E-Stop: Inactive    |
|                      |
| Position:            |
| X: 125.00 mm         |
| Y: 125.00 mm         |
| Z: 55.00 mm          |
| Pan: 180°            |
| Tilt: 90°            |
|                      |
| [Show Metadata]      |
| [Configure Backdrop] |
+----------------------+
```

### Show Metadata Panel (Expanded)
```
+--------------------------------------------------------------+
| Artwork Details                                     [Close ×] |
|                                                              |
| Title: [Cosmic Drift                                       ] |
| Artist: [Jane Doe                                          ] |
| Date: [2025                                                ] |
| Materials: [Mixed media, electronics                       ] |
| Dimensions: [200 × 150 × 100 cm                           ] |
| Description:                                                 |
| [                                                          ] |
| [                                                          ] |
|                                                              |
| [Save] [Cancel]                                              |
+--------------------------------------------------------------+
```

### Backdrop Configuration Panel (Expanded)
```
+--------------------------------------------------------------+
| Backdrop Configuration                              [Close ×] |
|                                                              |
| Type:                                                        |
| (○) Natural Background                                       |
| (○) Physical Covering                                        |
| (○) Chroma Key                                               |
| (○) Solid Color                                              |
| (○) 3D Skybox                                                |
|                                                              |
| Chroma Key Settings:                                         |
| Transparency: [▒▒▒▒▒▒▒▒▒▒] 75%                              |
|                                                              |
| Solid Color:                                                 |
| [Color Picker] #000000                                       |
|                                                              |
| 3D Skybox:                                                   |
| [▼ Select Skybox] [Upload New]                               |
|                                                              |
| [Apply] [Cancel]                                             |
+--------------------------------------------------------------+
```

### Scan Region Dialog
```
+--------------------------------------------------------------+
| Select Scan Region                                  [Close ×] |
|                                                              |
| [Map with selectable region]                                 |
|                                                              |
| Hold Shift to add regions                                    |
| Hold - to remove regions                                     |
|                                                              |
| Selected area: 45 × 30 cm                                    |
| Estimated scan time: 22 minutes                              |
|                                                              |
| [Start Scan] [Cancel]                                        |
+--------------------------------------------------------------+
```

### Scan Progress Dialog
```
+--------------------------------------------------------------+
| Scan in Progress                                    [Close ×] |
|                                                              |
| Progress: [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 65%            |
| Time remaining: 8 minutes                                    |
| Area completed: 29 × 30 cm                                   |
|                                                              |
| [Pause] [Cancel]                                             |
+--------------------------------------------------------------+
```

## Debug Mode

### ClearCore Commands Panel
```
+--------------------------------------------------------------+
| ClearCore Commands                                  [Close ×] |
|                                                              |
| Connection: [Scan for ClearCore] Status: Connected           |
|                                                              |
| System Commands:                                             |
| [PING] [RESET] [STATUS] [DEBUG: ON|OFF] [E-STOP] [RESET E-STOP]|
|                                                              |
| Motion Commands:                                             |
| HOME: [ALL] [X] [Y] [Z]                                      |
|                                                              |
| MOVE: X[125.00] Y[125.00] Z[55.00] Pan[180] Tilt[90] [GO]    |
|                                                              |
| [STOP]                                                       |
|                                                              |
| VELOCITY: X[300] Y[300] Z[150] [SET]                         |
|                                                              |
| Rangefinder Commands:                                        |
| [MEASURE]                                                    |
|                                                              |
| SCAN: X1[0] Y1[0] X2[100] Y2[100] Step[1] [GO]               |
|                                                              |
| Servo Commands:                                              |
| TILT: [90.00] [SET]  PAN: [180.00] [SET]                     |
|                                                              |
| Configuration Commands:                                      |
| [CONFIG LOAD] [CONFIG SAVE] [CONFIG LIST]                    |
|                                                              |
| GET: [▼ Select Key] [GET]                                    |
| SET: [▼ Select Key] Value: [         ] [SET]                 |
|                                                              |
| [SAVE]                                                       |
+--------------------------------------------------------------+
```

### Terminal Output Panel
```
+--------------------------------------------------------------+
| Terminal Output                                     [Clear ×] |
|                                                              |
| > PING                                                       |
| < PONG                                                       |
| > STATUS                                                     |
| < STATUS X:125.00 Y:125.00 Z:55.00 PAN:180.00 TILT:90.00 ... |
| > CONFIG LIST                                                |
| < system_name=Space Maquette                                 |
| < firmware_version=1.0.0                                     |
| < serial_number=SM-2025-001                                  |
| < ...                                                        |
|                                                              |
| Command: [                                        ] [Send]   |
+--------------------------------------------------------------+
```

## Mobile Layout (Responsive)

```
+----------------------+
| Space Maquette  [≡]  |
+----------------------+
| [Camera Preview]     |
|                      |
+----------------------+
| [Map Preview]        |
|                      |
+----------------------+
| Motion Controls      |
| [↑]                  |
| [←] [■] [→]          |
| [↓]                  |
+----------------------+
| System Status        |
| X: 125.00 Y: 125.00  |
| Z: 55.00             |
+----------------------+
| [Menu]               |
+----------------------+
```

## Color Palette

- **Primary**: #1976d2 (Blue)
- **Secondary**: #dc004e (Pink)
- **Background**: #121212 (Dark Gray)
- **Surface**: #1e1e1e (Lighter Dark Gray)
- **Error**: #f44336 (Red)
- **Warning**: #ff9800 (Orange)
- **Success**: #4caf50 (Green)
- **Info**: #2196f3 (Light Blue)
- **Text Primary**: #ffffff (White)
- **Text Secondary**: #b0b0b0 (Light Gray)

## Typography

- **Headings**: Roboto, sans-serif
- **Body**: Roboto, sans-serif
- **Monospace**: Roboto Mono, monospace (for terminal output)
- **Base Size**: 16px
- **Scale**: 1.25 (major third)

## Icons

Using Material Design icons for consistency:
- Emergency Stop: Error icon
- Home: Home icon
- Settings: Gear icon
- Camera: Camera icon
- Map: Map icon
- Motion: Arrows icon
- Terminal: Console icon
- Edit: Pencil icon
- Scan: Search icon
- Layers: Layers icon
