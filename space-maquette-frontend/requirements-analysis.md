# Space Maquette Frontend Requirements Analysis

## Project Overview
The Space Maquette project requires a frontend application for fine-tuning and debugging motion control and scan mapping. This application will serve as an interface for monitoring and commanding the motion controller, helping curators set up parameters, tune model scans, preview motion paths, and configure lighting via camera preview.

## Inspiration
The UI design will be inspired by Klipper's Fluidd skin, which provides a clean, modern interface for 3D printer control with well-organized panels, real-time monitoring, and intuitive controls.

## Technology Stack
- **Frontend**: React.js with TypeScript
- **State Management**: Redux or Context API
- **UI Framework**: Material-UI or Tailwind CSS
- **Communication**: WebSocket (Socket.IO) for real-time updates
- **Server**: Node.js or Express.js initially, with plans to transition to C++ later
- **Database**: SQLite for persistence

## Application Modes

### 1. Curator Mode
An interactive preparation environment for the show, allowing metadata management and motion control.

#### Key Features:
1. **Camera Preview Window**
   - Always visible, taking ~25% of screen
   - Live camera feed with video effects
   - Temporary full-screen view with spacebar
   - Served from host computer on separate stream

2. **Show Metadata**
   - Hidden panel for entering artwork details
   - Fields: name, artist, date, materials, scale, dimensions
   - Artwork name and artist prominently displayed at interface top

3. **Backdrop Configuration**
   - Options: natural background, physical covering, chroma key
   - Chroma key controls with transparency cutoff slider
   - Solid color option with color picker
   - 3D generated background (Unity skybox)
   - Selection between artist and curator choices

4. **Map Preview**
   - ~25% of screen space
   - Overhead image with transparent grayscale Z-displacement heatmap
   - Color legend for height mapping
   - Layer toggles
   - No-go region editing with drawing tools
   - Current position and heading indicator (eye icon with frustum)

5. **Overhead Image Capture**
   - Command to take screenshot from undercarriage camera
   - Background layer for installation map
   - Automated positioning sequence

6. **Scan Region Controls**
   - Rectangle/polygon drawing for scan area selection
   - Confirmation dialog with estimated completion time
   - Multi-region selection (shift key to add, minus key to remove)
   - Non-blocking progress indicator
   - Pause/Resume/Cancel scan controls

7. **System Statistics Display**
   - Position indicators (X, Y, Z, pan, tilt)
   - "Home" indicator when axes are homed
   - Status indicators for rangefinder, ClearCore, E-stop, tilt servo

8. **Motion Controls**
   - X/Y positive and negative controls
   - Z-axis toggle (automatic/manual mode)
   - Pan/tilt buttons
   - Keyboard control toggle (WASD + mouse look)
   - Full-screen video with spacebar
   - WebSocket communication for continuous data stream

### 2. Debug Mode
Development and hardware troubleshooting interface with direct ClearCore access.

#### Key Features:
1. **Shared Elements from Curator Mode**
   - Camera preview window
   - Map preview (without editing controls)
   - Numeric indicators
   - Motion controls

2. **ClearCore Commands Interface**
   - ClearCore scanner
   - Text monitor with scrollable terminal
   - System commands section
   - Motion commands section
   - Rangefinder commands section
   - Servo commands section
   - Configuration commands with settings management

## Server Application Requirements

1. **JSON Communication**
   - Supply initialization data to frontend
   - Handle state updates

2. **Persistence**
   - SQLite database for storing configuration
   - Save/load functionality for settings

3. **WebSocket Implementation**
   - Real-time communication for motion control
   - Status updates

4. **Future Considerations**
   - C++ implementation for production
   - ClearCore communication
   - Video streaming and processing
   - User experience management

## UI/UX Requirements

1. **Layout**
   - Clean, modern interface similar to Klipper Fluidd
   - Responsive design
   - Dark theme (based on reference images)
   - Collapsible panels

2. **Navigation**
   - Tab-based navigation between modes
   - Sidebar for main sections
   - Contextual controls

3. **Interaction Patterns**
   - Direct manipulation for drawing and selection
   - Keyboard shortcuts for power users
   - Confirmation dialogs for destructive actions
   - Real-time feedback

## Technical Challenges

1. **Real-time Communication**
   - Implementing efficient WebSocket communication
   - Handling connection interruptions

2. **Drawing Tools**
   - Canvas-based implementation for no-go regions
   - Efficient storage and transmission of region data

3. **Video Streaming**
   - Integration with external video stream
   - Full-screen toggle functionality

4. **3D Visualization**
   - Representing camera frustum and position
   - Visualizing height map data

5. **Long-running Operations**
   - Non-blocking progress indicators
   - Pause/resume functionality for scans

## Next Steps

1. Design UI mockups and component structure
2. Set up React frontend project with necessary dependencies
3. Implement core UI components
4. Develop the two main application modes
5. Create server application with dummy backend
6. Integrate frontend and server with WebSocket communication
