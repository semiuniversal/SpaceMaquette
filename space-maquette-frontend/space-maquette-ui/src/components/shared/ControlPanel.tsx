import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface ControlPanelProps {
  title: string;
  children: React.ReactNode;
  elevation?: number;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  title, 
  children, 
  elevation = 2 
}) => {
  return (
    <Paper 
      elevation={elevation} 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Box 
        sx={{ 
          p: 1, 
          bgcolor: 'primary.dark', 
          borderBottom: 1, 
          borderColor: 'divider' 
        }}
      >
        <Typography variant="subtitle1" component="h2">
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        {children}
      </Box>
    </Paper>
  );
};

export default ControlPanel;
