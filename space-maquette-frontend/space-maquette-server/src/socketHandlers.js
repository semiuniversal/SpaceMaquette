// socketHandlers.js
const motionController = require('./motion-controller');
const { systemState, addTerminalEntry } = require('./state');
const logDebug = require('./logger'); // Ensure you have a logger module or replace with console.log

function registerSocketHandlers(io) {
  // Set the io reference for motion simulation through the motion controller
  motionController.setIo(io);

  io.on('connection', (socket) => {
    logDebug('New client connected:', socket.id);

    // Send initial system status
    socket.emit('systemStatus', {
      ...systemState,
      _updateId: Date.now(),
    });

    // Handle keyboard movement using motion controller
    socket.on('keyboard_movement', (data) => {
      if (systemState.eStop) return;
      logDebug('Keyboard movement received:', data);

      const newPos = motionController.processKeyboardMovement(data);
      io.emit('systemStatus', { ...systemState, _updateId: Date.now() });
    });

    // Handle mouse look using motion controller
    socket.on('mouse_look', (data) => {
      if (systemState.eStop) return;
      logDebug('Mouse look received:', data);

      const newOrient = motionController.processMouseLook(data);
      io.emit('systemStatus', { ...systemState, _updateId: Date.now() });
    });

    // Handle button movement (for discrete direction changes)
    socket.on('button_movement', (data) => {
      if (systemState.eStop) {
        logDebug('Ignoring button movement: ESTOP active');
        return;
      }
      logDebug('Button movement received:', data.direction);
      if (data.direction === 'stop') {
        logDebug('Stopping all motions');
        motionController.stopAllMotions();
      } else {
        motionController.executeButtonMovement(data.direction);
      }
    });

    // Handle command requests (e.g., HOME, MOVE, etc.)
    socket.on('command', (data, callback) => {
      logDebug('Received command:', data);
      addTerminalEntry(
        `> ${data.command}${data.params && data.params.length ? ': ' + data.params.join(', ') : ''}`
      );

      if (data.command === 'HOME') {
        const axis = data.params[0] || 'ALL';
        const response = motionController.homeAxis(axis, (message) => {
          logDebug(`Homing complete for ${axis}: ${message}`);
          addTerminalEntry(`< INFO: ${message}`);
          socket.emit('commandResponse', {
            command: 'HOME_COMPLETE',
            response: { status: 'OK', message },
            timestamp: new Date().toISOString(),
          });
          socket.emit('terminalOutput', systemState.terminalOutput);
        });
        addTerminalEntry(`< ${response.status}: ${response.message}`);
        if (callback)
          callback({
            success: response.status === 'OK',
            message: response.message,
          });
        socket.emit('terminalOutput', systemState.terminalOutput);
      } else if (data.command === 'MOVE') {
        if (data.params.length >= 3) {
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
          addTerminalEntry(`< ${response.status}: ${response.message}`);
          if (callback)
            callback({
              success: response.status === 'OK',
              message: response.message,
            });
        } else {
          addTerminalEntry(`< ERROR: MISSING_PARAMS`);
          if (callback) callback({ success: false, message: 'MISSING_PARAMS' });
        }
        socket.emit('terminalOutput', systemState.terminalOutput);
      } else {
        // Additional commands can be processed here
      }
    });

    // Clear terminal history event
    socket.on('clearTerminal', () => {
      logDebug('Clearing terminal history');
      systemState.terminalOutput = [];
      socket.emit('terminalOutput', systemState.terminalOutput);
    });

    // Provide ClearCore info (e.g., static IP)
    socket.on('getClearCoreInfo', async () => {
      logDebug('Getting ClearCore info');
      try {
        const dataService = require('./database/data-service');
        const settings = await dataService.getSettings();
        const ipAddress = settings ? settings.ethernet_static_ip : null;
        logDebug('Sending ClearCore IP:', ipAddress);
        socket.emit('clearCoreInfo', { ipAddress });
      } catch (error) {
        console.error('Error fetching ClearCore IP:', error);
        socket.emit('clearCoreInfo', { ipAddress: null });
      }
    });
  });
}

module.exports = registerSocketHandlers;
