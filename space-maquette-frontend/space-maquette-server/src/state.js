// src/state.js

/*

This state module serves as a central in-memory store that:

- Provides default values on startup
-Gets updated when DB values are loaded
Stores runtime state that doesn't need persistence
-Acts as the single source of truth for the server during operation

When we add new properties to the database schema, we should synchronize them with this state object to maintain consistency.

*/

const systemState = {
    // Position and orientation
    position: { x: 150, y: 150, z: 50, pan: 180, tilt: 90 },
    
    // System status
    clearCoreStatus: 'READY',  // READY, MOVING, HOMING, ESTOP
    rangefinderActive: false,
    eStop: false,
    servoStatus: 'IDLE',       // IDLE, ACTIVE
    
    // Homing status
    homed: { x: true, y: true, z: true },
    
    // Motion parameters
    velocities: { x: 300, y: 300, z: 150 },
    
    // Configuration data
    config: {
      system: {
        system_name: 'Space Maquette',
        firmware_version: '1.0.0',
        serial_number: 'SM-2025-001'
      },
      motion: {
        velocity_x: 300,
        velocity_y: 300,
        velocity_z: 150,
        acceleration: 1000,
        max_jerk: 5000
      },
      rangefinder: {
        offset: 10.5,
        min_distance: 10,
        max_distance: 1000,
        collision_margin: 30
      },
      servo: {
        tilt_min: 45,
        tilt_max: 135,
        tilt_center: 90,
        tilt_speed: 50
      },
      home: {
        velocity_x: 100,
        velocity_y: 100,
        velocity_z: 50,
        direction_x: 1,
        direction_y: 1,
        direction_z: -1
      }
    },
    
    // Terminal output history
    terminalOutput: [],
    
    // Scan data
    scanData: [],
    scanProgress: 0,
    currentScan: null,
    
    // Show metadata
    currentShow: {
      id: 1,
      work_name: 'Cosmic Drift',
      artist: 'Jane Doe',
      created: '2025',
      materials: 'Mixed media, electronics',
      scale: '1:10'
    },
    
    // Camera streams
    cameraStreams: [
      { id: 'main', name: 'Main Camera', url: 'http://localhost:8080/main' },
      { id: 'overhead', name: 'Overhead Camera', url: 'http://localhost:8080/overhead' }
    ],
    activeCamera: 'main'
  };
  
  // Utility functions for state management
  const updatePosition = (newPosition) => {
    Object.assign(systemState.position, newPosition);
  };
  
  const updateSystemStatus = (status) => {
    if (status.clearCoreStatus) systemState.clearCoreStatus = status.clearCoreStatus;
    if (status.rangefinderActive !== undefined) systemState.rangefinderActive = status.rangefinderActive;
    if (status.eStop !== undefined) systemState.eStop = status.eStop;
    if (status.servoStatus) systemState.servoStatus = status.servoStatus;
  };
  
  const addTerminalEntry = (entry) => {
    systemState.terminalOutput.push(entry);
    // Keep terminal history at a reasonable size
    if (systemState.terminalOutput.length > 100) {
      systemState.terminalOutput = systemState.terminalOutput.slice(-100);
    }
  };
  
  const addScanData = (point) => {
    systemState.scanData.push(point);
  };
  
  const updateScanProgress = (progress) => {
    systemState.scanProgress = progress;
  };
  
  const clearScanData = () => {
    systemState.scanData = [];
    systemState.scanProgress = 0;
  };
  
  const updateConfig = (category, key, value) => {
    if (systemState.config[category] && systemState.config[category][key] !== undefined) {
      systemState.config[category][key] = value;
      return true;
    }
    return false;
  };
  
  module.exports = {
    systemState,
    updatePosition,
    updateSystemStatus,
    addTerminalEntry,
    addScanData,
    updateScanProgress,
    clearScanData,
    updateConfig
  };