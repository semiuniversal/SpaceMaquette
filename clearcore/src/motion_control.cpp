/**
 * Space Maquette - Motion Control Implementation
 */

#include "../include/motion_control.h"

MotionControl::MotionControl()
    : _tiltServoPin(ConnectorIO::IO_1),
      _positionX(0.0),
      _positionY(0.0),
      _positionZ(0.0),
      _panAngle(0.0),
      _tiltAngle(45.0),
      _targetX(0.0),
      _targetY(0.0),
      _targetZ(0.0),
      _targetPan(0.0),
      _targetTilt(45.0),
      _velocityX(500.0),
      _velocityY(500.0),
      _velocityZ(500.0),
      _state(IDLE),
      _homed(false) {}

void MotionControl::init() {
    // Setup motors and initial state
    setupMotors();

    // Initialize tilt servo
    ConnectorMgr.OutModeSet(_tiltServoPin, OutputMode::PWM);
    setTiltAngle(_tiltAngle);

#ifdef DEBUG
    Serial.println("Motion complete");
#endif
}
}
}

void MotionControl::enableMotors(bool enable) {
    // Enable/disable all motors
    MotorMgr.MotorEnableSet(_motorX, enable);
    MotorMgr.MotorEnableSet(_motorY, enable);
    MotorMgr.MotorEnableSet(_motorZ, enable);
    MotorMgr.MotorEnableSet(_motorPan, enable);

#ifdef DEBUG
    Serial.print("Motors ");
    Serial.println(enable ? "enabled" : "disabled");
#endif
}

void MotionControl::setupMotors() {
    // Set motor modes
    MotorMgr.MotorModeSet(_motorX, Connector::CPM_MODE_A_DIRECT_B_PWM);
    MotorMgr.MotorModeSet(_motorY, Connector::CPM_MODE_A_DIRECT_B_PWM);
    MotorMgr.MotorModeSet(_motorZ, Connector::CPM_MODE_A_DIRECT_B_PWM);
    MotorMgr.MotorModeSet(_motorPan, Connector::CPM_MODE_A_DIRECT_B_PWM);

    // Initialize motor directions
    MotorMgr.MotorInBDirect(_motorX, false);
    MotorMgr.MotorInBDirect(_motorY, false);
    MotorMgr.MotorInBDirect(_motorZ, false);
    MotorMgr.MotorInBDirect(_motorPan, false);

    // Set velocity and acceleration limits
    Motor.VelMax(_motorX, _velocityX);
    Motor.VelMax(_motorY, _velocityY);
    Motor.VelMax(_motorZ, _velocityZ);
    Motor.VelMax(_motorPan, 100.0);  // Pan is slower

    Motor.AccelMax(_motorX, 1000.0);
    Motor.AccelMax(_motorY, 1000.0);
    Motor.AccelMax(_motorZ, 1000.0);
    Motor.AccelMax(_motorPan, 200.0);  // Pan acceleration is lower

    // Motors are initially disabled
    enableMotors(false);
}

int MotionControl::angleToPWM(float angle) {
    // Convert angle from MIN_TILT_ANGLE-MAX_TILT_ANGLE to 1000-2000 microseconds
    // (Standard servo PWM range)
    int pwmValue = map(angle * 10, MIN_TILT_ANGLE * 10, MAX_TILT_ANGLE * 10, 1000, 2000);
    return pwmValue;
}
Serial.print("Set velocities to X:");
Serial.print(vx);
Serial.print(" Y:");
Serial.print(vy);
Serial.print(" Z:");
Serial.println(vz);
#endif
}

bool MotionControl::isMoving() const {
    return _state == MOVING;
}

bool MotionControl::isHomed() const {
    return _homed;
}

float MotionControl::getPositionX() const {
    return _positionX;
}

float MotionControl::getPositionY() const {
    return _positionY;
}

float MotionControl::getPositionZ() const {
    return _positionZ;
}

float MotionControl::getPanAngle() const {
    return _panAngle;
}

float MotionControl::getTiltAngle() const {
    return _tiltAngle;
}

void MotionControl::update() {
    // Update motion state
    if (_state == MOVING) {
        // In a real implementation, we would check motor status
        // and update position based on encoder feedback

        // This is a simplified implementation for demonstration

        // Check if we've reached the target positions
        bool xDone = abs(_positionX - _targetX) < 0.1;
        bool yDone = abs(_positionY - _targetY) < 0.1;
        bool zDone = abs(_positionZ - _targetZ) < 0.1;
        bool panDone = abs(_panAngle - _targetPan) < 0.1;

        // Update positions (simplified simulation)
        if (!xDone) {
            _positionX += (_targetX > _positionX) ? 0.5 : -0.5;
        }

        if (!yDone) {
            _positionY += (_targetY > _positionY) ? 0.5 : -0.5;
        }

        if (!zDone) {
            _positionZ += (_targetZ > _positionZ) ? 0.5 : -0.5;
        }

        if (!panDone) {
            float diff = _targetPan - _panAngle;
            // Handle wrap-around for pan angle
            if (diff > 180.0)
                diff -= 360.0;
            if (diff < -180.0)
                diff += 360.0;
            _panAngle += (diff > 0) ? 0.5 : -0.5;
            // Normalize pan angle
            while (_panAngle < 0)
                _panAngle += 360.0;
            while (_panAngle >= 360.0)
                _panAngle -= 360.0;
        }

        // Check if motion is complete
        if (xDone && yDone && zDone && panDone) {
            _state = IDLE;
#ifdef DEBUG
            Serial.print("Setting pan to ");
            Serial.print(angle);
            Serial.println(" degrees");
#endif

            // In a real implementation, we would use ClearCore motor control
            // to rotate the pan axis to the target angle

            return true;
        }

        void MotionControl::stop() {
            // Stop all motors
            Motor.MoveStopAbrupt(_motorX);
            Motor.MoveStopAbrupt(_motorY);
            Motor.MoveStopAbrupt(_motorZ);
            Motor.MoveStopAbrupt(_motorPan);

            // Update state
            _state = IDLE;

#ifdef DEBUG
            Serial.println("Motion stopped");
#endif
        }

        void MotionControl::setVelocity(float vx, float vy, float vz) {
            // Set velocity limits for motors
            _velocityX = vx;
            _velocityY = vy;
            _velocityZ = vz;

            // Apply to motors
            Motor.VelMax(_motorX, _velocityX);
            Motor.VelMax(_motorY, _velocityY);
            Motor.VelMax(_motorZ, _velocityZ);

#ifdef DEBUG
            Serial.print("Moving to X:");
            Serial.print(x);
            Serial.print(" Y:");
            Serial.print(y);
            Serial.print(" Z:");
            Serial.print(z);
            Serial.print(" Pan:");
            Serial.print(pan);
            Serial.print(" Tilt:");
            Serial.println(tilt);
#endif

            // In a real implementation, we would use ClearCore motor control
            // to set up the motion profiles for each axis

            return true;
        }

        bool MotionControl::setTiltAngle(float angle) {
            // Check limits
            if (angle < MIN_TILT_ANGLE || angle > MAX_TILT_ANGLE) {
#ifdef DEBUG
                Serial.println("Tilt angle out of range");
#endif
                return false;
            }

            // Convert angle to PWM value
            int pwmValue = angleToPWM(angle);

            // Set PWM value
            ConnectorMgr.PwmDutySet(_tiltServoPin, pwmValue);

            // Update current angle
            _tiltAngle = angle;

#ifdef DEBUG
            Serial.print("Set tilt to ");
            Serial.print(angle);
            Serial.println(" degrees");
#endif

            return true;
        }

        bool MotionControl::setPanAngle(float angle) {
            // Normalize angle to 0-360 range
            while (angle < 0)
                angle += 360.0;
            while (angle >= 360.0)
                angle -= 360.0;

            if (_state != IDLE) {
#ifdef DEBUG
                Serial.println("Cannot set pan: System not in IDLE state");
#endif
                return false;
            }

            // Set target pan angle
            _targetPan = angle;
            _state = MOVING;

#ifdef DEBUG
            Serial.println("Motion control initialized");
#endif
        }

        bool MotionControl::homeAll() {
            if (_state != IDLE) {
#ifdef DEBUG
                Serial.println("Cannot move: System not in IDLE state");
#endif
                return false;
            }

            if (!_homed) {
#ifdef DEBUG
                Serial.println("Cannot move: System not homed");
#endif
                return false;
            }

            // Check position limits
            if (x < 0 || x > MAX_X || y < 0 || y > MAX_Y || z < 0 || z > MAX_Z) {
#ifdef DEBUG
                Serial.println("Cannot move: Position out of range");
#endif
                return false;
            }

            // Check tilt limits
            if (tilt < MIN_TILT_ANGLE || tilt > MAX_TILT_ANGLE) {
#ifdef DEBUG
                Serial.println("Cannot move: Tilt angle out of range");
#endif
                return false;
            }

            // Set target positions
            _targetX = x;
            _targetY = y;
            _targetZ = z;
            _targetPan = pan;
            _targetTilt = tilt;

            // Set tilt immediately
            setTiltAngle(tilt);

            // Start motion of other axes
            _state = MOVING;

#ifdef DEBUG
            Serial.println("Cannot home: System not in IDLE state");
#endif
            return false;
        }

        _state = HOMING;

#ifdef DEBUG
        Serial.println("Starting homing sequence");
#endif

        // This is a simplified implementation - in reality, we would
        // implement a state machine for the homing sequence

        // Start with Z axis for safety
        if (!homeZ()) {
            _state = ERROR;
            return false;
        }

        // Then X and Y
        if (!homeX() || !homeY()) {
            _state = ERROR;
            return false;
        }

        // Finally pan
        if (!homePan()) {
            _state = ERROR;
            return false;
        }

        _homed = true;
        _state = IDLE;

#ifdef DEBUG
        Serial.println("Homing complete");
#endif

        return true;
    }

    bool MotionControl::homeX() {
        // Implementation would use ClearCore homing functions
        // This is a placeholder for demonstration

#ifdef DEBUG
        Serial.println("Homing X axis");
#endif

        return true;
    }

    bool MotionControl::homeY() {
        // Implementation would use ClearCore homing functions
        // This is a placeholder for demonstration

#ifdef DEBUG
        Serial.println("Homing Y axis");
#endif

        return true;
    }

    bool MotionControl::homeZ() {
        // Implementation would use ClearCore homing functions
        // This is a placeholder for demonstration

#ifdef DEBUG
        Serial.println("Homing Z axis");
#endif

        return true;
    }

    bool MotionControl::homePan() {
        // Implementation would use ClearCore homing functions
        // This is a placeholder for demonstration

#ifdef DEBUG
        Serial.println("Homing Pan axis");
#endif

        return true;
    }

    bool MotionControl::moveToPosition(float x, float y, float z, float pan, float tilt) {
        if (_state != IDLE) {
#ifdef DEBUG