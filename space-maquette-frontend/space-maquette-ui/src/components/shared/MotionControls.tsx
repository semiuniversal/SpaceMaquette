// src/components/shared/MotionControls.tsx
import React from 'react';
import { Box, Grid, Typography, Button } from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  Stop,
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface MotionControlsProps {
  zMode: 'auto' | 'manual';
  onZModeToggle: () => void;
  isMoving?: boolean;
  disableZButtons?: boolean;
}

const MotionControls: React.FC<MotionControlsProps> = ({
  zMode,
  onZModeToggle,
  isMoving = false,
  disableZButtons = false,
}) => {
  const { socket, position } = useWebSocket();

  const handleMove = (
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
  ) => {
    if (!socket) return;

    console.log(`Sending button movement: ${direction}`);

    if (direction === 'stop') {
      socket.emit('button_movement', { direction: 'stop' });
      return;
    }

    socket.emit('button_movement', { direction });
  };
  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="subtitle2" gutterBottom>
        XY Controls{' '}
        {isMoving && <span style={{ color: '#f44336' }}>(Moving...)</span>}
      </Typography>

      <Grid container spacing={1} justifyContent="center" sx={{ mb: 2 }}>
        <Grid item xs={4} />
        <Grid item xs={4} sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleMove('y+')}
            startIcon={<ArrowUpward />}
            fullWidth
          >
            Y+
          </Button>
        </Grid>
        <Grid item xs={4} />

        <Grid item xs={4} sx={{ textAlign: 'right' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleMove('x-')}
            startIcon={<ArrowBack />}
            fullWidth
          >
            X-
          </Button>
        </Grid>
        <Grid item xs={4} sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleMove('stop')}
            startIcon={<Stop />}
            fullWidth
          >
            Stop
          </Button>
        </Grid>
        <Grid item xs={4} sx={{ textAlign: 'left' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleMove('x+')}
            startIcon={<ArrowForward />}
            fullWidth
          >
            X+
          </Button>
        </Grid>

        <Grid item xs={4} />
        <Grid item xs={4} sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleMove('y-')}
            startIcon={<ArrowDownward />}
            fullWidth
          >
            Y-
          </Button>
        </Grid>
        <Grid item xs={4} />
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Typography variant="subtitle2" gutterBottom>
            Z Control ({zMode})
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleMove('z+')}
                startIcon={<ArrowUpward />}
                fullWidth
                disabled={disableZButtons}
              >
                Z+
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleMove('z-')}
                startIcon={<ArrowDownward />}
                fullWidth
                disabled={disableZButtons}
              >
                Z-
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant={zMode === 'auto' ? 'contained' : 'outlined'}
                color="secondary"
                onClick={onZModeToggle}
                fullWidth
              >
                {zMode === 'auto' ? 'Auto Z' : 'Manual Z'}
              </Button>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={6}>
          <Typography variant="subtitle2" gutterBottom>
            Pan/Tilt
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleMove('pan-')}
                startIcon={<ArrowBack />}
                fullWidth
              >
                Pan-
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleMove('pan+')}
                startIcon={<ArrowForward />}
                fullWidth
              >
                Pan+
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleMove('tilt+')}
                startIcon={<ArrowUpward />}
                fullWidth
              >
                Tilt+
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleMove('tilt-')}
                startIcon={<ArrowDownward />}
                fullWidth
              >
                Tilt-
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 1, textAlign: 'center' }}
      >
        Press and hold spacebar for keyboard/mouse control mode
      </Typography>
    </Box>
  );
};

export default MotionControls;
