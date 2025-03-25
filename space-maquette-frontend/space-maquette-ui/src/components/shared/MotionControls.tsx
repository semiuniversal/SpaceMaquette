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

interface MotionControlsProps {
  onMove: (
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
  ) => void;
  zMode: 'auto' | 'manual';
  onZModeToggle: () => void;
  isMoving?: boolean;
  disableZButtons?: boolean;
}

const MotionControls: React.FC<MotionControlsProps> = ({
  onMove,
  zMode,
  onZModeToggle,
  isMoving = false,
  disableZButtons = false,
}) => {
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
            onClick={() => onMove('y+')}
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
            onClick={() => onMove('x-')}
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
            onClick={() => onMove('stop')}
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
            onClick={() => onMove('x+')}
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
            onClick={() => onMove('y-')}
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
                onClick={() => onMove('z+')}
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
                onClick={() => onMove('z-')}
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
                onClick={() => onMove('pan-')}
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
                onClick={() => onMove('pan+')}
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
                onClick={() => onMove('tilt+')}
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
                onClick={() => onMove('tilt-')}
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
