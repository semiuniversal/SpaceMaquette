// space-maquette-server/src/motion-solver.js

const { systemState, updatePosition } = require('./state');
const fs = require('fs');
const path = require('path');

// Load movement configuration
let config;
try {
  const configFile = fs.readFileSync(
    path.join(__dirname, 'config', 'movementConfig.jsonc')
  );
  // Remove comments before parsing JSON
  const configStr = configFile.toString().replace(/\/\/.*$/gm, '');
  config = JSON.parse(configStr);
} catch (error) {
  console.error('Error loading movement config:', error);
  // Default configuration as fallback
  config = {
    keyboard: {
      moveSpeed: 100,
      rotationSpeed: 0.2,
      tiltConstraints: { min: 45, max: 135 },
      acceleration: 2.0,
      deceleration: 3.0,
    },
    motion: {
      xyStep: 50,
      zStep: 20,
      panStep: 15,
      tiltStep: 5,
    },
    collision: {
      enabled: true,
      margin: 30,
    },
  };
}

// Debug function
function logDebug(...args) {
  console.log(`[MOTION-SOLVER ${new Date().toISOString()}]`, ...args);
}

/**
 * Calculate new position based on movement inputs
 * @param {number} x - Current X position
 * @param {number} y - Current Y position
 * @param {number} yaw - Current yaw angle (radians)
 * @param {number} pitch - Current pitch angle (radians)
 * @param {number} vForward - Forward velocity (-1 to 1)
 * @param {number} vStrafe - Strafe velocity (-1 to 1)
 * @param {number} deltaTime - Time since last update (seconds)
 * @returns {Object} New position {x, y}
 */
function calculatePositionUpdate(
  x,
  y,
  yaw,
  pitch,
  vForward,
  vStrafe,
  deltaTime
) {
  // Calculate directional basis vectors
  const forward = [
    Math.cos(yaw) * Math.cos(pitch),
    Math.sin(yaw) * Math.cos(pitch),
  ];

  const right = [-Math.sin(yaw), Math.cos(yaw)];

  // Scale by move speed
  const speed = config.keyboard.moveSpeed;

  // Compute displacement
  const dx = (vForward * forward[0] + vStrafe * right[0]) * speed * deltaTime;
  const dy = (vForward * forward[1] + vStrafe * right[1]) * speed * deltaTime;

  // Return new position
  return { x: x + dx, y: y + dy };
}

/**
 * Process keyboard movement command
 * @param {Object} data - Movement data
 * @param {number} data.forward - Forward velocity (-1 to 1)
 * @param {number} data.strafe - Strafe velocity (-1 to 1)
 * @param {number} data.deltaTime - Time since last update (seconds)
 * @returns {Object} Updated position
 */
function processKeyboardMovement(data) {
  const { forward, strafe, deltaTime } = data;

  // Get current position and orientation
  const { x, y, pan, tilt } = systemState.position;

  // Convert angles from degrees to radians
  const yaw = (pan * Math.PI) / 180;
  const pitch = (tilt * Math.PI) / 180;

  // Calculate new position
  const newPos = calculatePositionUpdate(
    x,
    y,
    yaw,
    pitch,
    forward,
    strafe,
    deltaTime
  );

  // Apply collision detection if enabled
  if (config.collision.enabled) {
    // Check boundaries and apply limits
    // This is a placeholder for actual collision logic
    newPos.x = Math.max(0, Math.min(newPos.x, 800));
    newPos.y = Math.max(0, Math.min(newPos.y, 800));
  }

  // Update system state
  updatePosition({
    x: newPos.x,
    y: newPos.y,
  });

  return systemState.position;
}

/**
 * Process mouse look command
 * @param {Object} data - Look data
 * @param {number} data.deltaX - Mouse X movement
 * @param {number} data.deltaY - Mouse Y movement
 * @returns {Object} Updated orientation
 */
function processMouseLook(data) {
  const { deltaX, deltaY } = data;

  // Get current orientation
  const { pan, tilt } = systemState.position;

  // Calculate new pan (yaw)
  let newPan = pan + deltaX * config.keyboard.rotationSpeed;

  // Normalize pan to 0-360 degrees
  newPan = ((newPan % 360) + 360) % 360;

  // Calculate new tilt (pitch) with constraints
  let newTilt = tilt - deltaY * config.keyboard.rotationSpeed;
  newTilt = Math.max(
    config.keyboard.tiltConstraints.min,
    Math.min(config.keyboard.tiltConstraints.max, newTilt)
  );

  // Update system state
  updatePosition({
    pan: newPan,
    tilt: newTilt,
  });

  return { pan: newPan, tilt: newTilt };
}

/**
 * Process button movement command
 * @param {string} direction - Movement direction
 * @returns {Object} Updated position
 */
function processButtonMovement(direction) {
  const { x, y, z, pan, tilt } = systemState.position;
  const newPosition = { ...systemState.position };

  switch (direction) {
    case 'x+':
      newPosition.x = x + config.motion.xyStep;
      break;
    case 'x-':
      newPosition.x = x - config.motion.xyStep;
      break;
    case 'y+':
      newPosition.y = y + config.motion.xyStep;
      break;
    case 'y-':
      newPosition.y = y - config.motion.xyStep;
      break;
    case 'z+':
      newPosition.z = z + config.motion.zStep;
      break;
    case 'z-':
      newPosition.z = z - config.motion.zStep;
      break;
    case 'pan+':
      newPosition.pan = (pan + config.motion.panStep) % 360;
      break;
    case 'pan-':
      newPosition.pan = (((pan - config.motion.panStep) % 360) + 360) % 360;
      break;
    case 'tilt+':
      newPosition.tilt = Math.min(
        config.keyboard.tiltConstraints.max,
        tilt + config.motion.tiltStep
      );
      break;
    case 'tilt-':
      newPosition.tilt = Math.max(
        config.keyboard.tiltConstraints.min,
        tilt - config.motion.tiltStep
      );
      break;
    default:
      // No change for unknown directions
      break;
  }

  // Apply collision detection if enabled
  if (config.collision.enabled) {
    // Simple boundary checks
    newPosition.x = Math.max(0, Math.min(newPosition.x, 800));
    newPosition.y = Math.max(0, Math.min(newPosition.y, 800));
    newPosition.z = Math.max(0, Math.min(newPosition.z, 500));
  }

  updatePosition(newPosition);
  return systemState.position;
}

module.exports = {
  processKeyboardMovement,
  processMouseLook,
  processButtonMovement,
  calculatePositionUpdate,
};
