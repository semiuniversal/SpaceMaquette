// motion-solver.js
const { systemState, updatePosition } = require('./state');
const fs = require('fs');
const path = require('path');
const logDebug = require('./logger');

let config;
try {
  const configFile = fs.readFileSync(
    path.join(__dirname, 'config', 'movementConfig.jsonc')
  );
  const configStr = configFile.toString().replace(/\/\/.*$/gm, '');
  config = JSON.parse(configStr);
  logDebug('motion-solver: Loaded movement config successfully.');
} catch (error) {
  logDebug('motion-solver: Error loading movement config:', error);
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

function logCurrentState() {
  logDebug('motion-solver: Current system state:', systemState);
}

function calculatePositionUpdate(
  x,
  y,
  yaw,
  pitch,
  vForward,
  vStrafe,
  deltaTime
) {
  logDebug('motion-solver: Calculating position update with inputs:', {
    x,
    y,
    yaw,
    pitch,
    vForward,
    vStrafe,
    deltaTime,
  });
  const forward = [
    Math.cos(yaw) * Math.cos(pitch),
    Math.sin(yaw) * Math.cos(pitch),
  ];
  const right = [-Math.sin(yaw), Math.cos(yaw)];
  const speed = config.keyboard.moveSpeed;
  const dx = (vForward * forward[0] + vStrafe * right[0]) * speed * deltaTime;
  const dy = (vForward * forward[1] + vStrafe * right[1]) * speed * deltaTime;
  logDebug('motion-solver: Computed displacement dx, dy:', dx, dy);
  return { x: x + dx, y: y + dy };
}

function processKeyboardMovement(data) {
  logDebug('motion-solver: Processing keyboard movement:', data);
  const { forward, strafe, deltaTime } = data;
  const { x, y, pan, tilt } = systemState.position;
  const yaw = (pan * Math.PI) / 180;
  const pitch = (tilt * Math.PI) / 180;
  const newPos = calculatePositionUpdate(
    x,
    y,
    yaw,
    pitch,
    forward,
    strafe,
    deltaTime
  );

  if (config.collision.enabled) {
    newPos.x = Math.max(0, Math.min(newPos.x, 800));
    newPos.y = Math.max(0, Math.min(newPos.y, 800));
  }

  logDebug('motion-solver: New position calculated:', newPos);
  updatePosition({ x: newPos.x, y: newPos.y });
  logCurrentState();
  return systemState.position;
}

function processMouseLook(data) {
  logDebug('motion-solver: Processing mouse look:', data);
  const { deltaX, deltaY } = data;
  const { pan, tilt } = systemState.position;
  let newPan = pan + deltaX * config.keyboard.rotationSpeed;
  newPan = ((newPan % 360) + 360) % 360;
  let newTilt = tilt - deltaY * config.keyboard.rotationSpeed;
  newTilt = Math.max(
    config.keyboard.tiltConstraints.min,
    Math.min(config.keyboard.tiltConstraints.max, newTilt)
  );
  logDebug('motion-solver: Computed new pan and tilt:', newPan, newTilt);
  updatePosition({ pan: newPan, tilt: newTilt });
  logCurrentState();
  return { pan: newPan, tilt: newTilt };
}

function processButtonMovement(direction) {
  logDebug(
    'motion-solver: Processing button movement in direction:',
    direction
  );
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
      logDebug('motion-solver: Unknown button movement direction:', direction);
      break;
  }
  logDebug(
    'motion-solver: New target position for button movement:',
    newPosition
  );
  updatePosition(newPosition);
  logCurrentState();
  return systemState.position;
}

module.exports = {
  processKeyboardMovement,
  processMouseLook,
  processButtonMovement,
  calculatePositionUpdate,
};
