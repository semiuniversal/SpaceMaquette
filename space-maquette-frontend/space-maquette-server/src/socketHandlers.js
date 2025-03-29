// socketHandlers.js
const motionController = require('./motion-controller');
const { systemState, addTerminalEntry } = require('./state');
const { logDebug } = require('./logger');

function registerSocketHandlers(io) {
  // Set the io reference for motion simulation through the motion controller
  motionController.setIo(io);

  io.on('connection', (socket) => {
    logDebug('socket', 'New client connected:', socket.id);

    // Send initial system status
    socket.emit('systemStatus', {
      ...systemState,
      _updateId: Date.now(),
    });

    // Handle keyboard movement using motion controller
    socket.on('keyboard_movement', (data) => {
      if (systemState.eStop) return;
      logDebug('socket', 'Keyboard movement received:', data);

      const newPos = motionController.processKeyboardMovement(data);
      io.emit('systemStatus', { ...systemState, _updateId: Date.now() });
    });

    // Handle mouse look using motion controller
    socket.on('mouse_look', (data) => {
      if (systemState.eStop) return;
      logDebug('socket', 'Mouse look received:', data);

      const newOrient = motionController.processMouseLook(data);
      io.emit('systemStatus', { ...systemState, _updateId: Date.now() });
    });

    // Handle button movement (for discrete direction changes)
    socket.on('button_movement', (data) => {
      if (systemState.eStop) {
        logDebug('socket', 'Ignoring button movement: ESTOP active');
        return;
      }
      logDebug('socket', 'Button movement received:', data.direction);
      if (data.direction === 'stop') {
        logDebug('socket', 'Stopping all motions');
        motionController.stopAllMotions();
      } else {
        motionController.executeButtonMovement(data.direction);
      }
    });

    // Handle command requests (e.g., HOME, MOVE, etc.)
    socket.on('command', (data, callback) => {
      logDebug('socket', 'Received command:', data);
      addTerminalEntry(
        `> ${data.command}${data.params && data.params.length ? ': ' + data.params.join(', ') : ''}`
      );

      try {
        if (data.command === 'HOME') {
          const axis = data.params && data.params.length > 0 ? data.params[0] : 'ALL';
          
          const response = motionController.homeAxis(axis, (message) => {
            logDebug('socket', `Homing complete for ${axis}: ${message}`);
            addTerminalEntry(`< INFO: ${message}`);
            socket.emit('commandResponse', {
              command: 'HOME_COMPLETE',
              response: { status: 'OK', message },
              timestamp: new Date().toISOString(),
            });
            socket.emit('terminalOutput', systemState.terminalOutput);
          });
          
          // Make sure response exists before using it
          if (response && typeof response === 'object') {
            addTerminalEntry(`< ${response.status}: ${response.message}`);
            if (callback) {
              callback({
                success: response.status === 'OK',
                message: response.message
              });
            }
          } else {
            // Handle case where homeAxis doesn't return a response
            addTerminalEntry('< ERROR: Invalid response from homeAxis');
            if (callback) {
              callback({
                success: false,
                message: 'Invalid response from homeAxis'
              });
            }
          }
          
          socket.emit('terminalOutput', systemState.terminalOutput);
        } else if (data.command === 'MOVE') {
          if (data.params && data.params.length >= 3) {
            const targetPosition = {
              x: parseFloat(data.params[0]),
              y: parseFloat(data.params[1]),
              z: parseFloat(data.params[2]),
              pan:
                data.params.length > 3
                  ? parseFloat(data.params[3])
                  : systemState.position.pan,
              tilt:
                data.params.length > 4
                  ? parseFloat(data.params[4])
                  : systemState.position.tilt,
            };
            const response = motionController.moveToPosition(targetPosition);
            
            if (response && typeof response === 'object') {
              addTerminalEntry(`< ${response.status}: ${response.message}`);
              if (callback) {
                callback({
                  success: response.status === 'OK',
                  message: response.message
                });
              }
            } else {
              addTerminalEntry('< ERROR: Invalid response from moveToPosition');
              if (callback) {
                callback({
                  success: false,
                  message: 'Invalid response from moveToPosition'
                });
              }
            }
          } else {
            addTerminalEntry(`< ERROR: MISSING_PARAMS`);
            if (callback) callback({ success: false, message: 'MISSING_PARAMS' });
          }
          socket.emit('terminalOutput', systemState.terminalOutput);
        } else {
          // Additional commands can be processed here
          addTerminalEntry(`< WARNING: UNKNOWN_COMMAND: ${data.command}`);
          if (callback) callback({ 
            success: false, 
            message: `Unknown command: ${data.command}` 
          });
          socket.emit('terminalOutput', systemState.terminalOutput);
        }
      } catch (error) {
        console.error('Error handling command:', error);
        addTerminalEntry(`< ERROR: ${error.message || 'Unknown error processing command'}`);
        if (callback) callback({ 
          success: false, 
          message: error.message || 'Unknown error' 
        });
        socket.emit('terminalOutput', systemState.terminalOutput);
      }
    });

    // Clear terminal history event
    socket.on('clearTerminal', () => {
      logDebug('socket', 'Clearing terminal history');
      systemState.terminalOutput = [];
      socket.emit('terminalOutput', systemState.terminalOutput);
    });

    // Provide ClearCore info (e.g., static IP)
    socket.on('getClearCoreInfo', async () => {
      logDebug('socket', 'Getting ClearCore info');
      try {
        const dataService = require('./database/data-service');
        const settings = await dataService.getSettings();
        const ipAddress = settings ? settings.ethernet_static_ip : null;
        logDebug('socket', 'Sending ClearCore IP:', ipAddress);
        socket.emit('clearCoreInfo', { ipAddress });
      } catch (error) {
        console.error('Error fetching ClearCore IP:', error);
        socket.emit('clearCoreInfo', { ipAddress: null });
      }
    });
  });
}

module.exports = registerSocketHandlers;
