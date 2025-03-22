import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid,
  TextField
} from '@mui/material';

interface ServoCommandsProps {
  onSendCommand: (command: string, params?: any[]) => Promise<any>;
  connected: boolean;
}

const ServoCommands: React.FC<ServoCommandsProps> = ({
  onSendCommand,
  connected
}) => {
  const [tiltAngle, setTiltAngle] = useState(90);
  const [panAngle, setPanAngle] = useState(180);
  
  const handleTiltSet = async () => {
    await onSendCommand('TILT', [tiltAngle]);
  };
  
  const handlePanSet = async () => {
    await onSendCommand('PAN', [panAngle]);
  };
  
  const handleTiltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTiltAngle(parseFloat(e.target.value));
  };
  
  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPanAngle(parseFloat(e.target.value));
  };
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Servo Commands
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="body2" gutterBottom>
            Tilt Angle:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              type="number"
              value={tiltAngle}
              onChange={handleTiltChange}
              variant="outlined"
              size="small"
              fullWidth
              sx={{ mr: 1 }}
              InputProps={{
                inputProps: { 
                  step: 0.1,
                  min: 45,
                  max: 135
                },
                onKeyDown: (e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                }
              }}
            />
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleTiltSet}
              disabled={!connected}
            >
              SET
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="body2" gutterBottom>
            Pan Angle:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              type="number"
              value={panAngle}
              onChange={handlePanChange}
              variant="outlined"
              size="small"
              fullWidth
              sx={{ mr: 1 }}
              InputProps={{
                inputProps: { 
                  step: 0.1,
                  min: 0,
                  max: 360
                },
                onKeyDown: (e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                }
              }}
            />
            <Button 
              variant="contained" 
              color="primary"
              onClick={handlePanSet}
              disabled={!connected}
            >
              SET
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ServoCommands;