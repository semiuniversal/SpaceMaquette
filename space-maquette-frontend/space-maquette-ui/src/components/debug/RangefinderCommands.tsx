import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid,
  TextField
} from '@mui/material';

interface RangefinderCommandsProps {
  onSendCommand: (command: string, params?: any[]) => Promise<any>;
  connected: boolean;
}

const RangefinderCommands: React.FC<RangefinderCommandsProps> = ({
  onSendCommand,
  connected
}) => {
  const [scanRegion, setScanRegion] = useState({
    x1: 0,
    y1: 0,
    x2: 100,
    y2: 100,
    step: 1
  });
  
  const handleMeasure = async () => {
    await onSendCommand('MEASURE');
  };
  
  const handleScan = async () => {
    const { x1, y1, x2, y2, step } = scanRegion;
    await onSendCommand('SCAN', [x1, y1, x2, y2, step]);
  };
  
  const handleScanRegionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setScanRegion(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Rangefinder Commands
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={handleMeasure}
          disabled={!connected}
          fullWidth
        >
          MEASURE
        </Button>
      </Box>
      
      <Box>
        <Typography variant="body2" gutterBottom>
          Scan Region:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={2.4}>
            <TextField
              label="X1"
              name="x1"
              type="number"
              value={scanRegion.x1}
              onChange={handleScanRegionChange}
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
              label="Y1"
              name="y1"
              type="number"
              value={scanRegion.y1}
              onChange={handleScanRegionChange}
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
              label="X2"
              name="x2"
              type="number"
              value={scanRegion.x2}
              onChange={handleScanRegionChange}
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
              label="Y2"
              name="y2"
              type="number"
              value={scanRegion.y2}
              onChange={handleScanRegionChange}
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
              label="Step"
              name="step"
              type="number"
              value={scanRegion.step}
              onChange={handleScanRegionChange}
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{
                inputProps: { 
                  step: 0.1,
                  min: 0.1,
                  max: 10
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
              onClick={handleScan}
              disabled={!connected}
            >
              START SCAN
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default RangefinderCommands;