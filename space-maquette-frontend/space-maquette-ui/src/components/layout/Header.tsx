// src/components/layout/Header.tsx
import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import { Menu as MenuIcon, Warning as WarningIcon, Wifi as WifiIcon, WifiOff as WifiOffIcon } from '@mui/icons-material';

interface HeaderProps {
  title: string;
  artist?: string;
  onMenuToggle: () => void;
  emergencyStop: boolean;
  onEmergencyStop: () => void;
  connected?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  artist,
  onMenuToggle,
  emergencyStop,
  onEmergencyStop,
  connected = true
}) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          {artist && (
            <Typography variant="body2" component="div">
              {artist}
            </Typography>
          )}
        </Box>
        
        {/* Connection status indicator */}
        <IconButton color="inherit" sx={{ mr: 1 }}>
          {connected ? (
            <WifiIcon sx={{ color: '#4caf50' }} />
          ) : (
            <WifiOffIcon sx={{ color: '#f44336' }} />
          )}
        </IconButton>
        
        {/* E-Stop indicator */}
        <IconButton
          color="inherit"
          onClick={onEmergencyStop}
          sx={{
            bgcolor: emergencyStop ? 'error.main' : 'transparent',
            '&:hover': {
              bgcolor: emergencyStop ? 'error.dark' : 'rgba(255, 255, 255, 0.08)'
            }
          }}
        >
          <WarningIcon sx={{ color: 'inherit' }} />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;