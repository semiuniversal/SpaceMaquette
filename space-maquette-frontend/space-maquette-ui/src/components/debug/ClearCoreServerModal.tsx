import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Box,
  Typography,
  CircularProgress,
  Button,
  Paper
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface ClearCoreServerModalProps {
  open: boolean;
  onClose: () => void;
  clearCoreIp: string | null;
}

const ClearCoreServerModal = ({ open, onClose, clearCoreIp }: { 
  open: boolean; 
  onClose: () => void; 
  clearCoreIp: string | null;
}) => {
  const serverUrl = clearCoreIp ? `http://${clearCoreIp}:8000` : '';
  
  const handleOpenInNewTab = () => {
    if (serverUrl) window.open(serverUrl, '_blank');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">ClearCore File Server</Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {!clearCoreIp ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <Typography mb={2}>Waiting for ClearCore connection...</Typography>
          </Box>
        ) : (
          <Box>
            <Box mb={2} p={2} bgcolor="#f5f5f5" borderRadius={1} display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body1"><strong>ClearCore IP:</strong> {clearCoreIp}</Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Click below to open in a new browser tab for better viewing.
                </Typography>
              </Box>
              <Button variant="contained" color="primary" onClick={handleOpenInNewTab}>
                Open in New Tab
              </Button>
            </Box>
            
            <Box sx={{ height: '500px', overflow: 'hidden', borderRadius: '4px', position: 'relative' }}>
              <Box 
                component="div"
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#fff', 
                  zIndex: 1
                }}
              >
                <iframe 
                  src={serverUrl} 
                  title="ClearCore File Server"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#fff',
                    position: 'relative',
                    zIndex: 2
                  }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
export default ClearCoreServerModal;