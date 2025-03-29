// motion_sim.js
const { systemState, updatePosition, updateSystemStatus } = require('./state');
const { logDebug } = require('./logger');

let ioRef = null;

const motionConfig = {
  acceleration: {
    x: 200,
    y: 200,
    z: 100,
    pan: 90, // degrees per second²
  },
  maxSpeed: {
    x: 300,
    y: 300,
    z: 150,
    pan: 90, // degrees per second
  },
  minMoveTime: 200, // in ms
  updateInterval: 50, // in ms
  steps: {
    x: 50,
    y: 50,
    z: 20,
    pan: 15,
    tilt: 5,
  },
};

const activeMotions = {
  x: null,
  y: null,
  z: null,
  pan: null,
  tilt: null,
};

function setIo(io) {
  ioRef = io;
  logDebug('motion_sim: IO reference set.');
}

function emitStatus() {
  if (ioRef) {
    logDebug('motion_sim: Emitting system status', systemState);
    ioRef.emit('systemStatus', {
      ...systemState,
      _updateId: Date.now(),
    });
  } else {
    logDebug('motion_sim: No IO reference set. Cannot emit status.');
  }
}

function calculateMotionProfile(distance, maxSpeed, acceleration) {
  logDebug(
    'motion_sim: Calculating motion profile for distance:',
    distance,
    'maxSpeed:',
    maxSpeed,
    'acceleration:',
    acceleration
  );
  const absDistance = Math.abs(distance);
  const direction = Math.sign(distance);
  const timeToMaxSpeed = maxSpeed / acceleration;
  const accelDistance = 0.5 * acceleration * timeToMaxSpeed * timeToMaxSpeed;

  if (accelDistance * 2 <= absDistance) {
    const timeAtMaxSpeed = (absDistance - 2 * accelDistance) / maxSpeed;
    const totalTime = 2 * timeToMaxSpeed + timeAtMaxSpeed;
    logDebug('motion_sim: Trapezoidal profile computed:', {
      timeToMaxSpeed,
      timeAtMaxSpeed,
      totalTime,
      accelDistance,
      direction,
    });
    return {
      canReachMaxSpeed: true,
      timeToMaxSpeed,
      timeAtMaxSpeed,
      totalTime,
      accelDistance,
      direction,
    };
  } else {
    const peakTime = Math.sqrt(absDistance / acceleration);
    const peakSpeed = acceleration * peakTime;
    logDebug('motion_sim: Triangular profile computed:', {
      peakTime,
      totalTime: 2 * peakTime,
      peakSpeed,
      direction,
    });
    return {
      canReachMaxSpeed: false,
      peakTime,
      totalTime: 2 * peakTime,
      peakSpeed,
      direction,
    };
  }
}

function calculatePositionAtTime(startPos, time, profile, axis, distance) {
  logDebug(`motion_sim: Calculating ${axis} position at time ${time}s`);
  const { direction } = profile;
  let pos;

  if (profile.canReachMaxSpeed) {
    const { timeToMaxSpeed, timeAtMaxSpeed, totalTime, accelDistance } =
      profile;
    const maxSpeed = motionConfig.maxSpeed[axis];

    if (time <= timeToMaxSpeed) {
      pos =
        startPos +
        direction * 0.5 * motionConfig.acceleration[axis] * time * time;
      logDebug(`motion_sim: ${axis} acceleration phase, pos: ${pos}`);
      return pos;
    } else if (time <= timeToMaxSpeed + timeAtMaxSpeed) {
      const timeInConstantPhase = time - timeToMaxSpeed;
      pos =
        startPos + direction * (accelDistance + maxSpeed * timeInConstantPhase);
      logDebug(`motion_sim: ${axis} constant speed phase, pos: ${pos}`);
      return pos;
    } else if (time <= totalTime) {
      const timeInDecelPhase = time - timeToMaxSpeed - timeAtMaxSpeed;
      const distanceInDecelPhase =
        maxSpeed * timeInDecelPhase -
        0.5 *
          motionConfig.acceleration[axis] *
          timeInDecelPhase *
          timeInDecelPhase;
      pos =
        startPos +
        direction *
          (accelDistance + maxSpeed * timeAtMaxSpeed + distanceInDecelPhase);
      logDebug(`motion_sim: ${axis} deceleration phase, pos: ${pos}`);
      return pos;
    } else {
      pos = startPos + distance;
      logDebug(`motion_sim: ${axis} motion complete, pos: ${pos}`);
      return pos;
    }
  } else {
    const { peakTime, totalTime, peakSpeed } = profile;
    if (time <= peakTime) {
      pos =
        startPos +
        direction * 0.5 * motionConfig.acceleration[axis] * time * time;
      logDebug(
        `motion_sim: ${axis} triangular acceleration phase, pos: ${pos}`
      );
      return pos;
    } else if (time <= totalTime) {
      const timeInDecelPhase = time - peakTime;
      const distanceInAccelPhase = 0.5 * peakSpeed * peakTime;
      const distanceInDecelPhase =
        peakSpeed * timeInDecelPhase -
        0.5 *
          motionConfig.acceleration[axis] *
          timeInDecelPhase *
          timeInDecelPhase;
      pos =
        startPos + direction * (distanceInAccelPhase + distanceInDecelPhase);
      logDebug(
        `motion_sim: ${axis} triangular deceleration phase, pos: ${pos}`
      );
      return pos;
    } else {
      pos = startPos + distance;
      logDebug(`motion_sim: ${axis} triangular motion complete, pos: ${pos}`);
      return pos;
    }
  }
}

function startAxisMotion(axis, targetPosition, onComplete = null) {
  logDebug(
    `motion_sim: Starting motion for axis "${axis}" to target ${targetPosition}`
  );
  stopAxisMotion(axis);

  const currentPosition = systemState.position[axis];
  let distance = targetPosition - currentPosition;

  // Adjust for circular nature on pan
  if (axis === 'pan') {
    if (distance > 180) distance -= 360;
    if (distance < -180) distance += 360;
    logDebug(`motion_sim: Adjusted pan distance: ${distance}`);
  }

  if (Math.abs(distance) < 0.01) {
    logDebug(
      `motion_sim: No significant movement for axis "${axis}" (distance: ${distance})`
    );
    if (onComplete) onComplete();
    return;
  }

  // Instant update for tilt
  if (axis === 'tilt') {
    updatePosition({ [axis]: targetPosition });
    updateSystemStatus({ servoStatus: 'ACTIVE' });
    emitStatus();
    logDebug(`motion_sim: Instant tilt set to ${targetPosition}`);
    setTimeout(() => {
      updateSystemStatus({ servoStatus: 'IDLE' });
      emitStatus();
      if (onComplete) onComplete();
    }, 100);
    return;
  }

  const profile = calculateMotionProfile(
    distance,
    motionConfig.maxSpeed[axis],
    motionConfig.acceleration[axis]
  );
  const totalTime = Math.max(
    profile.totalTime * 1000,
    motionConfig.minMoveTime
  );
  logDebug(
    `motion_sim: Motion profile for axis "${axis}" determined:`,
    profile,
    `Total time: ${totalTime}ms`
  );

  const startTime = Date.now();
  const startPos = currentPosition;

  updateSystemStatus({
    clearCoreStatus: 'MOVING',
    servoStatus: axis === 'pan' ? 'ACTIVE' : systemState.servoStatus,
  });
  emitStatus();

  logDebug(
    `[MOTION_SIM] Initiating motion for ${axis}: start=${startPos}, target=${targetPosition}, duration=${totalTime}ms`
  );

  activeMotions[axis] = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000; // seconds
    const progress = elapsed / (totalTime / 1000);

    if (progress >= 1) {
      updatePosition({ [axis]: targetPosition });
      emitStatus();
      stopAxisMotion(axis, onComplete);
      logDebug(`motion_sim: Motion complete for axis "${axis}"`);
    } else {
      const currentPos = calculatePositionAtTime(
        startPos,
        elapsed,
        profile,
        axis,
        distance
      );
      if (axis === 'pan') {
        updatePosition({ [axis]: ((currentPos % 360) + 360) % 360 });
      } else {
        updatePosition({ [axis]: currentPos });
      }
      emitStatus();
      logDebug(`motion_sim: Updated ${axis} position: ${currentPos}`);
    }
  }, motionConfig.updateInterval);
}

function stopAxisMotion(axis, onComplete = null) {
  if (activeMotions[axis]) {
    clearInterval(activeMotions[axis]);
    activeMotions[axis] = null;
    logDebug(`motion_sim: Stopped motion for axis "${axis}"`);
    if (!Object.values(activeMotions).some((motion) => motion !== null)) {
      updateSystemStatus({
        clearCoreStatus: 'READY',
        servoStatus: 'IDLE',
      });
      emitStatus();
      logDebug('motion_sim: All motions stopped. System set to READY.');
    }
    if (onComplete) onComplete();
  } else {
    logDebug(`motion_sim: No active motion for axis "${axis}" to stop.`);
  }
}

function moveToPosition(targetPosition) {
  if (systemState.eStop) {
    logDebug('motion_sim: E-STOP active. Movement aborted.');
    return { status: 'ERROR', message: 'ESTOP_ACTIVE' };
  }

  logDebug('motion_sim: moveToPosition called with target:', targetPosition);
  Object.entries(targetPosition).forEach(([axis, target]) => {
    if (systemState.position[axis] !== undefined) {
      startAxisMotion(axis, target);
      logDebug(
        `motion_sim: Initiated motion for axis "${axis}" to target ${target}`
      );
    }
  });

  return { status: 'OK', message: 'MOVE_STARTED' };
}

function executeButtonMovement(direction) {
  if (systemState.eStop) {
    logDebug('motion_sim: E-STOP active. Button movement aborted.');
    return { status: 'ERROR', message: 'ESTOP_ACTIVE' };
  }

  logDebug(`motion_sim: Executing button movement in direction "${direction}"`);
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
      newPosition.pan = (pan + steps.pan) % 360;
      break;
    case 'pan-':
      newPosition.pan = (((pan - steps.pan) % 360) + 360) % 360;
      break;
    case 'tilt+':
      newPosition.tilt = Math.min(tilt + steps.tilt, 135);
      break;
    case 'tilt-':
      newPosition.tilt = Math.max(tilt - steps.tilt, 45);
      break;
    default:
      logDebug('motion_sim: Invalid button movement direction:', direction);
      return { status: 'ERROR', message: 'INVALID_DIRECTION' };
  }

  logDebug(
    'motion_sim: New target position after button movement:',
    newPosition
  );
  return moveToPosition(newPosition);
}

function stopAllMotions() {
  logDebug('motion_sim: Stopping all motions.');
  Object.keys(activeMotions).forEach((axis) => {
    stopAxisMotion(axis);
  });

  updateSystemStatus({ clearCoreStatus: 'READY', servoStatus: 'IDLE' });
  emitStatus();

  return { status: 'OK', message: 'ALL_MOTIONS_STOPPED' };
}

function homeAxis(axis, onComplete = null) {
  if (systemState.eStop) {
    logDebug('motion_sim: E-STOP active. Homing aborted.');
    return { status: 'ERROR', message: 'ESTOP_ACTIVE' };
  }

  logDebug(`motion_sim: Starting homing for axis "${axis}"`);
  const homePositions = {
    X: { x: 0 },
    Y: { y: 0 },
    Z: { z: 0 },
  };

  updateSystemStatus({ clearCoreStatus: 'HOMING' });
  emitStatus();

  if (axis === 'ALL') {
    logDebug('motion_sim: Homing ALL axes. Homing Z first.');
    moveToPosition({ z: 0 });
    setTimeout(() => {
      logDebug('motion_sim: Homing X and Y axes.');
      moveToPosition({ x: 0, y: 0 });
      systemState.homed = { x: true, y: true, z: true };
      setTimeout(() => {
        updateSystemStatus({ clearCoreStatus: 'READY' });
        emitStatus();
        logDebug('motion_sim: All axes homed successfully.');
        if (onComplete) onComplete('All axes homed successfully');
      }, 2000);
    }, 2000);
  } else if (homePositions[axis]) {
    logDebug(`motion_sim: Homing axis "${axis}"`);
    moveToPosition(homePositions[axis]);
    systemState.homed[axis.toLowerCase()] = true;
    setTimeout(() => {
      updateSystemStatus({ clearCoreStatus: 'READY' });
      emitStatus();
      logDebug(`motion_sim: Axis "${axis}" homed successfully.`);
      if (onComplete) onComplete(`${axis} axis homed successfully`);
    }, 2000);
  } else {
    logDebug('motion_sim: Invalid axis provided for homing:', axis);
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
