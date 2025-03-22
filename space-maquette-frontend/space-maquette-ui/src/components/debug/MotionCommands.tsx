import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid,
  TextField,
  Divider
} from '@mui/material';

interface MotionCommandsProps {
  onSendCommand: (command: string, params?: any[]) => Promise<any>;
  connected: boolean;
}

const MotionCommands: React.FC<MotionCommandsProps> = ({
  onSendCommand,
  connected
}) => {
  const [position, setPosition] = useState({
    x: 125.00,
    y: 125.00,
    z: 55.00,
    pan: 180.00,
    tilt: 90.00
  });
  
  const [velocity, setVelocity] = useState({
    x: 300,
    y: 300,
    z: 150
  });
  
  const handleHomeAxis = async (axis: 'ALL' | 'X' | 'Y' | 'Z') => {
    await onSendCommand('HOME', [axis]);
  };
  
  const handleMove = async () => {
    const { x, y, z, pan, tilt } = position;
    await onSendCommand('MOVE', [x, y, z, pan, tilt]);
  };
  
  const handleStop = async () => {
    await onSendCommand('STOP');
  };
  
  const handleSetVelocity = async () => {
    const { x, y, z } = velocity;
    await onSendCommand('VELOCITY', [x, y, z]);
  };
  
  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPosition(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };
  
  const handleVelocityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVelocity(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Motion Commands
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Home Axis:
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={3}>
            <Button 
              variant="outlined" 
              color="primary"
              fullWidth
              onClick={() => handleHomeAxis('ALL')}
              disabled={!connected}
            >
              ALL
            </Button>
          </Grid>
          <Grid item xs={3}>
            <Button 
              variant="outlined" 
              color="primary"
              fullWidth
              onClick={() => handleHomeAxis('X')}
              disabled={!connected}
            >
              X
            </Button>
          </Grid>
          <Grid item xs={3}>
            <Button 
              variant="outlined" 
              color="primary"
              fullWidth
              onClick={() => handleHomeAxis('Y')}
              disabled={!connected}
            >
              Y
            </Button>
          </Grid>
          <Grid item xs={3}>
            <Button 
              variant="outlined" 
              color="primary"
              fullWidth
              onClick={() => handleHomeAxis('Z')}
              disabled={!connected}
            >
              Z
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Move to Position:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={2.4}>
            <TextField
              label="X"
              name="x"
              type="number"
              value={position.x}
              onChange={handlePositionChange}
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{
                inputProps: { 
                  step: 1,
                  min: 0,
                  max: 300
                },
                onKeyDown: (e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={2.4}>
            <TextField
              label="Y"
              name="y"
              type="number"
              value={position.y}
              onChange={handlePositionChange}
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{
                inputProps: { 
                  step: 1,
                  min: 0,
                  max: 300
                },
                onKeyDown: (e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={2.4}>
            <TextField
              label="Z"
              name="z"
              type="number"
              value={position.z}
              onChange={handlePositionChange}
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{
                inputProps: { 
                  step: 1,
                  min: 0,
                  max: 150
                },
                onKeyDown: (e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={2.4}>
            <TextField
              label="Pan"
              name="pan"
              type="number"
              value={position.pan}
              onChange={handlePositionChange}
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{
                inputProps: { 
                  step: 1,
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
          </Grid>
          <Grid item xs={2.4}>
            <TextField
              label="Tilt"
              name="tilt"
              type="number"
              value={position.tilt}
              onChange={handlePositionChange}
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{
                inputProps: { 
                  step: 1,
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
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleMove}
              disabled={!connected}
              sx={{ mr: 1 }}
            >
              GO
            </Button>
            <Button 
              variant="outlined" 
              color="error"
              onClick={handleStop}
              disabled={!connected}
            >
              STOP
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box>
        <Typography variant="body2" gutterBottom>
          Set Velocity:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <TextField
              label="X"
              name="x"
              type="number"
              value={velocity.x}
              onChange={handleVelocityChange}
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{
                inputProps: { 
                  step: 10,
                  min: 10,
                  max: 1000
                },
                onKeyDown: (e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Y"
              name="y"
              type="number"
              value={velocity.y}
              onChange={handleVelocityChange}
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{
                inputProps: { 
                  step: 10,
                  min: 10,
                  max: 1000
                },
                onKeyDown: (e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Z"
              name="z"
              type="number"
              value={velocity.z}
              onChange={handleVelocityChange}
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{
                inputProps: { 
                  step: 10,
                  min: 10,
                  max: 500
                },
                onKeyDown: (e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSetVelocity}
              disabled={!connected}
            >
              SET
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default MotionCommands;