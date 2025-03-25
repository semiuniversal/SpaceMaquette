// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Box, Grid, CssBaseline, ThemeProvider } from '@mui/material';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import ControlPanel from './components/shared/ControlPanel';
import CameraPreview from './components/shared/CameraPreview';
import MotionControls from './components/shared/MotionControls';
import StatusDisplay from './components/shared/StatusDisplay';
import DebugMode from './components/debug/DebugMode';
import theme from './theme';
import { WebSocketProvider, useWebSocket } from './contexts/WebSocketContext';

const AppContent: React.FC = () => {
  // Local state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<'curator' | 'debug'>(
    'curator'
  );
  const [cameraFullscreen, setCameraFullscreen] = useState(false);
  const [zMode, setZMode] = useState<'auto' | 'manual'>('auto');

  // Artwork data
  const [title, setTitle] = useState('Cosmic Drift');
  const [artist, setArtist] = useState('Jane Doe');

  // WebSocket context
  const { position, systemStatus, sendCommand, connected } = useWebSocket();

  // Effect to fetch artwork data from the server
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/metadata');
        const data = await response.json();
        if (data.title && data.artist) {
          setTitle(data.title);
          setArtist(data.artist);
        }
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      }
    };

    fetchMetadata();
  }, []);

  // Handlers
  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleEmergencyStop = async () => {
    if (systemStatus.eStop) {
      await sendCommand('RESET_ESTOP');
    } else {
      await sendCommand('ESTOP');
    }
  };

  const handleModeChange = (mode: 'curator' | 'debug') => {
    setCurrentMode(mode);
    setSidebarOpen(false);
  };

  const handleOpenMetadataDialog = () => {
    // This will be implemented once we have the ShowMetadataDialog component
    console.log('Open metadata dialog');
    setSidebarOpen(false);
  };

  const handleOpenCameraMenu = () => {
    // For now, just toggle fullscreen as a placeholder
    setCameraFullscreen(!cameraFullscreen);
    setSidebarOpen(false);
  };

  const handleMove = async (
    direction:
      | 'x+'
      | 'x-'
      | 'y+'
      | 'y-'
      | 'z+'
      | 'z-'
      | 'pan+'
      | 'pan-'
      | 'tilt+'
      | 'tilt-'
      | 'stop'
  ) => {
    if (direction === 'stop') {
      await sendCommand('STOP');
      return;
    }

    const newPosition = { ...position };

    switch (direction) {
      case 'x+':
        newPosition.x += 10;
        break;
      case 'x-':
        newPosition.x -= 10;
        break;
      case 'y+':
        newPosition.y += 10;
        break;
      case 'y-':
        newPosition.y -= 10;
        break;
      case 'z+':
        newPosition.z += 5;
        break;
      case 'z-':
        newPosition.z -= 5;
        break;
      case 'pan+':
        await sendCommand('PAN', [(newPosition.pan + 15) % 360]);
        return;
      case 'pan-':
        await sendCommand('PAN', [(newPosition.pan - 15 + 360) % 360]);
        return;
      case 'tilt+':
        await sendCommand('TILT', [Math.min(newPosition.tilt + 5, 135)]);
        return;
      case 'tilt-':
        await sendCommand('TILT', [Math.max(newPosition.tilt - 5, 45)]);
        return;
    }

    await sendCommand('MOVE', [newPosition.x, newPosition.y, newPosition.z]);
  };

  const handleZModeToggle = () => {
    setZMode(zMode === 'auto' ? 'manual' : 'auto');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header
        title={currentMode === 'curator' ? title : 'Debug Mode'}
        artist={currentMode === 'curator' ? artist : ''}
        onMenuToggle={handleMenuToggle}
        emergencyStop={systemStatus.eStop}
        onEmergencyStop={handleEmergencyStop}
        connected={connected}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentMode={currentMode}
        onModeChange={handleModeChange}
        systemStatus={systemStatus}
        onOpenMetadataDialog={handleOpenMetadataDialog}
        onOpenCameraMenu={handleOpenCameraMenu}
      />

      <Box component="main" sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
        {currentMode === 'curator' ? (
          <Grid container spacing={2} sx={{ height: 'calc(100vh - 120px)' }}>
            {/* Top row */}
            <Grid item xs={12} md={6} sx={{ height: '50%' }}>
              <CameraPreview
                fullscreen={cameraFullscreen}
                onFullscreenToggle={() =>
                  setCameraFullscreen(!cameraFullscreen)
                }
              />
            </Grid>

            <Grid item xs={12} md={6} sx={{ height: '50%' }}>
              <ControlPanel title="Map Preview">
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    color: 'text.secondary',
                  }}
                >
                  Map Preview Content
                </Box>
              </ControlPanel>
            </Grid>

            {/* Bottom row */}
            <Grid item xs={12} md={6} sx={{ height: '50%' }}>
              <ControlPanel title="Motion Controls">
                <MotionControls
                  onMove={handleMove}
                  zMode={zMode}
                  onZModeToggle={handleZModeToggle}
                  isMoving={systemStatus.clearCoreStatus === 'MOVING'}
                  disableZButtons={zMode === 'auto'}
                />
              </ControlPanel>
            </Grid>

            <Grid item xs={12} md={6} sx={{ height: '50%' }}>
              <StatusDisplay
                position={position}
                clearCoreStatus={systemStatus.clearCoreStatus}
                rangefinderActive={systemStatus.rangefinderActive}
                eStop={systemStatus.eStop}
                servoStatus={systemStatus.servoStatus}
              />
            </Grid>
          </Grid>
        ) : (
          <DebugMode
            position={position}
            clearCoreStatus={systemStatus.clearCoreStatus}
            rangefinderActive={systemStatus.rangefinderActive}
            eStop={systemStatus.eStop}
            servoStatus={systemStatus.servoStatus}
          />
        )}
      </Box>
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WebSocketProvider>
        <AppContent />
      </WebSocketProvider>
    </ThemeProvider>
  );
};

export default App;
