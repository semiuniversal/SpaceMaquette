# Space Maquette Frontend Component Structure

## Application Architecture

```
App
├── AppLayout
│   ├── Header
│   │   ├── Logo
│   │   ├── ArtworkInfo
│   │   ├── ModeSelector (Curator/Debug)
│   │   └── EmergencyStop
│   ├── Sidebar
│   │   ├── NavigationMenu
│   │   └── StatusIndicators
│   └── MainContent
│       ├── CuratorMode
│       │   ├── CameraPreview
│       │   ├── MapPreview
│       │   ├── MotionControls
│       │   ├── ShowMetadata
│       │   ├── BackdropConfig
│       │   └── ScanControls
│       └── DebugMode
│           ├── CameraPreview
│           ├── MapPreview (simplified)
│           ├── MotionControls
│           ├── ClearCoreCommands
│           └── TerminalOutput
└── SharedComponents
    ├── VideoPlayer
    ├── CanvasDrawing
    ├── ControlPanel
    ├── NumericInput
    ├── StatusBadge
    ├── ProgressIndicator
    ├── ConfirmationDialog
    └── ColorPicker
```

## Component Descriptions

### Core Layout Components

#### AppLayout
- Main application container
- Manages overall layout and responsive behavior
- Handles keyboard shortcuts (spacebar for fullscreen, etc.)

#### Header
- Contains application branding and global controls
- Displays artwork name and artist prominently
- Houses mode selector and emergency stop button

#### Sidebar
- Navigation between different sections
- Displays system status indicators
- Collapsible for more screen space

#### MainContent
- Container for active mode content
- Handles transitions between modes

### Curator Mode Components

#### CameraPreview
- Displays live camera feed
- Handles fullscreen toggle
- Shows video effects processing

#### MapPreview
- Displays overhead image with heatmap overlay
- Contains layer toggles
- Shows camera position and heading
- Hosts drawing tools for no-go regions

#### MotionControls
- X/Y/Z axis controls
- Pan/tilt controls
- Mode toggles (automatic/manual Z)
- Keyboard control activation

#### ShowMetadata
- Form for artwork details
- Collapsible panel
- Save/load functionality

#### BackdropConfig
- Background type selection
- Chroma key controls
- Color picker for solid backgrounds
- Skybox selection and preview

#### ScanControls
- Region selection interface
- Scan progress monitoring
- Pause/resume/cancel buttons
- Time estimation display

### Debug Mode Components

#### ClearCoreCommands
- Organized by command categories
- System commands section
- Motion commands section
- Rangefinder commands section
- Servo commands section
- Configuration commands section

#### TerminalOutput
- Scrollable command history
- Response display
- Command input field

### Shared Components

#### VideoPlayer
- Handles video stream display
- Supports fullscreen toggle
- Manages stream connection

#### CanvasDrawing
- Drawing tools implementation
- Shape creation (rectangle, circle, polygon)
- Color selection
- Layer management

#### ControlPanel
- Reusable panel with title and collapsible content
- Consistent styling across application

#### NumericInput
- Specialized input for numeric values
- Unit display
- Increment/decrement buttons
- Validation

#### StatusBadge
- Visual indicator for system states
- Color-coded status representation

#### ProgressIndicator
- Non-blocking progress display
- Time remaining estimation
- Cancel option

#### ConfirmationDialog
- Reusable dialog for confirming actions
- Customizable content and buttons

#### ColorPicker
- Color selection interface
- Preset colors
- Custom color input

## State Management

### Global State
- Current mode (Curator/Debug)
- Connection status
- System status
- Emergency stop state

### Curator Mode State
- Camera settings
- Map layers visibility
- Selected scan regions
- Scan progress
- Motion parameters
- Z-axis mode (auto/manual)

### Debug Mode State
- Terminal history
- Command categories
- Configuration values

## Communication Architecture

### WebSocket Events
- Position updates
- Status changes
- Command responses
- Scan progress updates

### REST API Endpoints
- Configuration management
- Metadata storage
- Map data retrieval
- Image capture

## Responsive Design Breakpoints

- Mobile: < 768px (limited functionality)
- Tablet: 768px - 1024px
- Desktop: 1024px - 1440px
- Large Desktop: > 1440px

## Theme Structure

- Color palette (based on dark theme)
- Typography scale
- Spacing system
- Component-specific styling
- Animation definitions
