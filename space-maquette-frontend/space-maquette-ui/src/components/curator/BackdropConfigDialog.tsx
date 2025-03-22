import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Grid,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Box,
  TextField
} from '@mui/material';
import { BackdropSettings, BackdropType } from '../../types';

interface BackdropConfigDialogProps {
  open: boolean;
  onClose: () => void;
  settings: BackdropSettings;
  onSave: (settings: BackdropSettings) => void;
}

const BackdropConfigDialog: React.FC<BackdropConfigDialogProps> = ({
  open,
  onClose,
  settings,
  onSave
}) => {
  const [formData, setFormData] = useState<BackdropSettings>(settings);
  const [availableSkyboxes] = useState<string[]>([
    'Space Nebula',
    'Night Sky',
    'Abstract Geometry',
    'Studio White',
    'Studio Black'
  ]);

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      type: event.target.value as BackdropType
    });
  };

  const handleTransparencyChange = (_event: Event, newValue: number | number[]) => {
    setFormData({
      ...formData,
      chromaKeyTransparency: newValue as number
    });
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      solidColor: event.target.value
    });
  };

  const handleSkyboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      skyboxSelection: event.target.value
    });
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Typography variant="h5">Backdrop Configuration</Typography>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Backdrop Type
            </Typography>
            
            <FormControl component="fieldset">
              <RadioGroup
                name="backdropType"
                value={formData.type}
                onChange={handleTypeChange}
              >
                <FormControlLabel 
                  value="natural" 
                  control={<Radio />} 
                  label="Natural Background" 
                />
                <FormControlLabel 
                  value="physical" 
                  control={<Radio />} 
                  label="Physical Covering" 
                />
                <FormControlLabel 
                  value="chroma-key" 
                  control={<Radio />} 
                  label="Chroma Key" 
                />
                <FormControlLabel 
                  value="solid-color" 
                  control={<Radio />} 
                  label="Solid Color" 
                />
                <FormControlLabel 
                  value="3d-skybox" 
                  control={<Radio />} 
                  label="3D Skybox" 
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            {formData.type === 'chroma-key' && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Chroma Key Settings
                </Typography>
                <Typography gutterBottom>
                  Transparency: {formData.chromaKeyTransparency}%
                </Typography>
                <Slider
                  value={formData.chromaKeyTransparency}
                  onChange={handleTransparencyChange}
                  aria-labelledby="transparency-slider"
                  valueLabelDisplay="auto"
                  step={1}
                  min={0}
                  max={100}
                />
              </Box>
            )}
            
            {formData.type === 'solid-color' && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Solid Color
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1,
                      border: '1px solid rgba(255, 255, 255, 0.23)',
                      backgroundColor: formData.solidColor
                    }}
                  />
                  <TextField
                    type="color"
                    value={formData.solidColor}
                    onChange={handleColorChange}
                    sx={{ width: 80 }}
                  />
                  <TextField
                    value={formData.solidColor}
                    onChange={handleColorChange}
                    size="small"
                    sx={{ width: 120 }}
                  />
                </Box>
              </Box>
            )}
            
            {formData.type === '3d-skybox' && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  3D Skybox
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <RadioGroup
                    name="skyboxSelection"
                    value={formData.skyboxSelection}
                    onChange={handleSkyboxChange}
                  >
                    {availableSkyboxes.map((skybox) => (
                      <FormControlLabel
                        key={skybox}
                        value={skybox}
                        control={<Radio />}
                        label={skybox}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
                <Button variant="outlined" color="primary">
                  Upload New Skybox
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BackdropConfigDialog;
