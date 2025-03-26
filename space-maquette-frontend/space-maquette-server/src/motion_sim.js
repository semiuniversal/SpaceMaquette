// src/motion_sim.js

const { systemState, updatePosition, updateSystemStatus } = require('./state');

// Store reference to io
let ioRef = null;

// Configuration for motion characteristics
const motionConfig = {
  // Acceleration/deceleration in units per second²
  acceleration: {
    x: 200,
    y: 200,
    z: 100,
    pan: 90, // degrees per second²
  },
  // Maximum velocities in units per second
  maxSpeed: {
    x: 300,
    y: 300,
    z: 150,
    pan: 90, // degrees per second
  },
  // Minimum move time in ms (for very small moves)
  minMoveTime: 200,
  // Update frequency in ms
  updateInterval: 50,
  // Step sizes for button movements
  steps: {
    x: 50,
    y: 50,
    z: 20,
    pan: 15,
    tilt: 5,
  },
};

// Active motion simulations
const activeMotions = {
  x: null,
  y: null,
  z: null,
  pan: null,
  tilt: null,
};

// Allow other modules to set the io reference
function setIo(io) {
  ioRef = io;
}

// Safely emit status updates
function emitStatus() {
  if (ioRef) {
    ioRef.emit('systemStatus', {
      ...systemState,
      _updateId: Date.now(), // Add unique ID to track updates
    });
  }
}

/**
 * Calculate motion profile with acceleration and deceleration
 */
function calculateMotionProfile(distance, maxSpeed, acceleration) {
  const absDistance = Math.abs(distance);
  const direction = Math.sign(distance);

  // Time to reach max speed
  const timeToMaxSpeed = maxSpeed / acceleration;

  // Distance covered during acceleration to max speed
  const accelDistance = 0.5 * acceleration * timeToMaxSpeed * timeToMaxSpeed;

  // Check if we can reach max speed
  if (accelDistance * 2 <= absDistance) {
    // Trapezoidal profile (reach max speed)
    const timeAtMaxSpeed = (absDistance - 2 * accelDistance) / maxSpeed;
    const totalTime = 2 * timeToMaxSpeed + timeAtMaxSpeed;

    return {
      canReachMaxSpeed: true,
      timeToMaxSpeed,
      timeAtMaxSpeed,
      totalTime,
      accelDistance,
      direction,
    };
  } else {
    // Triangular profile (never reach max speed)
    const peakTime = Math.sqrt(absDistance / acceleration);
    const peakSpeed = acceleration * peakTime;

    return {
      canReachMaxSpeed: false,
      peakTime,
      totalTime: 2 * peakTime,
      peakSpeed,
      direction,
    };
  }
}

/**
 * Calculate position at a given time in the motion profile
 */
function calculatePositionAtTime(startPos, time, profile, axis, distance) {
  const { direction } = profile;

  if (profile.canReachMaxSpeed) {
    const { timeToMaxSpeed, timeAtMaxSpeed, totalTime, accelDistance } =
      profile;
    const maxSpeed = motionConfig.maxSpeed[axis];

    if (time <= timeToMaxSpeed) {
      // Acceleration phase
      return (
        startPos +
        direction * 0.5 * motionConfig.acceleration[axis] * time * time
      );
    } else if (time <= timeToMaxSpeed + timeAtMaxSpeed) {
      // Constant speed phase
      const timeInConstantPhase = time - timeToMaxSpeed;
      return (
        startPos + direction * (accelDistance + maxSpeed * timeInConstantPhase)
      );
    } else if (time <= totalTime) {
      // Deceleration phase
      const timeInDecelPhase = time - timeToMaxSpeed - timeAtMaxSpeed;
      const distanceInDecelPhase =
        maxSpeed * timeInDecelPhase -
        0.5 *
          motionConfig.acceleration[axis] *
          timeInDecelPhase *
          timeInDecelPhase;
      return (
        startPos +
        direction *
          (accelDistance + maxSpeed * timeAtMaxSpeed + distanceInDecelPhase)
      );
    } else {
      // Past end of motion
      return startPos + distance;
    }
  } else {
    const { peakTime, totalTime, peakSpeed } = profile;

    if (time <= peakTime) {
      // Acceleration phase
      return (
        startPos +
        direction * 0.5 * motionConfig.acceleration[axis] * time * time
      );
    } else if (time <= totalTime) {
      // Deceleration phase
      const timeInDecelPhase = time - peakTime;
      const distanceInAccelPhase = 0.5 * peakSpeed * peakTime;
      const distanceInDecelPhase =
        peakSpeed * timeInDecelPhase -
        0.5 *
          motionConfig.acceleration[axis] *
          timeInDecelPhase *
          timeInDecelPhase;
      return (
        startPos + direction * (distanceInAccelPhase + distanceInDecelPhase)
      );
    } else {
      // Past end of motion
      return startPos + distance;
    }
  }
}

/**
 * Start a motion simulation for a specific axis
 */
function startAxisMotion(axis, targetPosition, onComplete = null) {
  stopAxisMotion(axis);

  const currentPosition = systemState.position[axis];
  let distance = targetPosition - currentPosition;

  // Handle pan's circular nature
  if (axis === 'pan') {
    // Find shortest path around the circle
    if (distance > 180) distance -= 360;
    if (distance < -180) distance += 360;
  }

  // Skip if no movement needed
  if (Math.abs(distance) < 0.01) {
    if (onComplete) onComplete();
    return;
  }

  // Special case for tilt which is instantaneous
  if (axis === 'tilt') {
    updatePosition({ [axis]: targetPosition });
    updateSystemStatus({ servoStatus: 'ACTIVE' });
    emitStatus();

    // Reset status after brief delay
    setTimeout(() => {
      updateSystemStatus({ servoStatus: 'IDLE' });
      emitStatus();
      if (onComplete) onComplete();
    }, 100);
    return;
  }

  // Calculate motion profile
  const profile = calculateMotionProfile(
    distance,
    motionConfig.maxSpeed[axis],
    motionConfig.acceleration[axis]
  );

  // Ensure minimum move time
  const totalTime = Math.max(
    profile.totalTime * 1000,
    motionConfig.minMoveTime
  );

  // Start tracking motion
  const startTime = Date.now();
  const startPos = currentPosition;

  // Update status
  updateSystemStatus({
    clearCoreStatus: 'MOVING',
    servoStatus: axis === 'pan' ? 'ACTIVE' : systemState.servoStatus,
  });
  emitStatus();

  console.log(
    `[MOTION_SIM] Starting motion for ${axis} from ${startPos} to ${targetPosition}, distance: ${distance}, duration: ${totalTime}ms`
  );

  // Create interval for updates
  activeMotions[axis] = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000; // seconds
    const progress = elapsed / (totalTime / 1000);

    if (progress >= 1) {
      // Motion complete
      updatePosition({ [axis]: targetPosition });
      emitStatus();
      stopAxisMotion(axis, onComplete);
    } else {
      // Update to intermediate position
      const currentPos = calculatePositionAtTime(
        startPos,
        elapsed,
        profile,
        axis,
        distance
      );

      // Special handling for pan to keep within 0-360 range
      if (axis === 'pan') {
        updatePosition({ [axis]: ((currentPos % 360) + 360) % 360 });
      } else {
        updatePosition({ [axis]: currentPos });
      }

      emitStatus();
    }
  }, motionConfig.updateInterval);
}

/**
 * Stop motion simulation for a specific axis
 */
function stopAxisMotion(axis, onComplete = null) {
  if (activeMotions[axis]) {
    clearInterval(activeMotions[axis]);
    activeMotions[axis] = null;

    // Only update status if no axes are moving
    if (!Object.values(activeMotions).some((motion) => motion !== null)) {
      updateSystemStatus({
        clearCoreStatus: 'READY',
        servoStatus: 'IDLE',
      });
      emitStatus();
    }

    if (onComplete) onComplete();
  }
}

/**
 * Move to an absolute position with simulated motion
 */
function moveToPosition(targetPosition) {
  // Don't allow movement if in E-STOP
  if (systemState.eStop) {
    return { status: 'ERROR', message: 'ESTOP_ACTIVE' };
  }

  console.log('[MOTION_SIM] Moving to position:', targetPosition);

  // Start motion for each axis that has a target
  Object.entries(targetPosition).forEach(([axis, target]) => {
    if (systemState.position[axis] !== undefined) {
      startAxisMotion(axis, target);
    }
  });

  return { status: 'OK', message: 'MOVE_STARTED' };
}

/**
 * Execute a button movement in a specific direction
 */
function executeButtonMovement(direction) {
  // Don't allow movement if in E-STOP
  if (systemState.eStop) {
    return { status: 'ERROR', message: 'ESTOP_ACTIVE' };
  }

  const { x, y, z, pan, tilt } = systemState.position;
  const { steps } = motionConfig;

  const newPosition = { ...systemState.position };

  switch (direction) {
    case 'x+':
      newPosition.x = Math.min(x + steps.x, 800);
      break;
    case 'x-':
      newPosition.x = Math.max(x - steps.x, 0);
      break;
    case 'y+':
      newPosition.y = Math.min(y + steps.y, 800);
      break;
    case 'y-':
      newPosition.y = Math.max(y - steps.y, 0);
      break;
    case 'z+':
      newPosition.z = Math.min(z + steps.z, 500);
      break;
    case 'z-':
      newPosition.z = Math.max(z - steps.z, 0);
      break;
    case 'pan+':
      // Calculate new pan value and normalize to 0-360
      newPosition.pan = (pan + steps.pan) % 360;
      break;
    case 'pan-':
      // Calculate new pan value and normalize to 0-360
      newPosition.pan = (((pan - steps.pan) % 360) + 360) % 360;
      break;
    case 'tilt+':
      newPosition.tilt = Math.min(tilt + steps.tilt, 135);
      break;
    case 'tilt-':
      newPosition.tilt = Math.max(tilt - steps.tilt, 45);
      break;
    default:
      return { status: 'ERROR', message: 'INVALID_DIRECTION' };
  }

  console.log(
    `[MOTION_SIM] Button movement ${direction}, target:`,
    newPosition
  );
  return moveToPosition(newPosition);
}
/**
 * Stop all active motions
 */
function stopAllMotions() {
  Object.keys(activeMotions).forEach((axis) => {
    stopAxisMotion(axis);
  });

  updateSystemStatus({ clearCoreStatus: 'READY', servoStatus: 'IDLE' });
  emitStatus();

  return { status: 'OK', message: 'ALL_MOTIONS_STOPPED' };
}

/**
 * Home a specific axis or all axes
 */
function homeAxis(axis, onComplete = null) {
  // Don't allow movement if in E-STOP
  if (systemState.eStop) {
    return { status: 'ERROR', message: 'ESTOP_ACTIVE' };
  }

  const homePositions = {
    X: { x: 0 },
    Y: { y: 0 },
    Z: { z: 0 },
  };

  updateSystemStatus({ clearCoreStatus: 'HOMING' });
  emitStatus();

  if (axis === 'ALL') {
    // Home Z first (for safety)
    moveToPosition({ z: 0 });

    setTimeout(() => {
      // After Z is homed, home X and Y
      moveToPosition({ x: 0, y: 0 });

      // Set homed flags
      systemState.homed = { x: true, y: true, z: true };

      setTimeout(() => {
        updateSystemStatus({ clearCoreStatus: 'READY' });
        emitStatus();
        if (onComplete) onComplete('All axes homed successfully');
      }, 2000); // Allow time for XY homing
    }, 2000); // Allow time for Z homing
  } else if (homePositions[axis]) {
    moveToPosition(homePositions[axis]);

    // Set homed flag for this axis
    systemState.homed[axis.toLowerCase()] = true;

    setTimeout(() => {
      updateSystemStatus({ clearCoreStatus: 'READY' });
      emitStatus();
      if (onComplete) onComplete(`${axis} axis homed successfully`);
    }, 2000); // Allow time for homing
  } else {
    return { status: 'ERROR', message: 'INVALID_AXIS' };
  }

  return { status: 'OK', message: 'HOMING_STARTED' };
}

module.exports = {
  setIo,
  moveToPosition,
  executeButtonMovement,
  stopAllMotions,
  homeAxis,
  motionConfig,
};
