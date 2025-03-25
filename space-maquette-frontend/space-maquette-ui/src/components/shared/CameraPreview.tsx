// src/components/shared/CameraPreview.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface CameraPreviewProps {
  fullscreen: boolean;
  onFullscreenToggle: () => void;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({
  fullscreen,
  onFullscreenToggle,
}) => {
  const { socket, position } = useWebSocket();
  const [spacePressed, setSpacePressed] = useState(false);
  const [mouseLocked, setMouseLocked] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Track key states for WASD
  const [keyStates, setKeyStates] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle WASD keys when in fullscreen
      if (
        fullscreen &&
        ['w', 'a', 's', 'd'].includes(event.key.toLowerCase())
      ) {
        event.preventDefault();
        setKeyStates((prev) => ({
          ...prev,
          [event.key.toLowerCase()]: true,
        }));
      }

      // Handle spacebar toggle
      if (event.code === 'Space' && !spacePressed) {
        event.preventDefault();
        setSpacePressed(true);
        if (!fullscreen) {
          onFullscreenToggle();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Handle WASD keys
      if (['w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
        setKeyStates((prev) => ({
          ...prev,
          [event.key.toLowerCase()]: false,
        }));
      }

      // Handle spacebar toggle
      if (event.code === 'Space') {
        setSpacePressed(false);
        if (fullscreen) {
          onFullscreenToggle();

          // Exit pointer lock when exiting fullscreen
          if (document.pointerLockElement && document.exitPointerLock) {
            document.exitPointerLock();
          }
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

  // Handle pointer lock for mouse control
  useEffect(() => {
    if (!fullscreen) return;

    const handleClick = () => {
      if (previewRef.current && !document.pointerLockElement) {
        previewRef.current.requestPointerLock();
      }
    };

    const handlePointerLockChange = () => {
      setMouseLocked(document.pointerLockElement === previewRef.current);
    };

    // Add click listener to container
    if (previewRef.current) {
      previewRef.current.addEventListener('click', handleClick);
    }

    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      if (previewRef.current) {
        previewRef.current.removeEventListener('click', handleClick);
      }
      document.removeEventListener(
        'pointerlockchange',
        handlePointerLockChange
      );
    };
  }, [fullscreen]);

  // Handle mouse movement for camera control
  useEffect(() => {
    if (!fullscreen || !mouseLocked || !socket) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (e.movementX !== 0 || e.movementY !== 0) {
        console.log('Sending mouse_look:', {
          deltaX: e.movementX,
          deltaY: e.movementY,
        });
        socket.emit('mouse_look', {
          deltaX: e.movementX,
          deltaY: e.movementY,
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [fullscreen, mouseLocked, socket]);

  // Animation loop for WASD movement
  useEffect(() => {
    if (!fullscreen || !socket) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      // Calculate delta time
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = (timestamp - lastTimeRef.current) / 1000; // in seconds
      lastTimeRef.current = timestamp;

      // Calculate movement direction
      const forward = (keyStates.w ? 1 : 0) - (keyStates.s ? 1 : 0);
      const strafe = (keyStates.d ? 1 : 0) - (keyStates.a ? 1 : 0);

      // Only send if there's actual movement
      if (forward !== 0 || strafe !== 0) {
        console.log('Sending keyboard_movement:', {
          forward,
          strafe,
          deltaTime,
        });
        socket.emit('keyboard_movement', {
          forward,
          strafe,
          deltaTime,
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimeRef.current = 0;
    };
  }, [fullscreen, keyStates, socket]);

  return (
    <Card
      ref={previewRef}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: mouseLocked ? 'none' : 'pointer',
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
        <Box sx={{ color: 'white', textAlign: 'center' }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ color: 'white', mb: 1 }}
          >
            Camera Preview
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: '#aaa', display: 'block' }}
          >
            Position: X:{position.x.toFixed(1)}, Y:{position.y.toFixed(1)}, Z:
            {position.z.toFixed(1)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: '#aaa', display: 'block' }}
          >
            Orientation: Pan:{position.pan.toFixed(1)}°, Tilt:
            {position.tilt.toFixed(1)}°
          </Typography>
        </Box>

        {fullscreen && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 30,
              left: 0,
              right: 0,
              color: 'white',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ display: 'block' }}>
              Use WASD to move, mouse to look around
              {mouseLocked ? '' : ' (click to enable mouse control)'}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              Release spacebar to exit fullscreen mode
            </Typography>
          </Box>
        )}

        {!fullscreen && (
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
        )}
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
