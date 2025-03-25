const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import state module
const {
  systemState,
  updatePosition,
  updateSystemStatus,
  addTerminalEntry,
  addScanData,
} = require('./state');

// Import motion solver
const {
  processKeyboardMovement,
  processMouseLook,
  processButtonMovement,
} = require('./motion-solver');

// Import routes and database setup
const apiRoutes = require('./routes/api');
const { setupDatabase } = require('./database/setup');

// Create Express app
const app = express();
const server = http.createServer(app);

// Set up Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use('/api/obs', obsRouter);

// Set up database
setupDatabase();

// Routes
app.use('/api', apiRoutes);

// Enable debug logging
const debug = true;

function logDebug(...args) {
  if (debug) {
    console.log(`[DEBUG ${new Date().toISOString()}]`, ...args);
  }
}

// Helper function to home a specific axis
function homeAxis(axis, callback, socket) {
  logDebug(`Starting homing for ${axis} axis`);
  const targetPosition = { ...systemState.position };
  const currentPosition = { ...systemState.position };
  let homingTime = 2000; // 2 seconds for single axis

  if (axis === 'X') {
    targetPosition.x = 0;
  } else if (axis === 'Y') {
    targetPosition.y = 0;
  } else if (axis === 'Z') {
    targetPosition.z = 0;
  }

  const startTime = Date.now();
  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / homingTime, 1);

    const newPosition = { ...systemState.position };

    if (axis === 'X') {
      newPosition.x =
        currentPosition.x + (targetPosition.x - currentPosition.x) * progress;
    } else if (axis === 'Y') {
      newPosition.y =
        currentPosition.y + (targetPosition.y - currentPosition.y) * progress;
    } else if (axis === 'Z') {
      newPosition.z =
        currentPosition.z + (targetPosition.z - currentPosition.z) * progress;
    }

    updatePosition(newPosition);
    io.emit('systemStatus', { ...systemState });

    if (progress >= 1) {
      clearInterval(interval);

      if (axis === 'X') systemState.homed.x = true;
      if (axis === 'Y') systemState.homed.y = true;
      if (axis === 'Z') systemState.homed.z = true;

      const completionMsg = `${axis} axis homing complete`;
      addTerminalEntry(`< INFO: ${completionMsg}`);
      logDebug(`Homing complete for ${axis} axis`);

      // Send completion message to client
      if (socket) {
        logDebug(`Sending HOME_COMPLETE event for ${axis} axis`);
        socket.emit('commandResponse', {
          command: 'HOME_COMPLETE',
          response: { status: 'OK', message: completionMsg },
          timestamp: new Date().toISOString(),
        });

        // Also emit terminal output
        socket.emit('terminalOutput', systemState.terminalOutput);
      }

      if (callback) callback();
    }
  }, 100);
}

// Motion simulation functions
function simulateMovement(targetPosition) {
  logDebug('Simulating movement to:', targetPosition);
  // Don't allow movement if in E-STOP
  if (systemState.eStop) {
    return { status: 'ERROR', message: 'ESTOP_ACTIVE' };
  }

  const currentPosition = { ...systemState.position };

  // Update system state
  updateSystemStatus({ clearCoreStatus: 'MOVING', servoStatus: 'ACTIVE' });

  // Calculate movement time based on distance and velocity
  const distances = {
    x: Math.abs(targetPosition.x - currentPosition.x),
    y: Math.abs(targetPosition.y - currentPosition.y),
    z: Math.abs(targetPosition.z - currentPosition.z),
  };

  const times = {
    x: (distances.x / systemState.velocities.x) * 1000,
    y: (distances.y / systemState.velocities.y) * 1000,
    z: (distances.z / systemState.velocities.z) * 1000,
  };

  const movementTime = Math.max(times.x, times.y, times.z, 500); // Minimum 500ms
  logDebug(`Calculated movement time: ${movementTime}ms`);

  // Simulate gradual movement
  const startTime = Date.now();
  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / movementTime, 1);

    // Linear interpolation
    updatePosition({
      x: currentPosition.x + (targetPosition.x - currentPosition.x) * progress,
      y: currentPosition.y + (targetPosition.y - currentPosition.y) * progress,
      z: currentPosition.z + (targetPosition.z - currentPosition.z) * progress,
      pan:
        targetPosition.pan !== undefined
          ? targetPosition.pan
          : currentPosition.pan,
      tilt:
        targetPosition.tilt !== undefined
          ? targetPosition.tilt
          : currentPosition.tilt,
    });

    // Broadcast position update
    io.emit('systemStatus', { ...systemState });

    // End movement
    if (progress >= 1) {
      clearInterval(interval);
      updateSystemStatus({ clearCoreStatus: 'READY', servoStatus: 'IDLE' });
      io.emit('systemStatus', { ...systemState });
      logDebug('Movement complete');
    }
  }, 100); // Update at 10Hz

  return { status: 'OK', message: 'MOVE_STARTED' };
}

// Handle simulated homing
function simulateHoming(axis, socket) {
  logDebug(`Starting homing simulation for ${axis}`);
  // Don't allow movement if in E-STOP
  if (systemState.eStop) {
    return { status: 'ERROR', message: 'ESTOP_ACTIVE' };
  }

  // Update system state
  updateSystemStatus({ clearCoreStatus: 'HOMING' });
  io.emit('systemStatus', { ...systemState });

  // For X or Y, ensure Z is homed first for safety
  if (
    (axis === 'X' || axis === 'Y' || axis === 'ALL') &&
    !systemState.homed.z
  ) {
    addTerminalEntry(`< INFO: Homing Z axis first for safety`);
    if (socket) {
      logDebug('Sending INFO: Homing Z axis first for safety');
      socket.emit('commandResponse', {
        command: 'INFO',
        response: { status: 'OK', message: 'Homing Z axis first for safety' },
        timestamp: new Date().toISOString(),
      });
      socket.emit('terminalOutput', systemState.terminalOutput);
    }

    // Home Z first, then continue with requested axes
    setTimeout(() => {
      homeAxis(
        'Z',
        () => {
          if (axis === 'ALL') {
            homeAxis(
              'X',
              () => {
                homeAxis(
                  'Y',
                  () => {
                    const completionMsg = 'All axes homed successfully';
                    addTerminalEntry(`< INFO: ${completionMsg}`);
                    if (socket) {
                      logDebug('Sending HOME_COMPLETE for ALL axes');
                      socket.emit('commandResponse', {
                        command: 'HOME_COMPLETE',
                        response: { status: 'OK', message: completionMsg },
                        timestamp: new Date().toISOString(),
                      });
                      socket.emit('terminalOutput', systemState.terminalOutput);
                    }
                    updateSystemStatus({ clearCoreStatus: 'READY' });
                    io.emit('systemStatus', { ...systemState });
                  },
                  socket
                );
              },
              socket
            );
          } else if (axis === 'X' || axis === 'Y') {
            homeAxis(
              axis,
              () => {
                updateSystemStatus({ clearCoreStatus: 'READY' });
                io.emit('systemStatus', { ...systemState });
              },
              socket
            );
          }
        },
        socket
      );
    }, 100);
  } else {
    // Z is already homed or we're just homing Z
    if (axis === 'ALL') {
      homeAxis(
        'Z',
        () => {
          homeAxis(
            'X',
            () => {
              homeAxis(
                'Y',
                () => {
                  const completionMsg = 'All axes homed successfully';
                  addTerminalEntry(`< INFO: ${completionMsg}`);
                  if (socket) {
                    logDebug(
                      'Sending HOME_COMPLETE for ALL axes (Z already homed)'
                    );
                    socket.emit('commandResponse', {
                      command: 'HOME_COMPLETE',
                      response: { status: 'OK', message: completionMsg },
                      timestamp: new Date().toISOString(),
                    });
                    socket.emit('terminalOutput', systemState.terminalOutput);
                  }
                  updateSystemStatus({ clearCoreStatus: 'READY' });
                  io.emit('systemStatus', { ...systemState });
                },
                socket
              );
            },
            socket
          );
        },
        socket
      );
    } else {
      homeAxis(
        axis,
        () => {
          updateSystemStatus({ clearCoreStatus: 'READY' });
          io.emit('systemStatus', { ...systemState });
        },
        socket
      );
    }
  }

  return { status: 'OK', message: 'HOMING_STARTED' };
}

// Format status response according to protocol
function formatStatusResponse() {
  const { position, clearCoreStatus, eStop, rangefinderActive, homed } =
    systemState;
  return (
    `X=${position.x.toFixed(2)},Y=${position.y.toFixed(2)},Z=${position.z.toFixed(2)},` +
    `PAN=${position.pan.toFixed(2)},TILT=${position.tilt.toFixed(2)},` +
    `ESTOP=${eStop ? 1 : 0},MOVING=${clearCoreStatus === 'MOVING' ? 1 : 0},` +
    `HOMED=${homed.x && homed.y && homed.z ? 1 : 0},` +
    `RANGEFINDER=${rangefinderActive ? 1 : 0}`
  );
}

// Process command and generate response
function processCommand(command, params = []) {
  logDebug(`Processing command: ${command}, params:`, params);

  // Format response according to ClearCore protocol: <STATUS>:<MESSAGE>
  let status = 'OK';
  let message = '';

  try {
    // Process different command types
    switch (command) {
      case 'PING':
        message = 'PONG';
        break;

      case 'STATUS':
        message = formatStatusResponse();
        break;

      case 'RESET':
        updateSystemStatus({ clearCoreStatus: 'READY', servoStatus: 'IDLE' });
        message = 'RESETTING';
        break;

      case 'DEBUG':
        const mode = params[0] || 'OFF';
        if (mode !== 'ON' && mode !== 'OFF') {
          status = 'ERROR';
          message = 'INVALID_PARAM';
        } else {
          message = `DEBUG_${mode === 'ON' ? 'ENABLED' : 'DISABLED'}`;
        }
        break;

      case 'VELOCITY':
        if (params.length < 3) {
          status = 'ERROR';
          message = 'MISSING_PARAMS';
        } else {
          systemState.velocities.x = parseFloat(params[0]);
          systemState.velocities.y = parseFloat(params[1]);
          systemState.velocities.z = parseFloat(params[2]);
          message = 'VELOCITY_SET';
        }
        break;

      case 'PAN':
        if (params.length < 1) {
          status = 'ERROR';
          message = 'MISSING_PARAM';
        } else {
          const angle = parseFloat(params[0]);
          // Normalize to 0-360
          const normalizedAngle = ((angle % 360) + 360) % 360;
          updatePosition({ pan: normalizedAngle });
          message = 'PAN_SET';
        }
        break;
      case 'TILT':
        if (params.length < 1) {
          status = 'ERROR';
          message = 'MISSING_PARAM';
        } else {
          const angle = parseFloat(params[0]);
          // Validate tilt range (45-135)
          const validAngle = Math.max(45, Math.min(135, angle));
          updatePosition({ tilt: validAngle });

          // Tilt is immediate (fire and forget)
          message = 'TILT_SET';
        }
        break;

      case 'CONFIG':
        const subCmd = params[0];
        if (!subCmd) {
          status = 'ERROR';
          message = 'MISSING_CONFIG_COMMAND';
        } else if (subCmd === 'LOAD') {
          message = 'CONFIG_LOADED';
        } else if (subCmd === 'SAVE') {
          message = 'CONFIG_SAVED';
        } else if (subCmd === 'LIST') {
          // Generate config list
          let configList = '';
          for (const category in systemState.config) {
            for (const key in systemState.config[category]) {
              configList += `${key}=${systemState.config[category][key]}\n`;
            }
          }
          message = configList.trim(); // Remove trailing newline
        } else {
          status = 'ERROR';
          message = 'INVALID_CONFIG_COMMAND';
        }
        break;

      case 'GET':
        const key = params[0];
        if (!key) {
          status = 'ERROR';
          message = 'MISSING_KEY';
        } else {
          // Find key in config
          let found = false;
          for (const category in systemState.config) {
            if (systemState.config[category][key] !== undefined) {
              message = `${key}=${systemState.config[category][key]}`;
              found = true;
              break;
            }
          }

          if (!found) {
            status = 'ERROR';
            message = 'KEY_NOT_FOUND';
          }
        }
        break;

      case 'SET':
        if (params.length < 2) {
          status = 'ERROR';
          message = 'MISSING_PARAMS';
        } else {
          const key = params[0];
          const value = params[1];
          let dataValue = value;

          // Debug
          logDebug(`Processing SET command for ${key}=${value}`);

          // Direct check against known database fields
          // These are the fields we know exist in the settings table
          const validSettingsKeys = [
            'system_name',
            'firmware_version',
            'serial_number',
            'velocity_x',
            'velocity_y',
            'velocity_z',
            'acceleration_x',
            'acceleration_y',
            'acceleration_z',
            'max_jerk_x',
            'max_jerk_y',
            'max_jerk_z',
            'rangefinder_offset_x',
            'rangefinder_offset_y',
            'min_distance',
            'max_distance',
            'collision_margin',
            'tilt_min',
            'tilt_max',
            'tilt_center',
            'tilt_speed',
            'home_velocity_x',
            'home_velocity_y',
            'home_velocity_z',
            'home_direction_x',
            'home_direction_y',
            'home_direction_z',
            'stage_min_x',
            'stage_min_y',
            'stage_min_z',
            'stage_max_x',
            'stage_max_y',
            'stage_max_z',
            'ethernet_port',
            'ethernet_dhcp',
            'ethernet_static_ip',
            'ethernet_static_netmask',
            'ethernet_static_gateway',
            'ethernet_timeout',
            'ethernet_heartbeat',
            'ethernet_reconnect',
            'ethernet_logging',
            'ethernet_log_file',
            'ethernet_log_level',
            'debug',
            'debug_level',
            'log_commands',
            'log_file',
          ];

          if (validSettingsKeys.includes(key)) {
            logDebug(`Valid key found: ${key}`);

            // Convert value to appropriate type based on key
            const numericKeys = [
              'velocity_x',
              'velocity_y',
              'velocity_z',
              'acceleration_x',
              'acceleration_y',
              'acceleration_z',
              'max_jerk_x',
              'max_jerk_y',
              'max_jerk_z',
              'rangefinder_offset_x',
              'rangefinder_offset_y',
              'min_distance',
              'max_distance',
              'collision_margin',
              'tilt_min',
              'tilt_max',
              'tilt_center',
              'tilt_speed',
              'home_velocity_x',
              'home_velocity_y',
              'home_velocity_z',
              'home_direction_x',
              'home_direction_y',
              'home_direction_z',
              'stage_min_x',
              'stage_min_y',
              'stage_min_z',
              'stage_max_x',
              'stage_max_y',
              'stage_max_z',
              'ethernet_port',
              'ethernet_timeout',
              'ethernet_heartbeat',
              'ethernet_log_level',
              'debug',
              'debug_level',
            ];

            const booleanKeys = [
              'ethernet_dhcp',
              'ethernet_reconnect',
              'ethernet_logging',
              'log_commands',
            ];

            // Update memory state as well as db
            for (const category in systemState.config) {
              if (systemState.config[category][key] !== undefined) {
                if (numericKeys.includes(key)) {
                  systemState.config[category][key] = parseFloat(value);
                  dataValue = parseFloat(value);
                } else if (booleanKeys.includes(key)) {
                  systemState.config[category][key] = value === 'true';
                  dataValue = value === 'true' ? 1 : 0; // SQLite stores booleans as 0/1
                } else {
                  systemState.config[category][key] = value;
                }
                break;
              }
            }

            // Save to database
            const dataService = require('./database/data-service');
            const updateData = {};
            updateData[key] = dataValue;

            logDebug(`Sending to database: ${key}=${dataValue}`);

            dataService
              .updateSettings(updateData)
              .then((result) => {
                logDebug(
                  `Successfully updated database with ${key}=${dataValue}`
                );
              })
              .catch((err) => {
                console.error(`Failed to update database for ${key}:`, err);
              });

            message = `${key}=${value}`;
          } else {
            status = 'ERROR';
            message = 'KEY_NOT_FOUND';
            logDebug(`Invalid key: ${key}`);
          }
        }
        break;
      default:
        status = 'ERROR';
        message = 'UNKNOWN_COMMAND';
    }
  } catch (error) {
    status = 'ERROR';
    message = 'COMMAND_FAILED';
    console.error('Command processing error:', error);
  }

  logDebug(`Command response: ${status}:${message}`);
  return { status, message };
}

// Socket.io connection handling
io.on('connection', (socket) => {
  logDebug('New client connected:', socket.id);

  // Send initial system status
  socket.emit('systemStatus', { ...systemState });

  // Handle keyboard movement
  socket.on('keyboard_movement', (data) => {
    if (systemState.eStop) {
      return;
    }

    logDebug('Keyboard movement received:', data);

    // Process movement through motion solver
    const newPosition = processKeyboardMovement(data);

    // Update system status to show movement
    updateSystemStatus({ clearCoreStatus: 'MOVING', servoStatus: 'ACTIVE' });

    // Broadcast updated position
    io.emit('systemStatus', { ...systemState });

    // Reset status after a short delay
    setTimeout(() => {
      updateSystemStatus({ clearCoreStatus: 'READY', servoStatus: 'IDLE' });
      io.emit('systemStatus', { ...systemState });
    }, 100);
  });

  // Handle mouse look
  socket.on('mouse_look', (data) => {
    if (systemState.eStop) {
      return;
    }

    logDebug('Mouse look received:', data);

    // Process look through motion solver
    const newOrientation = processMouseLook(data);

    // Update system status
    updateSystemStatus({ servoStatus: 'ACTIVE' });

    // Broadcast updated position
    io.emit('systemStatus', { ...systemState });

    // Reset status after a short delay
    setTimeout(() => {
      updateSystemStatus({ servoStatus: 'IDLE' });
      io.emit('systemStatus', { ...systemState });
    }, 100);
  });

  // Handle button movement
  socket.on('button_movement', (data) => {
    if (systemState.eStop) {
      return;
    }

    const { direction } = data;
    logDebug('Button movement received:', direction);

    if (direction === 'stop') {
      // Handle stop command
      updateSystemStatus({ clearCoreStatus: 'READY', servoStatus: 'IDLE' });
      io.emit('systemStatus', { ...systemState });
      return;
    }

    // Process movement through motion solver
    const newPosition = processButtonMovement(direction);

    // Update system status to show movement
    updateSystemStatus({ clearCoreStatus: 'MOVING', servoStatus: 'ACTIVE' });

    // Broadcast updated position
    io.emit('systemStatus', { ...systemState });

    // Reset status after a short delay
    setTimeout(() => {
      updateSystemStatus({ clearCoreStatus: 'READY', servoStatus: 'IDLE' });
      io.emit('systemStatus', { ...systemState });
    }, 100);
  });

  // Handle command requests
  socket.on('command', (data, callback) => {
    logDebug('Received command from client:', data);

    // Extract command and params
    const { command, params } = data;

    // Add to terminal history
    addTerminalEntry(
      `> ${command}${params && params.length ? ': ' + params.join(', ') : ''}`
    );

    // Process special commands that need simulation
    if (command === 'HOME') {
      const response = simulateHoming(params[0] || 'ALL', socket);
      logDebug('Sending HOME response:', response);
      addTerminalEntry(`< ${response.status}: ${response.message}`);
      if (callback) {
        logDebug('Calling HOME callback');
        callback({
          success: response.status === 'OK',
          message: response.message,
        });
      }
      socket.emit('terminalOutput', systemState.terminalOutput);
    } else if (command === 'MOVE') {
      if (params.length >= 3) {
        const targetPosition = {
          x: parseFloat(params[0]),
          y: parseFloat(params[1]),
          z: parseFloat(params[2]),
          pan:
            params.length > 3
              ? parseFloat(params[3])
              : systemState.position.pan,
          tilt:
            params.length > 4
              ? parseFloat(params[4])
              : systemState.position.tilt,
        };
        const response = simulateMovement(targetPosition);
        logDebug('Sending MOVE response:', response);
        addTerminalEntry(`< ${response.status}: ${response.message}`);
        if (callback) {
          logDebug('Calling MOVE callback');
          callback({
            success: response.status === 'OK',
            message: response.message,
          });
        }
      } else {
        addTerminalEntry(`< ERROR: MISSING_PARAMS`);
        if (callback) {
          logDebug('Calling MOVE callback with error');
          callback({ success: false, message: 'MISSING_PARAMS' });
        }
      }
      socket.emit('terminalOutput', systemState.terminalOutput);
    }
    // Handle other commands
    else {
      const response = processCommand(command, params);
      logDebug('Sending response:', response);
      addTerminalEntry(`< ${response.status}: ${response.message}`);
      if (callback) {
        logDebug('Calling command callback');
        callback({
          success: response.status === 'OK',
          message: response.message,
        });
      }
      socket.emit('terminalOutput', systemState.terminalOutput);
    }
  });

  socket.on('clearTerminal', () => {
    logDebug('Clearing terminal history');
    // Clear terminal output in server state
    systemState.terminalOutput = [];
    socket.emit('terminalOutput', systemState.terminalOutput);
  });

  socket.on('getClearCoreInfo', async () => {
    logDebug('Getting ClearCore info');
    try {
      const dataService = require('./database/data-service');
      const settings = await dataService.getSettings();

      let ipAddress = null;
      if (settings) {
        // Use static IP for now
        ipAddress = settings.ethernet_static_ip;
      }

      logDebug('Sending ClearCore IP:', ipAddress);
      socket.emit('clearCoreInfo', { ipAddress });
    } catch (error) {
      console.error('Error fetching ClearCore IP:', error);
      socket.emit('clearCoreInfo', { ipAddress: null });
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  logDebug('Debug logging enabled');
});

module.exports = { app, server, io, systemState };
