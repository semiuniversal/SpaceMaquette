// motion-controller.js
const motionSim = require('./motion_sim');
const motionSolver = require('./motion-solver');
const { systemState } = require('./state');
const { logDebug } = require('./logger');

function processKeyboardMovement(data) {
  logDebug('motion-controller', 'Received keyboard movement data:', data);
  const newPosition = motionSolver.processKeyboardMovement(data);
  logDebug(
    'motion-controller',
    'Computed new position from motion-solver:',
    newPosition
  );
  const response = motionSim.moveToPosition({
    x: newPosition.x,
    y: newPosition.y,
  });
  logDebug('motion-controller', 'Called moveToPosition, response:', response);
  return newPosition;
}

function processMouseLook(data) {
  logDebug('motion-controller', 'Received mouse look data:', data);
  const newOrientation = motionSolver.processMouseLook(data);
  logDebug(
    'motion-controller',
    'Computed new orientation from motion-solver:',
    newOrientation
  );
  const response = motionSim.moveToPosition({
    pan: newOrientation.pan,
    tilt: newOrientation.tilt,
  });
  logDebug(
    'motion-controller',
    'Called moveToPosition for mouse look, response:',
    response
  );
  return newOrientation;
}

module.exports = {
  processKeyboardMovement,
  processMouseLook,
  executeButtonMovement: motionSim.executeButtonMovement,
  moveToPosition: motionSim.moveToPosition,
  homeAxis: motionSim.homeAxis,
  stopAllMotions: motionSim.stopAllMotions,
  setIo: motionSim.setIo,
};
