const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import state module
const { systemState, updatePosition, updateSystemStatus, addTerminalEntry, addScanData } = require('./state');

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
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up database
setupDatabase();

// Routes
app.use('/api', apiRoutes);

// Helper function to home a specific axis
function homeAxis(axis, callback, socket) {
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
      newPosition.x = currentPosition.x + (targetPosition.x - currentPosition.x) * progress;
    } else if (axis === 'Y') {
      newPosition.y = currentPosition.y + (targetPosition.y - currentPosition.y) * progress;
    } else if (axis === 'Z') {
      newPosition.z = currentPosition.z + (targetPosition.z - currentPosition.z) * progress;
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
      
      // Send completion message to client
      if (socket) {
        socket.emit('commandResponse', {
          command: 'HOME_COMPLETE',
          response: { status: "OK", message: completionMsg },
          timestamp: new Date().toISOString()
        });
      }
      
      if (callback) callback();
    }
  }, 100);
}

// Motion simulation functions
function simulateMovement(targetPosition) {
  // Don't allow movement if in E-STOP
  if (systemState.eStop) {
    return { status: "ERROR", message: "ESTOP_ACTIVE" };
  }
  
  const currentPosition = { ...systemState.position };
  
  // Update system state
  updateSystemStatus({ clearCoreStatus: 'MOVING', servoStatus: 'ACTIVE' });
  
  // Calculate movement time based on distance and velocity
  const distances = {
    x: Math.abs(targetPosition.x - currentPosition.x),
    y: Math.abs(targetPosition.y - currentPosition.y),
    z: Math.abs(targetPosition.z - currentPosition.z)
  };
  
  const times = {
    x: distances.x / systemState.velocities.x * 1000,
    y: distances.y / systemState.velocities.y * 1000,
    z: distances.z / systemState.velocities.z * 1000
  };
  
  const movementTime = Math.max(times.x, times.y, times.z, 500); // Minimum 500ms
  
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
      pan: targetPosition.pan !== undefined ? targetPosition.pan : currentPosition.pan,
      tilt: targetPosition.tilt !== undefined ? targetPosition.tilt : currentPosition.tilt
    });
    
    // Broadcast position update
    io.emit('systemStatus', { ...systemState });
    
    // End movement
    if (progress >= 1) {
      clearInterval(interval);
      updateSystemStatus({ clearCoreStatus: 'READY', servoStatus: 'IDLE' });
      io.emit('systemStatus', { ...systemState });
    }
  }, 100); // Update at 10Hz
  
  return { status: "OK", message: "MOVE_STARTED" };
}

// Handle simulated homing
function simulateHoming(axis, socket) {
  // Don't allow movement if in E-STOP
  if (systemState.eStop) {
    return { status: "ERROR", message: "ESTOP_ACTIVE" };
  }
  
  // Update system state
  updateSystemStatus({ clearCoreStatus: 'HOMING' });
  io.emit('systemStatus', { ...systemState });
  
  // For X or Y, ensure Z is homed first for safety
  if ((axis === 'X' || axis === 'Y' || axis === 'ALL') && !systemState.homed.z) {
    addTerminalEntry(`< INFO: Homing Z axis first for safety`);
    if (socket) {
      socket.emit('commandResponse', {
        command: 'INFO',
        response: { status: "OK", message: "Homing Z axis first for safety" },
        timestamp: new Date().toISOString()
      });
    }
    
    // Home Z first, then continue with requested axes
    setTimeout(() => {
      homeAxis('Z', () => {
        if (axis === 'ALL') {
          homeAxis('X', () => {
            homeAxis('Y', () => {
              const completionMsg = "All axes homed successfully";
              addTerminalEntry(`< INFO: ${completionMsg}`);
              if (socket) {
                socket.emit('commandResponse', {
                  command: 'HOME_COMPLETE',
                  response: { status: "OK", message: completionMsg },
                  timestamp: new Date().toISOString()
                });
              }
              updateSystemStatus({ clearCoreStatus: 'READY' });
              io.emit('systemStatus', { ...systemState });
            }, socket);
          }, socket);
        } else if (axis === 'X' || axis === 'Y') {
          homeAxis(axis, () => {
            updateSystemStatus({ clearCoreStatus: 'READY' });
            io.emit('systemStatus', { ...systemState });
          }, socket);
        }
      }, socket);
    }, 100);
  } else {
    // Z is already homed or we're just homing Z
    if (axis === 'ALL') {
      homeAxis('Z', () => {
        homeAxis('X', () => {
          homeAxis('Y', () => {
            const completionMsg = "All axes homed successfully";
            addTerminalEntry(`< INFO: ${completionMsg}`);
            if (socket) {
              socket.emit('commandResponse', {
                command: 'HOME_COMPLETE',
                response: { status: "OK", message: completionMsg },
                timestamp: new Date().toISOString()
              });
            }
            updateSystemStatus({ clearCoreStatus: 'READY' });
            io.emit('systemStatus', { ...systemState });
          }, socket);
        }, socket);
      }, socket);
    } else {
      homeAxis(axis, () => {
        updateSystemStatus({ clearCoreStatus: 'READY' });
        io.emit('systemStatus', { ...systemState });
      }, socket);
    }
  }
  
  return { status: "OK", message: "HOMING_STARTED" };
}

// Format status response according to protocol
function formatStatusResponse() {
  const { position, clearCoreStatus, eStop, rangefinderActive, homed } = systemState;
  return `X=${position.x.toFixed(2)},Y=${position.y.toFixed(2)},Z=${position.z.toFixed(2)},` +
         `PAN=${position.pan.toFixed(2)},TILT=${position.tilt.toFixed(2)},` +
         `ESTOP=${eStop ? 1 : 0},MOVING=${clearCoreStatus === 'MOVING' ? 1 : 0},` +
         `HOMED=${homed.x && homed.y && homed.z ? 1 : 0},` +
         `RANGEFINDER=${rangefinderActive ? 1 : 0}`;
}

// Process command and generate response
function processCommand(command, params = []) {
  console.log(`Processing command: ${command}, params:`, params);
  
  // Format response according to ClearCore protocol: <STATUS>:<MESSAGE>
  let status = "OK";
  let message = "";
  
  try {
    // Process different command types
    switch(command) {
      case 'PING':
        message = "PONG";
        break;
        
      case 'STATUS':
        message = formatStatusResponse();
        break;
        
      case 'RESET':
        updateSystemStatus({ clearCoreStatus: 'READY', servoStatus: 'IDLE' });
        message = "RESETTING";
        break;
        
      case 'DEBUG':
        const mode = params[0] || 'OFF';
        if (mode !== 'ON' && mode !== 'OFF') {
          status = "ERROR";
          message = "INVALID_PARAM";
        } else {
          message = `DEBUG_${mode === 'ON' ? 'ENABLED' : 'DISABLED'}`;
        }
        break;
        
      case 'VELOCITY':
        if (params.length < 3) {
          status = "ERROR";
          message = "MISSING_PARAMS";
        } else {
          systemState.velocities.x = parseFloat(params[0]);
          systemState.velocities.y = parseFloat(params[1]);
          systemState.velocities.z = parseFloat(params[2]);
          message = "VELOCITY_SET";
        }
        break;
        
      case 'TILT':
        if (params.length < 1) {
          status = "ERROR";
          message = "MISSING_PARAM";
        } else {
          const angle = parseFloat(params[0]);
          // Validate tilt range (45-135)
          const validAngle = Math.max(45, Math.min(135, angle));
          updatePosition({ tilt: validAngle });
          
          // Tilt is immediate (fire and forget)
          message = "TILT_SET";
        }
        break;
        
      case 'CONFIG':
        const subCmd = params[0];
        if (!subCmd) {
          status = "ERROR";
          message = "MISSING_CONFIG_COMMAND";
        } else if (subCmd === 'LOAD') {
          message = "CONFIG_LOADED";
        } else if (subCmd === 'SAVE') {
          message = "CONFIG_SAVED";
        } else if (subCmd === 'LIST') {
          // Generate config list
          let configList = "";
          for (const category in systemState.config) {
            for (const key in systemState.config[category]) {
              configList += `${key}=${systemState.config[category][key]}\n`;
            }
          }
          message = configList.trim(); // Remove trailing newline
        } else {
          status = "ERROR";
          message = "INVALID_CONFIG_COMMAND";
        }
        break;
        
      case 'GET':
        const key = params[0];
        if (!key) {
          status = "ERROR";
          message = "MISSING_KEY";
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
            status = "ERROR";
            message = "KEY_NOT_FOUND";
          }
        }
        break;
        
      case 'SET':
        if (params.length < 2) {
          status = "ERROR";
          message = "MISSING_PARAMS";
        } else {
          const key = params[0];
          const value = params[1];
          
          // Find and update key in config
          let found = false;
          for (const category in systemState.config) {
            if (systemState.config[category][key] !== undefined) {
              // Convert value to appropriate type
              if (typeof systemState.config[category][key] === 'number') {
                systemState.config[category][key] = parseFloat(value);
              } else if (typeof systemState.config[category][key] === 'boolean') {
                systemState.config[category][key] = value === 'true';
              } else {
                systemState.config[category][key] = value;
              }
              
              message = `${key}=${systemState.config[category][key]}`;
              found = true;
              break;
            }
          }
          
          if (!found) {
            status = "ERROR";
            message = "KEY_NOT_FOUND";
          }
        }
        break;
        
      case 'SAVE':
        message = "Settings saved to storage";
        break;
        
      default:
        status = "ERROR";
        message = "UNKNOWN_COMMAND";
    }
  } catch (error) {
    status = "ERROR";
    message = "COMMAND_FAILED";
    console.error("Command processing error:", error);
  }
  
  return { status, message };
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Send initial system status
  socket.emit('systemStatus', { ...systemState });
  
  // Handle command from client
  socket.on('command', (data, callback) => {
    console.log('Command received:', data);
    
    // Extract command and parameters
    const command = data.command;
    const params = data.params || [];
    
    // Add command to terminal output
    const commandString = params.length > 0 ? `${command}:${params.join(',')}` : command;
    addTerminalEntry(`> ${commandString}`);
    
    // Process based on command type
    let response;
    
    if (command === 'MOVE') {
      // Special handling for movement
      const targetPosition = {
        x: parseFloat(params[0]),
        y: parseFloat(params[1]),
        z: parseFloat(params[2]),
        pan: params.length > 3 ? parseFloat(params[3]) : systemState.position.pan,
        tilt: params.length > 4 ? parseFloat(params[4]) : systemState.position.tilt
      };
      
      response = simulateMovement(targetPosition);
    } 
    else if (command === 'HOME') {
      // Handle homing
      const axis = params[0] || 'ALL';
      response = simulateHoming(axis, socket);
    }
    else if (command === 'ESTOP') {
      updateSystemStatus({ eStop: true, clearCoreStatus: 'ESTOP' });
      io.emit('systemStatus', { ...systemState });
      response = { status: "OK", message: "ESTOP_ACTIVATED" };
    }
    else if (command === 'RESET_ESTOP') {
      updateSystemStatus({ eStop: false, clearCoreStatus: 'READY' });
      io.emit('systemStatus', { ...systemState });
      response = { status: "OK", message: "ESTOP_RESET" };
    }
    else if (command === 'STOP') {
      // Immediate stop simulation
      updateSystemStatus({ clearCoreStatus: 'READY', servoStatus: 'IDLE' });
      io.emit('systemStatus', { ...systemState });
      response = { status: "OK", message: "MOTION_STOPPED" };
    }
    else if (command === 'MEASURE') {
      // Simulate rangefinder measurement
      updateSystemStatus({ rangefinderActive: true });
      io.emit('systemStatus', { ...systemState });
      
      // Random distance with some realism
      const distance = (45 + Math.random() * 10).toFixed(2);
      
      // Turn off rangefinder after delay
      setTimeout(() => {
        updateSystemStatus({ rangefinderActive: false });
        io.emit('systemStatus', { ...systemState });
      }, 1000);
      
      response = { status: "OK", message: distance };
    }
    else if (command === 'SCAN') {
      // Simulate scan operation
      if (params.length < 5) {
        response = { status: "ERROR", message: "MISSING_PARAMS" };
      } else {
        updateSystemStatus({ rangefinderActive: true });
        io.emit('systemStatus', { ...systemState });
        
        const x1 = parseFloat(params[0]);
        const y1 = parseFloat(params[1]);
        const x2 = parseFloat(params[2]);
        const y2 = parseFloat(params[3]);
        const step = parseFloat(params[4]);
        
        // Long-running operation
        setTimeout(() => {
          // Generate scan data
          for (let x = x1; x <= x2; x += step) {
            for (let y = y1; y <= y2; y += step) {
              const scanData = {
                x: x,
                y: y,
                z: (20 + Math.random() * 30).toFixed(2)
              };
              
              // Emit scan data point
              addScanData(scanData);
              io.emit('scanData', scanData);
            }
          }
          
          updateSystemStatus({ rangefinderActive: false });
          io.emit('systemStatus', { ...systemState });
          
          // Send scan complete message
          socket.emit('commandResponse', {
            command: 'SCAN_COMPLETE',
            response: { status: "OK", message: "SCAN_COMPLETE" },
            timestamp: new Date().toISOString()
          });
          
          addTerminalEntry(`< INFO: Scan complete`);
        }, 5000);
        
        response = { status: "OK", message: "SCAN_STARTED" };
      }
    }
    else if (command === 'PAN') {
      if (params.length < 1) {
        response = { status: "ERROR", message: "MISSING_PARAM" };
      } else {
        // Handle angle wrapping for pan
        let angle = parseFloat(params[0]);
        
        // Convert negative angles to positive equivalent
        while (angle < 0) {
          angle += 360;
        }
        
        // Ensure angle is within 0-360 range
        angle = angle % 360;
        
        // Set pan immediately but simulate movement
        updatePosition({ pan: angle });
        updateSystemStatus({ servoStatus: 'ACTIVE' });
        
        // Simulate pan movement taking time
        setTimeout(() => {
          updateSystemStatus({ servoStatus: 'IDLE' });
          io.emit('systemStatus', { ...systemState });
          
          // Send completion message
          socket.emit('commandResponse', {
            command: 'PAN_COMPLETE',
            response: { status: "OK", message: "PAN_COMPLETE" },
            timestamp: new Date().toISOString()
          });
          
          addTerminalEntry(`< INFO: Pan movement complete`);
        }, 2000); // Pan takes 2 seconds
        
        response = { status: "OK", message: "PAN_STARTED" };
      }
    }
    else {
      // Generic command processing
      response = processCommand(command, params);
    }
    
    // Add response to terminal output
    addTerminalEntry(`< ${response.status}:${response.message}`);
    
    // Send response back to client
    const responseObj = {
      command: command,
      response: response,
      timestamp: new Date().toISOString()
    };
    
    if (callback && typeof callback === 'function') {
      callback(response);
    } else {
      socket.emit('commandResponse', responseObj);
    }
    
    // Also send updated terminal output
    socket.emit('terminalOutput', systemState.terminalOutput);
  });
  
  // Handle terminal history request
  socket.on('getTerminalHistory', () => {
    socket.emit('terminalOutput', systemState.terminalOutput);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io, systemState };