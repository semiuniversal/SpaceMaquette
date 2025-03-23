import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, IconButton } from '@mui/material';
import { Fullscreen, FullscreenExit } from '@mui/icons-material';

interface CameraPreviewProps {
  fullscreen: boolean;
  onFullscreenToggle: () => void;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({
  fullscreen,
  onFullscreenToggle,
}) => {
  const [spacePressed, setSpacePressed] = useState(false);

  // Handle spacebar press for fullscreen toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !spacePressed) {
        setSpacePressed(true);
        if (!fullscreen) {
          onFullscreenToggle();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpacePressed(false);
        if (fullscreen) {
          onFullscreenToggle();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [fullscreen, onFullscreenToggle, spacePressed]);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...(fullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          borderRadius: 0,
        }),
      }}
    >
      <Box
        sx={{
          position: 'relative',
          backgroundColor: '#111',
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          Camera preview not available
        </Typography>

        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            color: 'white',
            fontSize: '0.75rem',
            padding: '4px 8px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 1,
          }}
        >
          Press SPACE for fullscreen
        </Box>
      </Box>

      <CardContent sx={{ py: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Camera integration will be added in a future update
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CameraPreview;
