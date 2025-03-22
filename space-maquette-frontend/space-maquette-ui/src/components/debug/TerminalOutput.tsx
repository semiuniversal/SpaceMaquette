import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

interface TerminalOutputProps {
  history: Array<{
    type: 'command' | 'response';
    content: string;
    timestamp: string;
  }>;
  onSendCommand: (command: string, params?: any[]) => Promise<any>;
  maxLines?: number;
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({
  history,
  onSendCommand,
  maxLines = 100
}) => {
  const [command, setCommand] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Prevent spacebar from triggering fullscreen when input is focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && document.activeElement === inputRef.current) {
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);
  
  const handleSendCommand = async () => {
    if (command.trim()) {
      await onSendCommand(command);
      setCommand('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendCommand();
    }
  };
  
  // Limit history to maxLines
  const displayHistory = history.slice(-maxLines);
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper 
        ref={terminalRef}
        sx={{ 
          flexGrow: 1, 
          p: 2, 
          bgcolor: 'background.default', 
          height: '300px', // Fixed height
          maxHeight: '300px', // Max height to ensure scrollbar appears
          overflowY: 'auto', // Enables vertical scrollbar
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          mb: 2
        }}
      >
        {displayHistory.map((entry, index) => (
          <Box 
            key={index} 
            sx={{ 
              mb: 1,
              color: entry.type === 'command' ? 'primary.main' : 'text.primary'
            }}
          >
            <Typography 
              component="span" 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                mr: 1
              }}
            >
              {entry.type === 'command' ? '>' : '<'}
            </Typography>
            <Typography 
              component="span" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {entry.content}
            </Typography>
          </Box>
        ))}
        
        {displayHistory.length === 0 && (
          <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No command history. Type a command below to begin.
          </Typography>
        )}
      </Paper>
      
      <Box sx={{ display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Enter command..."
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ mr: 1 }}
          inputRef={inputRef}
          InputProps={{
            onKeyDown: (e) => {
              if (e.key === ' ') {
                e.stopPropagation();
              }
            }
          }}
        />
        <Button 
          variant="contained" 
          color="primary"
          endIcon={<SendIcon />}
          onClick={handleSendCommand}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default TerminalOutput;