// src/components/shared/CameraSelectDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CircularProgress,
} from '@mui/material';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface Camera {
  id: number;
  name: string;
  url: string;
}

interface CameraSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (camera: Camera) => void;
}

const CameraSelectDialog: React.FC<CameraSelectDialogProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  const { socket, connected } = useWebSocket();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && connected && socket) {
      setLoading(true);
      socket.emit('getCameras', (availableCameras: Camera[]) => {
        setCameras(availableCameras);
        setLoading(false);
      });
    }
  }, [open, connected, socket]);

  const handleSelectCamera = (camera: Camera) => {
    onSelect(camera);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Camera</DialogTitle>
      <DialogContent>
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '2rem',
            }}
          >
            <CircularProgress />
          </div>
        ) : cameras.length === 0 ? (
          <div style={{ padding: '1rem' }}>
            No cameras detected. Please check your connections and try again.
          </div>
        ) : (
          <List>
            {cameras.map((camera) => (
              <ListItem key={camera.id} disablePadding>
                <ListItemButton onClick={() => handleSelectCamera(camera)}>
                  <ListItemText primary={camera.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CameraSelectDialog;
