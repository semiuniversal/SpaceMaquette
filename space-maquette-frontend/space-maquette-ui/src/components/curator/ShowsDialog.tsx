// src/components/curator/ShowsDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface ShowsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Light {
  id: number;
  name: string;
  rgb: string;
}

interface Show {
  id: number;
  work_name: string;
  artist: string;
  created: string;
  materials: string;
  scale: string;
  length: string;
  width: string;
  height: string;
  use_backdrop: boolean;
  backdrop_rgb: string;
  backdrop_model: string;
  pano: boolean;
  lights: Light[];
}

const defaultShow: Show = {
  id: 0,
  work_name: '',
  artist: '',
  created: new Date().getFullYear().toString(),
  materials: '',
  scale: '1:10',
  length: '',
  width: '',
  height: '',
  use_backdrop: true,
  backdrop_rgb: '#00ff00',
  backdrop_model: '',
  pano: false,
  lights: [],
};

const ShowsDialog: React.FC<ShowsDialogProps> = ({ open, onClose }) => {
  const { socket } = useWebSocket();
  const [tabIndex, setTabIndex] = useState(0);
  const [shows, setShows] = useState<Show[]>([]);
  const [currentShow, setCurrentShow] = useState<Show>(defaultShow);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [lights, setLights] = useState<Light[]>([]);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (open) {
      fetchShows();
      fetchLights();
    }
  }, [open]);

  const fetchShows = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/shows');
      const data = await response.json();
      setShows(data);
      if (data.length > 0) {
        await fetchShowDetails(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching shows:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShowDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/shows/${id}`);
      const showData = await response.json();

      const lightsResponse = await fetch(`/api/shows/${id}/lights`);
      const lightsData = await lightsResponse.json();

      setCurrentShow({
        ...showData,
        lights: lightsData || [],
      });

      updatePreview(showData);
    } catch (error) {
      console.error(`Error fetching show details for ID ${id}:`, error);
    }
  };

  const fetchLights = async () => {
    try {
      const response = await fetch('/api/lights');
      const data = await response.json();
      setLights(data);
    } catch (error) {
      console.error('Error fetching lights:', error);
    }
  };

  const updatePreview = (show: Show) => {
    if (socket) {
      socket.emit('update_preview', {
        use_backdrop: show.use_backdrop,
        backdrop_rgb: show.backdrop_rgb,
        backdrop_model: show.backdrop_model,
        lights: show.lights,
      });
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    if (name) {
      setCurrentShow({
        ...currentShow,
        [name]: value,
      });
    }
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCurrentShow({
      ...currentShow,
      [name]: checked,
    });
  };

  const handleLightColorChange = (lightId: number, color: string) => {
    const updatedLights = currentShow.lights.map((light) =>
      light.id === lightId ? { ...light, rgb: color } : light
    );

    setCurrentShow({
      ...currentShow,
      lights: updatedLights,
    });

    if (socket) {
      socket.emit('update_light', { id: lightId, rgb: color });
    }
  };

  const handleSaveShow = async () => {
    try {
      setLoading(true);

      const showData = {
        work_name: currentShow.work_name,
        artist: currentShow.artist,
        created: currentShow.created,
        materials: currentShow.materials,
        scale: currentShow.scale,
        length: currentShow.length,
        width: currentShow.width,
        height: currentShow.height,
        use_backdrop: currentShow.use_backdrop,
        backdrop_rgb: currentShow.backdrop_rgb,
        backdrop_model: currentShow.backdrop_model,
        pano: currentShow.pano,
      };

      let response;

      if (isCreating || currentShow.id === 0) {
        response = await fetch('/api/shows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(showData),
        });
      } else {
        response = await fetch(`/api/shows/${currentShow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(showData),
        });
      }

      const savedShow = await response.json();

      await Promise.all(
        currentShow.lights.map((light) =>
          fetch(`/api/shows/${savedShow.id}/lights/${light.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rgb: light.rgb }),
          })
        )
      );

      await fetchShows();
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving show:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setCurrentShow(defaultShow);
    setIsCreating(true);
  };

  const handleSelectShow = (show: Show) => {
    fetchShowDetails(show.id);
    setIsCreating(false);
  };

  const handleDeleteShow = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this show?')) {
      try {
        await fetch(`/api/shows/${id}`, { method: 'DELETE' });
        await fetchShows();
      } catch (error) {
        console.error(`Error deleting show ${id}:`, error);
      }
    }
  };

  // Tab content renderers
  const renderMetadataTab = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">
            {isCreating ? 'Create New Show' : 'Edit Show Metadata'}
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Work Name"
            name="work_name"
            value={currentShow.work_name}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.stopPropagation();
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Artist"
            name="artist"
            value={currentShow.artist}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.stopPropagation();
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Year Created"
            name="created"
            value={currentShow.created}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.stopPropagation();
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Materials"
            name="materials"
            value={currentShow.materials}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.stopPropagation();
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Scale"
            name="scale"
            value={currentShow.scale}
            onChange={handleInputChange}
            placeholder="e.g. 1:10"
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.stopPropagation();
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Length"
            name="length"
            value={currentShow.length}
            onChange={handleInputChange}
            placeholder="e.g. 80 cm"
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.stopPropagation();
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Width"
            name="width"
            value={currentShow.width}
            onChange={handleInputChange}
            placeholder="e.g. 60 cm"
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.stopPropagation();
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Height"
            name="height"
            value={currentShow.height}
            onChange={handleInputChange}
            placeholder="e.g. 25 cm"
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.stopPropagation();
              }
            }}
          />
        </Grid>

        {/* Removed "Enable panoramas" toggle */}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            {!isCreating && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleCreateNew}
                startIcon={<AddIcon />}
              >
                Create New
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveShow}
              disabled={
                !currentShow.work_name ||
                !currentShow.artist ||
                !currentShow.created ||
                !currentShow.materials
              }
            >
              {isCreating ? 'Create Show' : 'Save Changes'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6">Available Shows</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {shows.map((show) => (
            <ListItemButton
              key={show.id}
              selected={currentShow.id === show.id}
              onClick={() => handleSelectShow(show)}
              sx={{ border: '1px solid #eee', mb: 1, borderRadius: 1 }}
            >
              <ListItemText
                primary={show.work_name}
                secondary={`${show.artist}, ${show.created}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteShow(show.id)}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItemButton>
          ))}
          {shows.length === 0 && (
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ py: 2, textAlign: 'center' }}
            >
              No shows available. Create your first show!
            </Typography>
          )}
        </List>
      )}
    </Box>
  );

  const renderBackdropTab = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Typography variant="h6" gutterBottom>
            Backdrop Configuration
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={currentShow.use_backdrop}
                onChange={handleSwitchChange}
                name="use_backdrop"
              />
            }
            label="Use Backdrop Effects"
            sx={{ mb: 2, display: 'block' }}
          />

          <FormControl
            fullWidth
            sx={{ mb: 2 }}
            disabled={!currentShow.use_backdrop}
          >
            <InputLabel>Backdrop Type</InputLabel>
            <Select
              value={currentShow.backdrop_model ? '3d-skybox' : 'chroma-key'}
              onChange={(e) => {
                if (e.target.value === 'chroma-key') {
                  setCurrentShow({ ...currentShow, backdrop_model: '' });
                }
              }}
              label="Backdrop Type"
            >
              {/* Removed "natural" option */}
              <MenuItem value="chroma-key">Chroma Key</MenuItem>
              <MenuItem value="3d-skybox">3D Skybox</MenuItem>
            </Select>
          </FormControl>

          {!currentShow.backdrop_model && currentShow.use_backdrop && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Chroma Key Color
              </Typography>
              <input
                type="color"
                value={currentShow.backdrop_rgb}
                onChange={(e) => {
                  setCurrentShow({
                    ...currentShow,
                    backdrop_rgb: e.target.value,
                  });
                  if (socket) {
                    socket.emit('update_backdrop_color', {
                      color: e.target.value,
                    });
                  }
                }}
                style={{ width: '100%', height: 40 }}
              />
            </Box>
          )}

          {currentShow.backdrop_model && currentShow.use_backdrop && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                3D Skybox Model
              </Typography>
              <TextField
                fullWidth
                label="Skybox Model Path"
                name="backdrop_model"
                value={currentShow.backdrop_model}
                onChange={handleInputChange}
                helperText="Enter path to Unity skybox model file"
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.stopPropagation();
                  }
                }}
              />
              <Button
                variant="outlined"
                sx={{ mt: 1 }}
                onClick={() => {
                  if (socket) {
                    socket.emit('load_skybox', {
                      path: currentShow.backdrop_model,
                    });
                  }
                }}
              >
                Load Skybox
              </Button>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          <Typography variant="h6" gutterBottom>
            Preview
          </Typography>
          <Card sx={{ height: 300, bgcolor: '#111' }}>
            <CardContent sx={{ height: '100%', p: 0, position: 'relative' }}>
              {previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  alt="Backdrop Preview"
                />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'white',
                  }}
                >
                  <Typography variant="body2">Preview not available</Typography>
                </Box>
              )}
              {loading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.5)',
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
            </CardContent>
          </Card>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleSaveShow}
          >
            Apply Changes
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  const renderLightsTab = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Lighting Setup
      </Typography>

      <Grid container spacing={2}>
        {currentShow.lights.map((light) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={light.id}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">{light.name}</Typography>
                <input
                  type="color"
                  value={light.rgb}
                  onChange={(e) =>
                    handleLightColorChange(light.id, e.target.value)
                  }
                  style={{
                    height: 40,
                    width: '100%',
                    marginTop: 8,
                    marginBottom: 8,
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}

        {currentShow.lights.length === 0 && (
          <Grid item xs={12}>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ py: 2, textAlign: 'center' }}
            >
              No lights configured for this show. Add lights below.
            </Typography>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Available Lights
      </Typography>

      <Grid container spacing={2}>
        {lights.map((light) => {
          const isAdded = currentShow.lights.some((l) => l.id === light.id);

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={light.id}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">{light.name}</Typography>
                  <Button
                    variant={isAdded ? 'outlined' : 'contained'}
                    color={isAdded ? 'error' : 'primary'}
                    size="small"
                    fullWidth
                    sx={{ mt: 1 }}
                    onClick={() => {
                      if (isAdded) {
                        setCurrentShow({
                          ...currentShow,
                          lights: currentShow.lights.filter(
                            (l) => l.id !== light.id
                          ),
                        });
                      } else {
                        setCurrentShow({
                          ...currentShow,
                          lights: [
                            ...currentShow.lights,
                            { id: light.id, name: light.name, rgb: '#ffffff' },
                          ],
                        });
                      }
                    }}
                  >
                    {isAdded ? 'Remove' : 'Add to Scene'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="contained" color="primary" onClick={handleSaveShow}>
          Save Lighting Setup
        </Button>
      </Box>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      sx={{ '& .MuiDialog-paper': { height: '90vh' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Show Management</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        centered
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Show Metadata" />
        <Tab label="Backdrop" />
        <Tab label="Lighting" />
      </Tabs>

      <DialogContent dividers>
        {tabIndex === 0 && renderMetadataTab()}
        {tabIndex === 1 && renderBackdropTab()}
        {tabIndex === 2 && renderLightsTab()}
      </DialogContent>
    </Dialog>
  );
};

export default ShowsDialog;
