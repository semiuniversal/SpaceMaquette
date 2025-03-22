// src/components/debug/SystemCommands.tsx

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';

interface SystemCommandsProps {
  onSendCommand: (command: string, params?: any[]) => Promise<any>;
  connected: boolean;
  debugMode: boolean;
  eStop: boolean;
  onToggleDebug: (enabled: boolean) => void;
  onToggleEStop: (activated: boolean) => void;
}

const SystemCommands: React.FC<SystemCommandsProps> = ({
  onSendCommand,
  connected,
  debugMode,
  eStop,
  onToggleDebug,
  onToggleEStop
}) => {
  
  const handlePing = async () => {
    await onSendCommand('PING');
  };
  
  const handleReset = async () => {
    await onSendCommand('RESET');
  };
  
  const handleStatus = async () => {
    await onSendCommand('STATUS');
  };
  
  const handleDebugToggle = async (_event: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue !== null) {
      const enabled = newValue === 'ON';
      onToggleDebug(enabled);
      await onSendCommand('DEBUG', [newValue]);
    }
  };
  
  const handleEStopToggle = async (_event: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue !== null) {
      const activated = newValue === 'ON';
      onToggleEStop(activated);
      await onSendCommand(activated ? 'ESTOP' : 'RESET_ESTOP');
    }
  };
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        System Commands
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <Button 
            variant="outlined" 
            color="primary"
            fullWidth
            onClick={handlePing}
            disabled={!connected}
          >
            PING
          </Button>
        </Grid>
        
        <Grid item xs={4}>
          <Button 
            variant="outlined" 
            color="primary"
            fullWidth
            onClick={handleReset}
            disabled={!connected}
          >
            RESET
          </Button>
        </Grid>
        
        <Grid item xs={4}>
          <Button 
            variant="outlined" 
            color="primary"
            fullWidth
            onClick={handleStatus}
            disabled={!connected}
          >
            STATUS
          </Button>
        </Grid>
      </Grid>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body2" gutterBottom>
            Debug Mode:
          </Typography>
          <ToggleButtonGroup
            value={debugMode ? 'ON' : 'OFF'}
            exclusive
            onChange={handleDebugToggle}
            aria-label="debug mode"
            size="small"
            fullWidth
            disabled={!connected}
          >
            <ToggleButton value="ON" aria-label="debug on">
              ON
            </ToggleButton>
            <ToggleButton value="OFF" aria-label="debug off">
              OFF
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" gutterBottom>
            Soft Emergency Stop:
          </Typography>
          <ToggleButtonGroup
            value={eStop ? 'ON' : 'OFF'}
            exclusive
            onChange={handleEStopToggle}
            aria-label="emergency stop"
            size="small"
            fullWidth
            disabled={!connected}
          >
            <ToggleButton 
              value="ON" 
              aria-label="estop on"
              sx={{ 
                bgcolor: eStop ? 'error.main' : undefined,
                color: eStop ? 'white' : undefined,
                '&.Mui-selected': {
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'error.dark',
                  }
                }
              }}
            >
              ACTIVATED
            </ToggleButton>
            <ToggleButton value="OFF" aria-label="estop off">
              CLEAR
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SystemCommands;