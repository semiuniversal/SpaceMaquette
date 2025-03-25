import React, { useState } from 'react';
import { Grid, Box } from '@mui/material';
import ControlPanel from '../shared/ControlPanel';
import CameraPreview from '../shared/CameraPreview';
import MotionControls from '../shared/MotionControls';
import StatusDisplay from '../shared/StatusDisplay';
import MapPreview from './MapPreview';
import ShowMetadataDialog from './ShowMetadataDialog';
import BackdropConfigDialog from './BackdropConfigDialog';
import ScanRegionDialog from './ScanRegionDialog';
import ScanProgressDialog from './ScanProgressDialog';
import {
  ShowMetadata,
  BackdropSettings,
  NoGoRegion,
  ScanRegion,
  Position,
} from '../../types';

interface CuratorModeProps {
  position: Position;
  clearCoreStatus: string;
  rangefinderActive: boolean;
  eStop: boolean;
  servoStatus: string;
  onMove: (
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
  ) => void;
  zMode: 'auto' | 'manual';
  onZModeToggle: () => void;
  keyboardMode: boolean;
  onKeyboardModeToggle: () => void;
}

const CuratorMode: React.FC<CuratorModeProps> = ({
  position,
  clearCoreStatus,
  rangefinderActive,
  eStop,
  servoStatus,
  onMove,
  zMode,
  onZModeToggle,
  keyboardMode,
  onKeyboardModeToggle,
}) => {
  // State for dialogs
  const [showMetadataDialogOpen, setShowMetadataDialogOpen] = useState(false);
  const [backdropDialogOpen, setBackdropDialogOpen] = useState(false);
  const [scanRegionDialogOpen, setScanRegionDialogOpen] = useState(false);
  const [scanProgressDialogOpen, setScanProgressDialogOpen] = useState(false);

  // State for camera
  const [cameraFullscreen, setCameraFullscreen] = useState(false);

  // Mock data
  const [metadata, setMetadata] = useState<ShowMetadata>({
    title: 'Cosmic Drift',
    artist: 'Jane Doe',
    date: '2025',
    materials: 'Mixed media, electronics',
    dimensions: '200 × 150 × 100 cm',
    description: 'An interactive installation exploring spatial relationships.',
  });

  const [backdropSettings, setBackdropSettings] = useState<BackdropSettings>({
    type: 'natural',
    chromaKeyTransparency: 75,
    solidColor: '#000000',
    skyboxSelection: 'Space Nebula',
  });

  const [noGoRegions, setNoGoRegions] = useState<NoGoRegion[]>([]);

  const [currentScanRegion, setCurrentScanRegion] = useState<ScanRegion>({
    id: 'scan-001',
    x1: 50,
    y1: 50,
    x2: 150,
    y2: 150,
    step: 1,
    estimatedTime: 600,
    status: 'pending',
  });

  // Handlers
  const handleShowMetadataSave = (newMetadata: ShowMetadata) => {
    setMetadata(newMetadata);
    // In a real implementation, this would send the data to the server
  };

  const handleBackdropSettingsSave = (newSettings: BackdropSettings) => {
    setBackdropSettings(newSettings);
    // In a real implementation, this would send the data to the server
  };

  const handleNoGoRegionsChange = (regions: NoGoRegion[]) => {
    setNoGoRegions(regions);
    // In a real implementation, this would send the data to the server
  };

  const handleTakeOverheadImage = () => {
    // In a real implementation, this would send a command to take an overhead image
    console.log('Taking overhead image');
  };

  const handleScanRegion = () => {
    setScanRegionDialogOpen(true);
  };

  const handleStartScan = (region: ScanRegion) => {
    setCurrentScanRegion(region);
    setScanProgressDialogOpen(true);
    // In a real implementation, this would send a command to start scanning
  };

  const handlePauseScan = () => {
    // In a real implementation, this would send a command to pause scanning
    console.log('Pausing scan');
  };

  const handleResumeScan = () => {
    // In a real implementation, this would send a command to resume scanning
    console.log('Resuming scan');
  };

  const handleCancelScan = () => {
    setScanProgressDialogOpen(false);
    // In a real implementation, this would send a command to cancel scanning
    console.log('Canceling scan');
  };

  return (
    <Grid container spacing={2} sx={{ height: 'calc(100vh - 120px)' }}>
      {/* Top row */}
      <Grid item xs={12} md={6} sx={{ height: '50%' }}>
        <CameraPreview
          fullscreen={cameraFullscreen}
          onFullscreenToggle={() => setCameraFullscreen(!cameraFullscreen)}
        />
      </Grid>

      <Grid item xs={12} md={6} sx={{ height: '50%' }}>
        <ControlPanel title="Map Preview">
          <MapPreview
            noGoRegions={noGoRegions}
            onNoGoRegionsChange={handleNoGoRegionsChange}
            onTakeOverheadImage={handleTakeOverheadImage}
            onScanRegion={handleScanRegion}
            currentPosition={position}
          />
        </ControlPanel>
      </Grid>

      {/* Bottom row */}
      <Grid item xs={12} md={6} sx={{ height: '50%' }}>
        <ControlPanel title="Motion Controls">
          <MotionControls
            onMove={onMove}
            zMode={zMode}
            onZModeToggle={onZModeToggle}
          />
        </ControlPanel>
      </Grid>

      <Grid item xs={12} md={6} sx={{ height: '50%' }}>
        <StatusDisplay
          position={position}
          clearCoreStatus={clearCoreStatus}
          rangefinderActive={rangefinderActive}
          eStop={eStop}
          servoStatus={servoStatus}
        />

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Box
              component="button"
              onClick={() => setShowMetadataDialogOpen(true)}
              sx={{
                px: 2,
                py: 1,
                bgcolor: 'primary.main',
                color: 'white',
                border: 'none',
                borderRadius: 1,
                cursor: 'pointer',
                mr: 1,
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              Show Metadata
            </Box>

            <Box
              component="button"
              onClick={() => setBackdropDialogOpen(true)}
              sx={{
                px: 2,
                py: 1,
                bgcolor: 'secondary.main',
                color: 'white',
                border: 'none',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'secondary.dark',
                },
              }}
            >
              Configure Backdrop
            </Box>
          </Box>
        </Box>
      </Grid>

      {/* Dialogs */}
      <ShowMetadataDialog
        open={showMetadataDialogOpen}
        onClose={() => setShowMetadataDialogOpen(false)}
        metadata={metadata}
        onSave={handleShowMetadataSave}
      />

      <BackdropConfigDialog
        open={backdropDialogOpen}
        onClose={() => setBackdropDialogOpen(false)}
        settings={backdropSettings}
        onSave={handleBackdropSettingsSave}
      />

      <ScanRegionDialog
        open={scanRegionDialogOpen}
        onClose={() => setScanRegionDialogOpen(false)}
        onStartScan={handleStartScan}
        mapWidth={300}
        mapHeight={300}
      />

      <ScanProgressDialog
        open={scanProgressDialogOpen}
        onClose={() => setScanProgressDialogOpen(false)}
        scanRegion={currentScanRegion}
        onPause={handlePauseScan}
        onResume={handleResumeScan}
        onCancel={handleCancelScan}
      />
    </Grid>
  );
};

export default CuratorMode;
