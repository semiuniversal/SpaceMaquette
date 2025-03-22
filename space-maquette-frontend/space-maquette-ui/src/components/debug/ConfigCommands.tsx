import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider
} from '@mui/material';

interface ConfigCommandsProps {
  onSendCommand: (command: string, params?: any[]) => Promise<any>;
  connected: boolean;
  configKeys: Array<{
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean';
    category: string;
  }>;
}

const ConfigCommands: React.FC<ConfigCommandsProps> = ({
  onSendCommand,
  connected,
  configKeys
}) => {
  const [selectedKey, setSelectedKey] = useState('');
  const [configValue, setConfigValue] = useState('');
  const [valueError, setValueError] = useState('');
  
  const handleKeyChange = (event: SelectChangeEvent) => {
    setSelectedKey(event.target.value);
    setValueError('');
    
    // Find the current value for this key
    const keyConfig = configKeys.find(item => item.key === event.target.value);
    if (keyConfig) {
      setConfigValue(keyConfig.value.toString());
    } else {
      setConfigValue('');
    }
  };
  
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfigValue(e.target.value);
    validateValue(e.target.value);
  };
  
  const validateValue = (value: string) => {
    const keyConfig = configKeys.find(item => item.key === selectedKey);
    if (!keyConfig) return;
    
    if (keyConfig.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        setValueError('Must be a number');
      } else {
        setValueError('');
      }
    } else if (keyConfig.type === 'boolean') {
      if (value !== 'true' && value !== 'false' && value !== '0' && value !== '1') {
        setValueError('Must be true/false or 0/1');
      } else {
        setValueError('');
      }
    } else {
      setValueError('');
    }
  };
  
  const handleConfigLoad = async () => {
    await onSendCommand('CONFIG LOAD');
  };
  
  const handleConfigSave = async () => {
    await onSendCommand('CONFIG SAVE');
  };
  
  const handleConfigList = async () => {
    await onSendCommand('CONFIG LIST');
  };
  
  const handleGetConfig = async () => {
    if (selectedKey) {
      await onSendCommand('GET', [selectedKey]);
    }
  };
  
  const handleSetConfig = async () => {
    if (selectedKey && configValue && !valueError) {
      await onSendCommand('SET', [selectedKey, configValue]);
    }
  };
  
  const handleSave = async () => {
    await onSendCommand('SAVE');
  };
  
  // Group config keys by category
  const groupedKeys: Record<string, typeof configKeys> = {};
  configKeys.forEach(key => {
    if (!groupedKeys[key.category]) {
      groupedKeys[key.category] = [];
    }
    groupedKeys[key.category].push(key);
  });
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Configuration Commands
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Button 
            variant="outlined" 
            color="primary"
            fullWidth
            onClick={handleConfigLoad}
            disabled={!connected}
          >
            CONFIG LOAD
          </Button>
        </Grid>
        
        <Grid item xs={4}>
          <Button 
            variant="outlined" 
            color="primary"
            fullWidth
            onClick={handleConfigSave}
            disabled={!connected}
          >
            CONFIG SAVE
          </Button>
        </Grid>
        
        <Grid item xs={4}>
          <Button 
            variant="outlined" 
            color="primary"
            fullWidth
            onClick={handleConfigList}
            disabled={!connected}
          >
            CONFIG LIST
          </Button>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Get Configuration Value:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <FormControl fullWidth size="small">
              <InputLabel id="get-config-key-label">Select Key</InputLabel>
              <Select
                labelId="get-config-key-label"
                value={selectedKey}
                label="Select Key"
                onChange={handleKeyChange}
                disabled={!connected}
              >
                {Object.entries(groupedKeys).map(([category, keys]) => [
                  <MenuItem 
                    key={`category-${category}`} 
                    value="" 
                    disabled 
                    sx={{ fontWeight: 'bold', opacity: 0.7 }}
                  >
                    {category.toUpperCase()}
                  </MenuItem>,
                  ...keys.map(key => (
                    <MenuItem key={key.key} value={key.key}>
                      {key.key}
                    </MenuItem>
                  ))
                ]).flat()}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleGetConfig}
              disabled={!connected || !selectedKey}
              fullWidth
            >
              GET
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Set Configuration Value:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={5}>
            <FormControl fullWidth size="small">
              <InputLabel id="set-config-key-label">Select Key</InputLabel>
              <Select
                labelId="set-config-key-label"
                value={selectedKey}
                label="Select Key"
                onChange={handleKeyChange}
                disabled={!connected}
              >
                {Object.entries(groupedKeys).map(([category, keys]) => [
                  <MenuItem 
                    key={`category-${category}`} 
                    value="" 
                    disabled 
                    sx={{ fontWeight: 'bold', opacity: 0.7 }}
                  >
                    {category.toUpperCase()}
                  </MenuItem>,
                  ...keys.map(key => (
                    <MenuItem key={key.key} value={key.key}>
                      {key.key}
                    </MenuItem>
                  ))
                ]).flat()}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Value"
              value={configValue}
              onChange={handleValueChange}
              variant="outlined"
              size="small"
              fullWidth
              disabled={!connected || !selectedKey}
              error={!!valueError}
              helperText={valueError}
              inputProps={{
                onKeyDown: (e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={3}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSetConfig}
              disabled={!connected || !selectedKey || !configValue || !!valueError}
              fullWidth
            >
              SET
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <Button 
        variant="contained" 
        color="secondary"
        onClick={handleSave}
        disabled={!connected}
        fullWidth
      >
        SAVE CONFIGURATION
      </Button>
    </Paper>
  );
};

export default ConfigCommands;