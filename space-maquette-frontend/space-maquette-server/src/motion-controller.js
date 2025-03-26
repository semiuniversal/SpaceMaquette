// motion-controller.js
const motionSim = require('./motion_sim');
const motionSolver = require('./motion-solver');
const { systemState } = require('./state');

// Process keyboard movement: use solver for physics then simulation for smooth interpolation.
function processKeyboardMovement(data) {
  // Calculate new position based on keyboard inputs.
  const newPosition = motionSolver.processKeyboardMovement(data);

  // Smoothly move to the new position using the simulation.
  motionSim.moveToPosition({
    x: newPosition.x,
    y: newPosition.y,
  });

  return newPosition;
}

// Process mouse look: compute new orientation then interpolate via motion_sim.
function processMouseLook(data) {
  const newOrientation = motionSolver.processMouseLook(data);

  // Smooth transition for pan and tilt.
  motionSim.moveToPosition({
    pan: newOrientation.pan,
    tilt: newOrientation.tilt,
  });

  return newOrientation;
}

// Re-export other motion_sim functions for button moves, homing, etc.
module.exports = {
  processKeyboardMovement,
  processMouseLook,
  executeButtonMovement: motionSim.executeButtonMovement,
  moveToPosition: motionSim.moveToPosition,
  homeAxis: motionSim.homeAxis,
  stopAllMotions: motionSim.stopAllMotions,
  setIo: motionSim.setIo,
};
