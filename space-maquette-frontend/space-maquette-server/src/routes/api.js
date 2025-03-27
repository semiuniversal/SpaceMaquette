// routes/api.js

const express = require('express');
const router = express.Router();
const dataService = require('../database/data-service');
const { systemState } = require('../state');

// Add logging middleware for all routes
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body));
  }
  next();
});

// Shows API
router.get('/shows', async (req, res) => {
  try {
    const shows = await dataService.getShows();
    res.json(shows);
  } catch (err) {
    console.error('Error getting shows:', err);
    res.status(500).json({ error: err.message });
  }
});
router.get('/metadata', async (req, res) => {
  try {
    const dataService = require('../database/data-service');

    // Get current show ID from settings
    const settings = await dataService.getSettings();
    const currentShowId = settings?.current_show || null;

    if (!currentShowId) {
      return res.json({
        error: 'No show currently loaded',
        status: 'idle',
      });
    }

    // Get show data
    const show = await dataService.getShow(currentShowId);

    if (!show) {
      return res.status(404).json({ error: 'Show not found' });
    }

    // Return show metadata
    res.json({
      id: show.id,
      name: show.name,
      artist: show.artist,
      year: show.year,
      materials: show.materials,
      dimensions: show.dimensions,
      backdrop: show.backdrop_type,
      status: 'active',
    });
  } catch (error) {
    console.error('Error in metadata route:', error);
    res.status(500).json({ error: 'Failed to retrieve metadata' });
  }
});
router.get('/shows/:id', async (req, res) => {
  try {
    const show = await dataService.getShow(req.params.id);
    if (!show) return res.status(404).json({ error: 'Show not found' });
    res.json(show);
  } catch (err) {
    console.error(`Error getting show ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/shows', async (req, res) => {
  try {
    const { work_name, artist, created, materials } = req.body;

    if (!work_name || !artist || !created || !materials) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    console.log('Creating new show:', req.body);
    const show = await dataService.createShow(req.body);
    res.status(201).json(show);
  } catch (err) {
    console.error('Error creating show:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/shows/:id', async (req, res) => {
  try {
    console.log(`Updating show ${req.params.id}:`, req.body);
    const show = await dataService.updateShow(req.params.id, req.body);
    res.json(show);
  } catch (err) {
    console.error(`Error updating show ${req.params.id}:`, err);
    if (err.message === 'Show not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

router.delete('/shows/:id', async (req, res) => {
  try {
    console.log(`Deleting show ${req.params.id}`);
    await dataService.deleteShow(req.params.id);
    res.json({ message: 'Show deleted successfully' });
  } catch (err) {
    console.error(`Error deleting show ${req.params.id}:`, err);
    if (err.message === 'Show not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Maps API
router.get('/maps/:id', async (req, res) => {
  try {
    const map = await dataService.getMap(req.params.id);
    if (!map) return res.status(404).json({ error: 'Map not found' });
    res.json(map);
  } catch (err) {
    console.error(`Error getting map ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/maps', async (req, res) => {
  try {
    console.log('Creating new map:', req.body);
    const map = await dataService.createMap(req.body);
    res.status(201).json(map);
  } catch (err) {
    console.error('Error creating map:', err);
    res.status(500).json({ error: err.message });
  }
});

// Scans API
router.get('/shows/:id/scans', async (req, res) => {
  try {
    const scans = await dataService.getScans(req.params.id);
    res.json(scans);
  } catch (err) {
    console.error(`Error getting scans for show ${req.params.id}:`, err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/scans', async (req, res) => {
  try {
    console.log('Creating new scan:', req.body);
    const scan = await dataService.createScan(req.body);
    res.status(201).json(scan);
  } catch (err) {
    console.error('Error creating scan:', err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/scans/:id/status', async (req, res) => {
  try {
    const { complete, last_x, last_y } = req.body;
    console.log(`Updating scan ${req.params.id} status:`, req.body);
    const scan = await dataService.updateScanStatus(
      req.params.id,
      complete,
      last_x,
      last_y
    );
    res.json(scan);
  } catch (err) {
    console.error(`Error updating scan ${req.params.id} status:`, err);
    if (err.message === 'Scan not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Settings API
router.get('/settings', async (req, res) => {
  try {
    const settings = await dataService.getSettings();
    res.json(settings);
  } catch (err) {
    console.error('Error getting settings:', err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/settings', async (req, res) => {
  try {
    console.log('Updating settings:', req.body);
    const settings = await dataService.updateSettings(req.body);
    res.json(settings);
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: err.message });
  }
});

// Camera API
router.get('/cameras', (req, res) => {
  console.log('Fetching camera streams');
  res.json(systemState.cameraStreams);
});

// System status endpoints for backward compatibility
router.get('/status', (req, res) => {
  res.json({
    position: systemState.position,
    clearCoreStatus: systemState.clearCoreStatus,
    rangefinderActive: systemState.rangefinderActive,
    eStop: systemState.eStop,
    servoStatus: systemState.servoStatus,
  });
});

router.get('/position', (req, res) => {
  res.json({
    position: systemState.position,
    status: {
      clearCoreStatus: systemState.clearCoreStatus,
      rangefinderActive: systemState.rangefinderActive,
      eStop: systemState.eStop,
      servoStatus: systemState.servoStatus,
    },
  });
});

router.get('/terminal', (req, res) => {
  res.json(systemState.terminalOutput);
});

router.get('/scan-data', (req, res) => {
  res.json(systemState.scanData);
});

router.delete('/scan-data', (req, res) => {
  console.log('Clearing scan data');
  systemState.scanData = [];
  systemState.scanProgress = 0;
  res.json({ message: 'Scan data cleared' });
});

module.exports = router;
