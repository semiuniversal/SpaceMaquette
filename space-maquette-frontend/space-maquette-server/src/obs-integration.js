// obs-integration.js - with error handling
const OBSWebSocket = require('obs-websocket-js').default;
const express = require('express');
const router = express.Router();

// OBS connection details
const OBS_ADDRESS = '192.168.86.27';
const OBS_PORT = 4444;
const OBS_PASSWORD = 'ct4nk3p';

// Connect to OBS
const obs = new OBSWebSocket();
let connected = false;

async function connectOBS() {
  try {
    await obs.connect(`ws://${OBS_ADDRESS}:${OBS_PORT}`, OBS_PASSWORD);
    console.log('Connected to OBS');
    connected = true;
  } catch (err) {
    console.log('OBS connection not available - camera features disabled');
    // Don't retry constantly - just disable the feature
  }
}

// Only attempt connection once
connectOBS().catch(() => {
  console.log('OBS integration disabled');
});

// API endpoints - all with connection checks
router.get('/cameras', async (req, res) => {
  if (!connected) {
    return res.json([]); // Return empty array if not connected
  }

  // Rest of function unchanged
});

// Export router with all endpoints having connection checks
module.exports = {
  router,
  obs,
};
