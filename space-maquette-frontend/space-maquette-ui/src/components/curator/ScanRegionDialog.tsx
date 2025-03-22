import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Grid,
  Typography,
  Box,
  TextField,
  Paper,
  LinearProgress
} from '@mui/material';
import { ScanRegion } from '../../types';

interface ScanRegionDialogProps {
  open: boolean;
  onClose: () => void;
  onStartScan: (region: ScanRegion) => void;
  mapWidth: number;
  mapHeight: number;
}

const ScanRegionDialog: React.FC<ScanRegionDialogProps> = ({
  open,
  onClose,
  onStartScan,
  mapWidth,
  mapHeight
}) => {
  const [region, setRegion] = useState<ScanRegion>({
    id: `scan-${Date.now()}`,
    x1: Math.floor(mapWidth * 0.25),
    y1: Math.floor(mapHeight * 0.25),
    x2: Math.floor(mapWidth * 0.75),
    y2: Math.floor(mapHeight * 0.75),
    step: 1,
    estimatedTime: 0,
    status: 'pending'
  });
  
  // Calculate estimated time based on region size and step
  React.useEffect(() => {
    const width = Math.abs(region.x2 - region.x1);
    const height = Math.abs(region.y2 - region.y1);
    const points = Math.ceil(width / region.step) * Math.ceil(height / region.step);
    
    // Assume 1 second per point as a rough estimate
    const estimatedSeconds = points;
    
    setRegion(prev => ({
      ...prev,
      estimatedTime: estimatedSeconds
    }));
  }, [region.x1, region.y1, region.x2, region.y2, region.step]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegion(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };
  
  const handleStartScan = () => {
    onStartScan(region);
    onClose();
  };
  
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Typography variant="h5">Select Scan Region</Typography>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Region Coordinates
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    name="x1"
                    label="X1"
                    type="number"
                    value={region.x1}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    InputProps={{ inputProps: { min: 0, max: mapWidth } }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    name="y1"
                    label="Y1"
                    type="number"
                    value={region.y1}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    InputProps={{ inputProps: { min: 0, max: mapHeight } }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    name="x2"
                    label="X2"
                    type="number"
                    value={region.x2}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    InputProps={{ inputProps: { min: 0, max: mapWidth } }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    name="y2"
                    label="Y2"
                    type="number"
                    value={region.y2}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    InputProps={{ inputProps: { min: 0, max: mapHeight } }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    name="step"
                    label="Step Size (cm)"
                    type="number"
                    value={region.step}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    InputProps={{ inputProps: { min: 0.1, max: 10, step: 0.1 } }}
                    helperText="Smaller step size increases resolution but takes longer"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Scan Information
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Selected Area:
                </Typography>
                <Typography variant="h6">
                  {Math.abs(region.x2 - region.x1)} × {Math.abs(region.y2 - region.y1)} cm
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Scan Points:
                </Typography>
                <Typography variant="h6">
                  {Math.ceil(Math.abs(region.x2 - region.x1) / region.step) * 
                   Math.ceil(Math.abs(region.y2 - region.y1) / region.step)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" gutterBottom>
                  Estimated Scan Time:
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {formatTime(region.estimatedTime)}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Hold Shift to add multiple regions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hold - to remove regions
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Preview
              </Typography>
              
              <Box 
                sx={{ 
                  width: '100%', 
                  height: 200, 
                  bgcolor: 'background.default',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Simple visual representation of the scan region */}
                <Box 
                  sx={{ 
                    position: 'absolute',
                    left: `${(region.x1 / mapWidth) * 100}%`,
                    top: `${(region.y1 / mapHeight) * 100}%`,
                    width: `${(Math.abs(region.x2 - region.x1) / mapWidth) * 100}%`,
                    height: `${(Math.abs(region.y2 - region.y1) / mapHeight) * 100}%`,
                    bgcolor: 'rgba(25, 118, 210, 0.3)',
                    border: '2px solid #1976d2'
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleStartScan} color="primary" variant="contained">
          Start Scan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScanRegionDialog;
