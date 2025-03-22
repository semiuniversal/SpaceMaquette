// src/components/shared/CameraPreview.tsx
import React, { useState } from 'react';
import { Box, Paper } from '@mui/material';

interface CameraPreviewProps {
  streamUrl?: string;
  fullscreen: boolean;
  onFullscreenToggle: () => void;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({
  streamUrl = 'https://example.com/stream', // Placeholder URL
  fullscreen,
  onFullscreenToggle
}) => {
  const [spacePressed, setSpacePressed] = useState(false);

  // Handle spacebar press for fullscreen toggle
  React.useEffect(() => {
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
    <Paper 
      elevation={2} 
      sx={{ 
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        ...(fullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          borderRadius: 0,
        })
      }}
    >
      {/* Rest of component remains the same */}
      <Box
        component="div"
        sx={{
          width: '100%',
          height: '100%',
          backgroundColor: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Box
          component="div"
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 25a25 25 0 1 0 0 50 25 25 0 0 0 0-50zm0 45a20 20 0 1 1 0-40 20 20 0 0 1 0 40zm-5-20a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm15 0a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-7.5 10a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z' fill='%23ffffff' fill-opacity='0.1'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            '&::before': {
              content: '"Camera Preview"',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(0,0,0,0.5)',
            }
          }}
        />
        
        <Box
          component="div"
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
    </Paper>
  );
};

export default CameraPreview;