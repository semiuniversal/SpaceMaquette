import React, { useState, useEffect } from 'react';
import { Grid, Box } from '@mui/material';
import ControlPanel from '../shared/ControlPanel';
import CameraPreview from '../shared/CameraPreview';
import StatusDisplay from '../shared/StatusDisplay';
import TerminalOutput from './TerminalOutput';
import SystemCommands from './SystemCommands';
import MotionCommands from './MotionCommands';
import RangefinderCommands from './RangefinderCommands';
import ServoCommands from './ServoCommands';
import ConfigCommands from './ConfigCommands';
import { Position, ConfigKey } from '../../types';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface DebugModeProps {
  position: Position;
  clearCoreStatus: string;
  rangefinderActive: boolean;
  eStop: boolean;
  servoStatus: string;
}

const DebugMode: React.FC<DebugModeProps> = ({
  position,
  clearCoreStatus,
  rangefinderActive,
  eStop,
  servoStatus
}) => {
  // State for camera
  const [cameraFullscreen, setCameraFullscreen] = useState(false);
  
  // WebSocket context
  const { sendCommand, connected, terminalOutput } = useWebSocket();
  
  // State for debug mode
  const [debugMode, setDebugMode] = useState(false);
  
  // Format terminal output for display
  const formattedHistory = terminalOutput.map(entry => ({
    type: entry.startsWith('>') ? 'command' as const : 'response' as const,
    content: entry.substring(entry.indexOf(']') + 2),
    timestamp: entry.substring(1, entry.indexOf(']'))
  }));
  
  // Mock config keys
  const [configKeys] = useState<ConfigKey[]>([
    { key: 'system_name', value: 'Space Maquette', type: 'string', category: 'system' },
    { key: 'firmware_version', value: '1.0.0', type: 'string', category: 'system' },
    { key: 'serial_number', value: 'SM-2025-001', type: 'string', category: 'system' },
    { key: 'velocity_x', value: '300', type: 'number', category: 'motion' },
    { key: 'velocity_y', value: '300', type: 'number', category: 'motion' },
    { key: 'velocity_z', value: '150', type: 'number', category: 'motion' },
    { key: 'acceleration', value: '1000', type: 'number', category: 'motion' },
    { key: 'max_jerk', value: '5000', type: 'number', category: 'motion' },
    { key: 'rangefinder_offset', value: '10.5', type: 'number', category: 'rangefinder' },
    { key: 'min_distance', value: '10', type: 'number', category: 'rangefinder' },
    { key: 'max_distance', value: '1000', type: 'number', category: 'rangefinder' },
    { key: 'collision_margin', value: '30', type: 'number', category: 'rangefinder' },
    { key: 'tilt_min', value: '45', type: 'number', category: 'servo' },
    { key: 'tilt_max', value: '135', type: 'number', category: 'servo' },
    { key: 'tilt_center', value: '90', type: 'number', category: 'servo' },
    { key: 'tilt_speed', value: '50', type: 'number', category: 'servo' },
    { key: 'home_velocity_x', value: '100', type: 'number', category: 'homing' },
    { key: 'home_velocity_y', value: '100', type: 'number', category: 'homing' },
    { key: 'home_velocity_z', value: '50', type: 'number', category: 'homing' },
    { key: 'home_direction_x', value: '1', type: 'number', category: 'homing' },
    { key: 'home_direction_y', value: '1', type: 'number', category: 'homing' },
    { key: 'home_direction_z', value: '-1', type: 'number', category: 'homing' }
  ]);
  
  // Handlers
  const handleToggleDebug = (enabled: boolean) => {
    setDebugMode(enabled);
  };
  
  const handleToggleEStop = (activated: boolean) => {
    // This will be handled by the WebSocket context
    console.log('E-Stop toggled:', activated);
  };
  
  return (
    <Grid container spacing={2} sx={{ height: 'calc(100vh - 120px)' }}>
      {/* Left column */}
      <Grid item xs={12} md={6} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Camera preview */}
        <Box sx={{ height: '30%', mb: 2 }}>
          <CameraPreview 
            fullscreen={cameraFullscreen}
            onFullscreenToggle={() => setCameraFullscreen(!cameraFullscreen)}
          />
        </Box>
        
        {/* Status display */}
        <Box sx={{ height: '30%', mb: 2 }}>
          <StatusDisplay 
            position={position}
            clearCoreStatus={clearCoreStatus}
            rangefinderActive={rangefinderActive}
            eStop={eStop}
            servoStatus={servoStatus}
          />
        </Box>
        
        {/* Terminal output */}
        <Box sx={{ flexGrow: 1 }}>
          <ControlPanel title="Terminal Output">
            <TerminalOutput 
              history={formattedHistory}
              onSendCommand={sendCommand}
            />
          </ControlPanel>
        </Box>
      </Grid>
      
      {/* Right column - Commands */}
      <Grid item xs={12} md={6} sx={{ height: '100%', overflowY: 'auto' }}>
        <Box sx={{ p: 1 }}>
          <SystemCommands 
            onSendCommand={sendCommand}
            connected={connected}
            debugMode={debugMode}
            eStop={eStop}
            onToggleDebug={handleToggleDebug}
            onToggleEStop={handleToggleEStop}
          />
          
          <MotionCommands 
            onSendCommand={sendCommand}
            connected={connected}
          />
          
          <RangefinderCommands 
            onSendCommand={sendCommand}
            connected={connected}
          />
          
          <ServoCommands 
            onSendCommand={sendCommand}
            connected={connected}
          />
          
          <ConfigCommands 
            onSendCommand={sendCommand}
            connected={connected}
            configKeys={configKeys}
          />
        </Box>
      </Grid>
    </Grid>
  );
};

export default DebugMode;