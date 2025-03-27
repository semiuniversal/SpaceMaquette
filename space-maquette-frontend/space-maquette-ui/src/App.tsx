// Updated App.tsx file - Refactored version

import React, { useState, useEffect } from 'react';
import { Box, Grid, CssBaseline, ThemeProvider } from '@mui/material';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import ControlPanel from './components/shared/ControlPanel';
import CameraPreview from './components/shared/CameraPreview';
import MotionControls from './components/shared/MotionControls';
import StatusDisplay from './components/shared/StatusDisplay';
import DebugMode from './components/debug/DebugMode';
import ShowsDialog from './components/curator/ShowsDialog';
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
  const [showsDialogOpen, setShowsDialogOpen] = useState(false);

  // Artwork data
  const [workName, setWorkName] = useState('[show name]');
  const [artist, setArtist] = useState('[artist name]');

  // WebSocket context
  const { position, systemStatus, sendCommand, connected } = useWebSocket();

  // Effect to fetch artwork data from the server
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/metadata');
        const data = await response.json();
        console.log('fetchMetadata API response:', data);
        if (data.work_name && data.artist) {
          setWorkName(data.work_name);
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

  const handleOpenShowsDialog = () => {
    setShowsDialogOpen(true);
    setSidebarOpen(false);
  };

  const handleOpenCameraMenu = () => {
    // For now, just toggle fullscreen as a placeholder
    setCameraFullscreen(!cameraFullscreen);
    setSidebarOpen(false);
  };

  const handleZModeToggle = () => {
    setZMode(zMode === 'auto' ? 'manual' : 'auto');
  };
  console.log('Current state values:', { workName, artist });
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header
        title={workName || '[show name]'} // Fallback if workName is empty
        artist={artist || '[artist name]'}
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
        onOpenMetadataDialog={handleOpenShowsDialog}
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

      {/* Shows Dialog */}
      <ShowsDialog
        open={showsDialogOpen}
        onClose={() => setShowsDialogOpen(false)}
      />
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
