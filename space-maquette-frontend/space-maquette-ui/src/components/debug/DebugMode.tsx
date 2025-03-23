import React, { useState } from 'react';
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
  servoStatus,
}) => {
  // State for camera
  const [cameraFullscreen, setCameraFullscreen] = useState(false);

  // WebSocket context - make sure to include clearTerminal
  const { sendCommand, connected, terminalOutput, clearTerminal } =
    useWebSocket();

  // State for debug mode
  const [debugMode, setDebugMode] = useState(false);

  // Config keys remain the same
  const [configKeys] = useState<ConfigKey[]>([
    // System
    {
      key: 'system_name',
      value: 'Space Maquette',
      type: 'string',
      category: 'system',
    },
    {
      key: 'firmware_version',
      value: '1.0.0',
      type: 'string',
      category: 'system',
    },
    {
      key: 'serial_number',
      value: 'SM-2025-001',
      type: 'string',
      category: 'system',
    },
    { key: 'debug', value: '0', type: 'number', category: 'system' },
    { key: 'debug_level', value: '0', type: 'number', category: 'system' },
    { key: 'log_commands', value: 'true', type: 'boolean', category: 'system' },
    {
      key: 'log_file',
      value: 'COMMAND.LOG',
      type: 'string',
      category: 'system',
    },

    // Motion
    { key: 'velocity_x', value: '300', type: 'number', category: 'motion' },
    { key: 'velocity_y', value: '300', type: 'number', category: 'motion' },
    { key: 'velocity_z', value: '150', type: 'number', category: 'motion' },
    {
      key: 'acceleration_x',
      value: '1000',
      type: 'number',
      category: 'motion',
    },
    {
      key: 'acceleration_y',
      value: '1000',
      type: 'number',
      category: 'motion',
    },
    { key: 'acceleration_z', value: '500', type: 'number', category: 'motion' },
    { key: 'max_jerk_x', value: '5000', type: 'number', category: 'motion' },
    { key: 'max_jerk_y', value: '5000', type: 'number', category: 'motion' },
    { key: 'max_jerk_z', value: '2500', type: 'number', category: 'motion' },

    // Rangefinder
    {
      key: 'rangefinder_offset_x',
      value: '10.5',
      type: 'number',
      category: 'rangefinder',
    },
    {
      key: 'rangefinder_offset_y',
      value: '10.5',
      type: 'number',
      category: 'rangefinder',
    },
    {
      key: 'min_distance',
      value: '10',
      type: 'number',
      category: 'rangefinder',
    },
    {
      key: 'max_distance',
      value: '1000',
      type: 'number',
      category: 'rangefinder',
    },
    {
      key: 'collision_margin',
      value: '30',
      type: 'number',
      category: 'rangefinder',
    },

    // Servo
    { key: 'tilt_min', value: '45', type: 'number', category: 'servo' },
    { key: 'tilt_max', value: '135', type: 'number', category: 'servo' },
    { key: 'tilt_center', value: '90', type: 'number', category: 'servo' },
    { key: 'tilt_speed', value: '50', type: 'number', category: 'servo' },

    // Homing
    {
      key: 'home_velocity_x',
      value: '100',
      type: 'number',
      category: 'homing',
    },
    {
      key: 'home_velocity_y',
      value: '100',
      type: 'number',
      category: 'homing',
    },
    { key: 'home_velocity_z', value: '50', type: 'number', category: 'homing' },
    { key: 'home_direction_x', value: '1', type: 'number', category: 'homing' },
    { key: 'home_direction_y', value: '1', type: 'number', category: 'homing' },
    {
      key: 'home_direction_z',
      value: '-1',
      type: 'number',
      category: 'homing',
    },

    // Stage limits
    { key: 'stage_min_x', value: '0', type: 'number', category: 'stage' },
    { key: 'stage_min_y', value: '0', type: 'number', category: 'stage' },
    { key: 'stage_min_z', value: '0', type: 'number', category: 'stage' },
    { key: 'stage_max_x', value: '800', type: 'number', category: 'stage' },
    { key: 'stage_max_y', value: '800', type: 'number', category: 'stage' },
    { key: 'stage_max_z', value: '500', type: 'number', category: 'stage' },

    // Network
    {
      key: 'ethernet_port',
      value: '8080',
      type: 'number',
      category: 'network',
    },
    {
      key: 'ethernet_dhcp',
      value: 'false',
      type: 'boolean',
      category: 'network',
    },
    {
      key: 'ethernet_static_ip',
      value: '192.168.1.100',
      type: 'string',
      category: 'network',
    },
    {
      key: 'ethernet_static_netmask',
      value: '255.255.255.0',
      type: 'string',
      category: 'network',
    },
    {
      key: 'ethernet_static_gateway',
      value: '192.168.1.1',
      type: 'string',
      category: 'network',
    },
    {
      key: 'ethernet_timeout',
      value: '5000',
      type: 'number',
      category: 'network',
    },
    {
      key: 'ethernet_heartbeat',
      value: '1000',
      type: 'number',
      category: 'network',
    },
    {
      key: 'ethernet_reconnect',
      value: 'true',
      type: 'boolean',
      category: 'network',
    },
    {
      key: 'ethernet_logging',
      value: 'true',
      type: 'boolean',
      category: 'network',
    },
    {
      key: 'ethernet_log_file',
      value: 'ETHERNET.LOG',
      type: 'string',
      category: 'network',
    },
    {
      key: 'ethernet_log_level',
      value: '1',
      type: 'number',
      category: 'network',
    },
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
      <Grid
        item
        xs={12}
        md={6}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
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

        {/* Terminal output - Updated to use correct props */}
        <Box sx={{ flexGrow: 1 }}>
          <ControlPanel title="Terminal Output">
            <TerminalOutput
              terminalOutput={terminalOutput}
              onSendCommand={sendCommand}
              onClearTerminal={clearTerminal}
              maxLines={1000}
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

          <MotionCommands onSendCommand={sendCommand} connected={connected} />

          <RangefinderCommands
            onSendCommand={sendCommand}
            connected={connected}
          />

          <ServoCommands onSendCommand={sendCommand} connected={connected} />

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
