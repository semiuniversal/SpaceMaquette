import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Grid
} from '@mui/material';
import { 
  Pause as PauseIcon,
  PlayArrow as ResumeIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { ScanRegion } from '../../types';

interface ScanProgressDialogProps {
  open: boolean;
  onClose: () => void;
  scanRegion: ScanRegion;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

const ScanProgressDialog: React.FC<ScanProgressDialogProps> = ({
  open,
  onClose,
  scanRegion,
  onPause,
  onResume,
  onCancel
}) => {
  // In a real implementation, these would be updated from the backend
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(scanRegion.estimatedTime);
  
  // Mock progress updates
  React.useEffect(() => {
    if (!open || isPaused) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
      
      setTimeRemaining(prev => {
        if (prev <= 0) return 0;
        return prev - scanRegion.estimatedTime / 100;
      });
    }, scanRegion.estimatedTime * 10); // Speed up for demo
    
    return () => clearInterval(interval);
  }, [open, isPaused, scanRegion.estimatedTime]);
  
  const handlePause = () => {
    setIsPaused(true);
    onPause();
  };
  
  const handleResume = () => {
    setIsPaused(false);
    onResume();
  };
  
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.ceil((seconds % 3600) / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };
  
  // Calculate completed area
  const totalWidth = Math.abs(scanRegion.x2 - scanRegion.x1);
  const totalHeight = Math.abs(scanRegion.y2 - scanRegion.y1);
  const completedWidth = totalWidth * (progress / 100);
  const completedHeight = totalHeight;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        <Typography variant="h5">Scan in Progress</Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Progress:</Typography>
            <Typography variant="body2">{progress}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Time Remaining:
            </Typography>
            <Typography variant="h6">
              {formatTime(timeRemaining)}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Area Completed:
            </Typography>
            <Typography variant="h6">
              {Math.round(completedWidth)} × {Math.round(completedHeight)} cm
            </Typography>
          </Grid>
        </Grid>
        
        <Box 
          sx={{ 
            mt: 3,
            p: 2,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 1,
            bgcolor: 'background.paper',
            position: 'relative',
            height: 200,
            overflow: 'hidden'
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Scan Visualization
          </Typography>
          
          {/* Visual representation of scan progress */}
          <Box 
            sx={{ 
              position: 'absolute',
              left: 16,
              top: 40,
              right: 16,
              bottom: 16,
              border: '1px solid rgba(255, 255, 255, 0.23)',
              bgcolor: 'background.default'
            }}
          >
            {/* Completed area */}
            <Box 
              sx={{ 
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${progress}%`,
                height: '100%',
                bgcolor: 'rgba(25, 118, 210, 0.2)',
                borderRight: '2px solid #1976d2',
                transition: 'width 0.5s ease-in-out'
              }}
            />
            
            {/* Scan head indicator */}
            <Box 
              sx={{ 
                position: 'absolute',
                left: `${progress}%`,
                top: '50%',
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: '#1976d2',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 0 4px rgba(25, 118, 210, 0.3)',
                transition: 'left 0.5s ease-in-out'
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 3 }}>
        <Box>
          {isPaused ? (
            <Button 
              startIcon={<ResumeIcon />}
              onClick={handleResume}
              color="primary"
              variant="contained"
            >
              Resume
            </Button>
          ) : (
            <Button 
              startIcon={<PauseIcon />}
              onClick={handlePause}
              color="primary"
              variant="contained"
            >
              Pause
            </Button>
          )}
        </Box>
        
        <Button 
          startIcon={<CancelIcon />}
          onClick={onCancel}
          color="error"
          variant="outlined"
        >
          Cancel Scan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScanProgressDialog;
