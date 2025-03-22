import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton,
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Box, 
  Typography, 
  Chip 
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Videocam as VideocamIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { SystemStatus } from '../../types';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  currentMode: 'curator' | 'debug';
  onModeChange: (mode: 'curator' | 'debug') => void;
  systemStatus: SystemStatus;
  onOpenMetadataDialog: () => void;
  onOpenCameraMenu: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  open, 
  onClose, 
  currentMode, 
  onModeChange,
  systemStatus,
  onOpenMetadataDialog,
  onOpenCameraMenu
}) => {
  const getStatusColor = (status: boolean) => status ? 'success' : 'error';

  return (
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
          
          <ListItemButton>
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
  );
};

export default Sidebar;