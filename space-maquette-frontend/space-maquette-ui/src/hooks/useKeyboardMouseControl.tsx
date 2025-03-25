// src/hooks/useKeyboardMouseControl.tsx
import { useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

interface KeyboardMouseControlProps {
  enabled: boolean;
  onFullscreen: () => void;
}

interface KeyState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  space: boolean;
}

export const useKeyboardMouseControl = ({
  enabled,
  onFullscreen,
}: KeyboardMouseControlProps) => {
  const { socket } = useWebSocket();
  const [keyState, setKeyState] = useState<KeyState>({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
  });

  const lastTime = useRef<number | null>(null);
  const mouseLocked = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Control states
  const isFullscreen = useRef<boolean>(false);

  // Handle key presses
  useEffect(() => {
    if (!enabled || !socket) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabled) return;

      // Prevent default behavior for control keys
      if (['w', 'a', 's', 'd', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      // Update key state
      setKeyState((prev) => {
        const newState = { ...prev };

        switch (e.key.toLowerCase()) {
          case 'w':
            newState.w = true;
            break;
          case 'a':
            newState.a = true;
            break;
          case 's':
            newState.s = true;
            break;
          case 'd':
            newState.d = true;
            break;
          case ' ':
            newState.space = true;
            if (!prev.space) {
              isFullscreen.current = true;
              onFullscreen();
            }
            break;
        }

        return newState;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!enabled) return;

      setKeyState((prev) => {
        const newState = { ...prev };

        switch (e.key.toLowerCase()) {
          case 'w':
            newState.w = false;
            break;
          case 'a':
            newState.a = false;
            break;
          case 's':
            newState.s = false;
            break;
          case 'd':
            newState.d = false;
            break;
          case ' ':
            newState.space = false;
            if (prev.space) {
              isFullscreen.current = false;
              onFullscreen(); // Toggle fullscreen off
            }
            break;
        }

        return newState;
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);

      // Exit pointer lock when disabling controls
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    };
  }, [enabled, socket, onFullscreen]);

  // Mouse position tracking for pan/tilt
  useEffect(() => {
    if (!enabled || !socket) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!enabled || !mouseLocked.current) return;

      // Calculate mouse movement deltas
      const deltaX = e.movementX;
      const deltaY = e.movementY;

      if (deltaX !== 0 || deltaY !== 0) {
        // Send mouse look data to server
        socket.emit('mouse_look', { deltaX, deltaY });
      }
    };

    // Handle pointer lock change
    const handlePointerLockChange = () => {
      mouseLocked.current =
        document.pointerLockElement === containerRef.current;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener(
        'pointerlockchange',
        handlePointerLockChange
      );
    };
  }, [enabled, socket]);

  // Mouse click to lock/unlock
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const handleClick = () => {
      if (!enabled || !containerRef.current) return;

      // Only request pointer lock when in fullscreen mode
      if (isFullscreen.current && !mouseLocked.current) {
        containerRef.current.requestPointerLock();
      }
    };

    containerRef.current.addEventListener('click', handleClick);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleClick);
      }
    };
  }, [enabled, containerRef.current]);

  // Movement calculation and update loop
  useEffect(() => {
    if (!enabled || !socket) {
      lastTime.current = null;
      return;
    }

    // Use requestAnimationFrame for smooth movement
    const updateMovement = (timestamp: number) => {
      if (!enabled) return;

      // Calculate delta time for frame-rate independent movement
      if (lastTime.current === null) {
        lastTime.current = timestamp;
      }

      const deltaTime = (timestamp - lastTime.current) / 1000; // convert to seconds
      lastTime.current = timestamp;

      // Calculate movement direction
      const forward = (keyState.w ? 1 : 0) - (keyState.s ? 1 : 0);
      const strafe = (keyState.d ? 1 : 0) - (keyState.a ? 1 : 0);

      // Only send movement if there's actual input
      if (forward !== 0 || strafe !== 0) {
        socket.emit('keyboard_movement', { forward, strafe, deltaTime });
      }

      // Continue the animation loop
      frameId = requestAnimationFrame(updateMovement);
    };

    let frameId = requestAnimationFrame(updateMovement);

    return () => {
      // Clean up animation frame
      cancelAnimationFrame(frameId);
    };
  }, [enabled, keyState, socket]);

  return {
    containerRef,
    isMouseLocked: mouseLocked.current,
    isFullscreen: isFullscreen.current,
  };
};
