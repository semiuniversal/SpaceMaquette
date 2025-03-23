import React, { useState } from 'react';
import { 
  Drawer, 
  List, 
  ListItemButton,
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Box, 
  Typography, 
  Chip, 
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Paper,
  Button
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Videocam as VideocamIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { SystemStatus } from '../../types';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  currentMode: 'curator' | 'debug';
  onModeChange: (mode: 'curator' | 'debug') => void;
  systemStatus: SystemStatus;
  onOpenMetadataDialog: () => void;
  onOpenCameraMenu: () => void;
}

// ClearCore server modal component
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
              </Box>
              <Button variant="contained" color="primary" onClick={handleOpenInNewTab}>
                Open in New Tab
              </Button>
            </Box>
            
            <iframe 
              src={serverUrl} 
              title="ClearCore File Server"
              style={{
                width: '100%',
                height: '500px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
const Sidebar: React.FC<SidebarProps> = ({ 
  open, 
  onClose, 
  currentMode, 
  onModeChange,
  systemStatus,
  onOpenMetadataDialog,
  onOpenCameraMenu
}) => {
  const [clearCoreServerModalOpen, setClearCoreServerModalOpen] = useState(false);
  const { clearCoreIp } = useWebSocket();
  
  const getStatusColor = (status: boolean) => status ? 'success' : 'error';

  return (
    <>
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" component="div">
            Space Maquette
          </Typography>
          <Typography variant="body2" color="text.secondary">
            v1.0.0
          </Typography>
        </Box>
        
        <Divider />
        
        <List>
          <ListItemButton
            selected={currentMode === 'curator'} 
            onClick={() => onModeChange('curator')}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Curator Mode" />
          </ListItemButton>
          
          <ListItemButton
            selected={currentMode === 'debug'} 
            onClick={() => onModeChange('debug')}
          >
            <ListItemIcon>
              <CodeIcon />
            </ListItemIcon>
            <ListItemText primary="Debug Mode" />
          </ListItemButton>
        </List>
        
        <Divider />
        
        {currentMode === 'curator' && (
          <List>
            <ListItemButton onClick={onOpenCameraMenu}>
              <ListItemIcon>
                <VideocamIcon />
              </ListItemIcon>
              <ListItemText primary="Camera" />
            </ListItemButton>
            
            <ListItemButton onClick={onOpenMetadataDialog}>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText primary="Metadata" />
            </ListItemButton>
          </List>
        )}
        
        {currentMode === 'debug' && (
          <List>
            <ListItemButton>
              <ListItemIcon>
                <CodeIcon />
              </ListItemIcon>
              <ListItemText primary="ClearCore Commands" />
            </ListItemButton>
            
            <ListItemButton onClick={onOpenCameraMenu}>
              <ListItemIcon>
                <VideocamIcon />
              </ListItemIcon>
              <ListItemText primary="Camera" />
            </ListItemButton>
            
            <ListItemButton 
              onClick={() => {
                if (clearCoreIp) {
                  window.open(`http://${clearCoreIp}:8000`, '_blank');
                } else {
                  // Alert if no IP is available
                  alert('ClearCore IP address not available. Please check connection.');
                }
              }}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="ClearCore Server" />
            </ListItemButton>          
          </List>
          )}
        
        <Box sx={{ position: 'absolute', bottom: 0, width: '100%', p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            System Status
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Chip 
              label={`ClearCore: ${systemStatus.connected ? 'Connected' : 'Disconnected'}`}
              color={getStatusColor(systemStatus.connected)}
              size="small"
            />
            
            <Chip 
              label={`Rangefinder: ${systemStatus.rangefinderActive ? 'Active' : 'Inactive'}`}
              color={getStatusColor(systemStatus.rangefinderActive)}
              size="small"
            />
            
            <Chip 
              label={`E-Stop: ${systemStatus.eStop ? 'Activated' : 'Inactive'}`}
              color={systemStatus.eStop ? 'error' : 'success'}
              size="small"
            />
          </Box>
        </Box>
      </Drawer>
      
      <ClearCoreServerModal 
        open={clearCoreServerModalOpen}
        onClose={() => setClearCoreServerModalOpen(false)}
        clearCoreIp={clearCoreIp}
      />
    </>
  );
};

export default Sidebar;