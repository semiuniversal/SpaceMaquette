import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Send as SendIcon, Clear as ClearIcon } from '@mui/icons-material';

interface TerminalOutputProps {
  terminalOutput: string[];
  onSendCommand: (command: string, params?: any[]) => Promise<any>;
  onClearTerminal?: () => void;
  maxLines?: number;
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({
  terminalOutput,
  onSendCommand,
  onClearTerminal,
  maxLines = 1000,
}) => {
  const [command, setCommand] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

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

  const handleClearTerminal = () => {
    if (onClearTerminal) {
      onClearTerminal();
    }
  };

  // Limit history to maxLines
  const displayHistory = terminalOutput.slice(-maxLines);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Terminal History
        </Typography>
        <Tooltip title="Clear Terminal">
          <IconButton
            size="small"
            onClick={handleClearTerminal}
            color="primary"
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper
        ref={terminalRef}
        sx={{
          flexGrow: 1,
          p: 2,
          bgcolor: 'background.default',
          height: '300px',
          maxHeight: '300px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          mb: 2,
        }}
      >
        {displayHistory.map((entry, index) => {
          // Check if the entry contains command marker '>' or response marker '<'
          const isCommand = entry.includes('> ');

          return (
            <Box
              key={index}
              sx={{
                mb: 1,
                color: isCommand ? 'primary.main' : 'text.primary',
              }}
            >
              <Typography
                component="span"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {entry}
              </Typography>
            </Box>
          );
        })}

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
            },
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
