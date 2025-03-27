import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
} from '@mui/material';
import { ShowMetadata } from '../../types';

interface ShowMetadataDialogProps {
  open: boolean;
  onClose: () => void;
  metadata: ShowMetadata;
  onSave: (metadata: ShowMetadata) => void;
}

const ShowMetadataDialog: React.FC<ShowMetadataDialogProps> = ({
  open,
  onClose,
  metadata,
  onSave,
}) => {
  const [formData, setFormData] = useState<ShowMetadata>(metadata);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Typography variant="h5">Artwork Details</Typography>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              name="title"
              label="Title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              name="artist"
              label="Artist"
              value={formData.artist}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              name="date"
              label="Date"
              value={formData.date}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              name="materials"
              label="Materials"
              value={formData.materials}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              name="dimensions"
              label="Dimensions"
              value={formData.dimensions}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              margin="normal"
              variant="outlined"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShowMetadataDialog;
