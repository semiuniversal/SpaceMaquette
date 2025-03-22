import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { Position } from '../../types';

interface StatusDisplayProps {
  position: Position;
  clearCoreStatus: string;
  rangefinderActive: boolean;
  eStop: boolean;
  servoStatus: string;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({
  position,
  clearCoreStatus,
  rangefinderActive,
  eStop,
  servoStatus
}) => {
  const formatValue = (value: number): string => {
    return value.toFixed(2);
  };

  const getStatusColor = (status: boolean | string): string => {
    if (typeof status === 'boolean') {
      return status ? '#4caf50' : '#f44336';
    }
    
    if (status === 'READY' || status === 'ACTIVE') {
      return '#4caf50';
    } else if (status === 'WARNING') {
      return '#ff9800';
    } else if (status === 'ERROR') {
      return '#f44336';
    }
    
    return '#2196f3';
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        bgcolor: 'background.paper',
        height: '100%'
      }}
    >
      <Typography variant="subtitle1" gutterBottom>
        System Status
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="subtitle2" gutterBottom>
            Position
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Paper 
                  sx={{ 
                    p: 1, 
                    textAlign: 'center',
                    bgcolor: 'background.default'
                  }}
                >
                  <Typography variant="caption" display="block">X</Typography>
                  <Typography variant="body1">{formatValue(position.x)}</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={4}>
                <Paper 
                  sx={{ 
                    p: 1, 
                    textAlign: 'center',
                    bgcolor: 'background.default'
                  }}
                >
                  <Typography variant="caption" display="block">Y</Typography>
                  <Typography variant="body1">{formatValue(position.y)}</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={4}>
                <Paper 
                  sx={{ 
                    p: 1, 
                    textAlign: 'center',
                    bgcolor: 'background.default'
                  }}
                >
                  <Typography variant="caption" display="block">Z</Typography>
                  <Typography variant="body1">{formatValue(position.z)}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          <Box>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Paper 
                  sx={{ 
                    p: 1, 
                    textAlign: 'center',
                    bgcolor: 'background.default'
                  }}
                >
                  <Typography variant="caption" display="block">Pan</Typography>
                  <Typography variant="body1">{formatValue(position.pan)}°</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={6}>
                <Paper 
                  sx={{ 
                    p: 1, 
                    textAlign: 'center',
                    bgcolor: 'background.default'
                  }}
                >
                  <Typography variant="caption" display="block">Tilt</Typography>
                  <Typography variant="body1">{formatValue(position.tilt)}°</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Grid>
        
        <Grid item xs={6}>
          <Typography variant="subtitle2" gutterBottom>
            System
          </Typography>
          
          <Box sx={{ mb: 1 }}>
            <Paper 
              sx={{ 
                p: 1, 
                mb: 1,
                bgcolor: 'background.default',
                borderLeft: 4,
                borderColor: getStatusColor(clearCoreStatus)
              }}
            >
              <Typography variant="caption" display="block">ClearCore</Typography>
              <Typography variant="body2">{clearCoreStatus}</Typography>
            </Paper>
            
            <Paper 
              sx={{ 
                p: 1, 
                mb: 1,
                bgcolor: 'background.default',
                borderLeft: 4,
                borderColor: getStatusColor(rangefinderActive)
              }}
            >
              <Typography variant="caption" display="block">Rangefinder</Typography>
              <Typography variant="body2">{rangefinderActive ? 'Active' : 'Inactive'}</Typography>
            </Paper>
            
            <Paper 
              sx={{ 
                p: 1, 
                mb: 1,
                bgcolor: 'background.default',
                borderLeft: 4,
                borderColor: getStatusColor(!eStop)
              }}
            >
              <Typography variant="caption" display="block">E-Stop</Typography>
              <Typography variant="body2">{eStop ? 'Activated' : 'Inactive'}</Typography>
            </Paper>
            
            <Paper 
              sx={{ 
                p: 1,
                bgcolor: 'background.default',
                borderLeft: 4,
                borderColor: getStatusColor(servoStatus)
              }}
            >
              <Typography variant="caption" display="block">Servo Status</Typography>
              <Typography variant="body2">{servoStatus}</Typography>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default StatusDisplay;
