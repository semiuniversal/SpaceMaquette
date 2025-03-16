#include "macros.h"

// Protect STL min/max before including STL headers
PROTECT_STD_MINMAX
#include <algorithm>
// Add any other STL includes here
RESTORE_MINMAX

#include "motion_control.h"

// Replace any min/max calls with sm::min and sm::max
// For example:
// Change: int value = min(a, b);
// To:     int value = sm::min(a, b);

// Constructor
MotionControl::MotionControl() {
    _initialized = false;
    _homed = false;

    _currentX = 0;
    _currentY = 0;
    _currentZ = 0;
    _currentPan = 0;
    _currentTilt = 0;

    _velocityX = DEFAULT_VELOCITY_LIMIT;
    _velocityY = DEFAULT_VELOCITY_LIMIT;
    _velocityZ = DEFAULT_VELOCITY_LIMIT;
    _velocityPan = DEFAULT_VELOCITY_LIMIT;
    _accelerationLimit = DEFAULT_ACCELERATION_LIMIT;

    _xEnabled = false;
    _yEnabled = false;
    _zEnabled = false;
    _panEnabled = false;
    _tiltEnabled = false;

    // Default safe tilt limits
    _tiltMinAngle = 45;   // Restrict to 45° minimum by default
    _tiltMaxAngle = 135;  // Restrict to 135° maximum by default
    _tiltHomeAngle = 90;  // Center position (should be safe)

    _tiltServo = nullptr;  // Initialize to nullptr

    // Set default for pan home sensor pin
    _panHomeSensorPin = PAN_HOME_SENSOR_PIN;
}

// Set the tilt servo instance
void MotionControl::setTiltServo(TiltServo *tiltServo) {
    _tiltServo = tiltServo;
}

// Initialize the motion control system
bool MotionControl::init() {
    if (_initialized) {
        return true;  // Already initialized
    }

    // Set the input clocking rate for step and direction applications
    MotorMgr.MotorInputClocking(MotorManager::CLOCK_RATE_NORMAL);

    // Set all motor connectors to step and direction mode
    MotorMgr.MotorModeSet(MotorManager::MOTOR_ALL, Connector::CPM_MODE_STEP_AND_DIR);

    // Configure each motor's HLFB mode to bipolar PWM
    MOTOR_X_AXIS.HlfbMode(MotorDriver::HLFB_MODE_HAS_BIPOLAR_PWM);
    MOTOR_Y_AXIS.HlfbMode(MotorDriver::HLFB_MODE_HAS_BIPOLAR_PWM);
    MOTOR_Z_AXIS.HlfbMode(MotorDriver::HLFB_MODE_HAS_BIPOLAR_PWM);
    MOTOR_PAN_AXIS.HlfbMode(MotorDriver::HLFB_MODE_HAS_BIPOLAR_PWM);

    // Set the HLFB carrier frequency to 482 Hz for each motor
    MOTOR_X_AXIS.HlfbCarrier(MotorDriver::HLFB_CARRIER_482_HZ);
    MOTOR_Y_AXIS.HlfbCarrier(MotorDriver::HLFB_CARRIER_482_HZ);
    MOTOR_Z_AXIS.HlfbCarrier(MotorDriver::HLFB_CARRIER_482_HZ);
    MOTOR_PAN_AXIS.HlfbCarrier(MotorDriver::HLFB_CARRIER_482_HZ);

    // Set velocity and acceleration limits for each motor
    MOTOR_X_AXIS.VelMax(_velocityX);
    MOTOR_X_AXIS.AccelMax(_accelerationLimit);
    MOTOR_Y_AXIS.VelMax(_velocityY);
    MOTOR_Y_AXIS.AccelMax(_accelerationLimit);
    MOTOR_Z_AXIS.VelMax(_velocityZ);
    MOTOR_Z_AXIS.AccelMax(_accelerationLimit);
    MOTOR_PAN_AXIS.VelMax(_velocityPan);
    MOTOR_PAN_AXIS.AccelMax(_accelerationLimit);

    // Initialize tilt servo if available
    if (_tiltServo != nullptr) {
        _tiltServo->setLimits(_tiltMinAngle, _tiltMaxAngle);
        _tiltServo->setAngle(_tiltHomeAngle);  // Go to safe home position immediately
    }

    _initialized = true;
    return true;
}

// Enable a specific motor axis
bool MotionControl::enableMotor(char axis) {
    if (!_initialized) {
        return false;
    }

    bool success = true;

    switch (axis) {
        case 'X':
        case 'x':
            MOTOR_X_AXIS.EnableRequest(true);
            success = waitForHlfb(MOTOR_X_AXIS);
            _xEnabled = success;
            break;
        case 'Y':
        case 'y':
            MOTOR_Y_AXIS.EnableRequest(true);
            success = waitForHlfb(MOTOR_Y_AXIS);
            _yEnabled = success;
            break;
        case 'Z':
        case 'z':
            MOTOR_Z_AXIS.EnableRequest(true);
            success = waitForHlfb(MOTOR_Z_AXIS);
            _zEnabled = success;
            break;
        case 'P':
        case 'p':
            MOTOR_PAN_AXIS.EnableRequest(true);
            success = waitForHlfb(MOTOR_PAN_AXIS);
            _panEnabled = success;
            break;
        case 'T':
        case 't':
            _tiltEnabled = (_tiltServo != nullptr);  // Enable if tilt servo exists
            success = _tiltEnabled;
            break;
        default:
            success = false;
            break;
    }

    return success;
}

// Enable all motors
bool MotionControl::enableAllMotors() {
    bool success = true;

    success &= enableMotor('X');
    success &= enableMotor('Y');
    success &= enableMotor('Z');
    success &= enableMotor('P');
    success &= enableMotor('T');

    return success;
}

// Disable a specific motor axis
bool MotionControl::disableMotor(char axis) {
    if (!_initialized) {
        return false;
    }

    switch (axis) {
        case 'X':
        case 'x':
            MOTOR_X_AXIS.EnableRequest(false);
            _xEnabled = false;
            break;
        case 'Y':
        case 'y':
            MOTOR_Y_AXIS.EnableRequest(false);
            _yEnabled = false;
            break;
        case 'Z':
        case 'z':
            MOTOR_Z_AXIS.EnableRequest(false);
            _zEnabled = false;
            break;
        case 'P':
        case 'p':
            MOTOR_PAN_AXIS.EnableRequest(false);
            _panEnabled = false;
            break;
        case 'T':
        case 't':
            _tiltEnabled = false;
            break;
        default:
            return false;
    }

    return true;
}

// Disable all motors
bool MotionControl::disableAllMotors() {
    MOTOR_X_AXIS.EnableRequest(false);
    MOTOR_Y_AXIS.EnableRequest(false);
    MOTOR_Z_AXIS.EnableRequest(false);
    MOTOR_PAN_AXIS.EnableRequest(false);

    _xEnabled = false;
    _yEnabled = false;
    _zEnabled = false;
    _panEnabled = false;
    _tiltEnabled = false;

    return true;
}

bool MotionControl::isPanHomeSensorTriggered() {
    // Read the optical sensor pin
    // Return true if the sensor is triggered (flag detected)
    return digitalRead(_panHomeSensorPin) == HIGH;  // Adjust logic level as needed
}

bool MotionControl::homePanAxis() {
    if (!_panEnabled) {
        return false;
    }

    // Store initial sensor state
    bool initialSensorState = isPanHomeSensorTriggered();

    // Set a slow homing velocity
    int savedVelocity = _velocityPan;
    MOTOR_PAN_AXIS.VelMax(5000);  // Slower speed for homing

    // First, safely disable the motor to prepare for homing
    MOTOR_PAN_AXIS.EnableRequest(false);
    delay(100);  // Give time for motor to disengage

    // Re-enable the motor to start homing
    MOTOR_PAN_AXIS.EnableRequest(true);

    // Wait for HLFB to assert (motor ready)
    if (!waitForHlfb(MOTOR_PAN_AXIS, 3000)) {
        // Could not enable motor for homing
        return false;
    }

    if (initialSensorState) {
        // Sensor already triggered, need to rotate a full 360°
        // We'll move in the positive direction until sensor is not triggered
        while (isPanHomeSensorTriggered() && !MOTOR_PAN_AXIS.StatusReg().bit.AlertsPresent) {
            MOTOR_PAN_AXIS.Move(1000, MotorDriver::MOVE_TARGET_REL_END_POSN);
            while (!MOTOR_PAN_AXIS.StepsComplete()) {
                if (!isPanHomeSensorTriggered()) {
                    break;
                }
                delay(10);
            }
            if (!isPanHomeSensorTriggered()) {
                break;
            }
        }

        // Now continue until sensor triggers again
        while (!isPanHomeSensorTriggered() && !MOTOR_PAN_AXIS.StatusReg().bit.AlertsPresent) {
            MOTOR_PAN_AXIS.Move(1000, MotorDriver::MOVE_TARGET_REL_END_POSN);
            while (!MOTOR_PAN_AXIS.StepsComplete()) {
                if (isPanHomeSensorTriggered()) {
                    break;
                }
                delay(10);
            }
            if (isPanHomeSensorTriggered()) {
                break;
            }
        }
    } else {
        // Sensor not triggered, rotate until it triggers
        while (!isPanHomeSensorTriggered() && !MOTOR_PAN_AXIS.StatusReg().bit.AlertsPresent) {
            MOTOR_PAN_AXIS.Move(1000, MotorDriver::MOVE_TARGET_REL_END_POSN);
            while (!MOTOR_PAN_AXIS.StepsComplete()) {
                if (isPanHomeSensorTriggered()) {
                    break;
                }
                delay(10);
            }
            if (isPanHomeSensorTriggered()) {
                break;
            }
        }
    }

    // Stop motion when sensor is triggered
    MOTOR_PAN_AXIS.MoveStopAbrupt();

#ifdef DEBUG
    // Get the current encoder position before resetting (for debug only)
    int32_t encoderPos = MOTOR_PAN_AXIS.PositionRefCommanded();
    Serial.print("Pan axis homed. Encoder position before reset: ");
    Serial.println(encoderPos);
#endif

    // Properly zero the encoder and commanded position
    MOTOR_PAN_AXIS.EnableRequest(false);  // Disable motor first
    delay(50);                            // Brief delay

    // Reset the encoder to zero and the commanded position
    // Note: For ClearCore, we use PositionRefSet(0) rather than EncoderIn.Position(0)
    MOTOR_PAN_AXIS.PositionRefSet(0);                           // Set reference position to zero
    MOTOR_PAN_AXIS.Move(0, MotorDriver::MOVE_TARGET_ABSOLUTE);  // Set commanded position to zero

    // Re-enable the motor
    MOTOR_PAN_AXIS.EnableRequest(true);
    waitForHlfb(MOTOR_PAN_AXIS, 3000);  // Wait for motor to be ready

    // Reset our internal tracking
    _currentPan = 0;

    // Restore original velocity
    MOTOR_PAN_AXIS.VelMax(savedVelocity);
    _velocityPan = savedVelocity;

    // Check if any alerts occurred during homing
    if (MOTOR_PAN_AXIS.StatusReg().bit.AlertsPresent) {
        printAlerts(MOTOR_PAN_AXIS);
        return handleAlerts(MOTOR_PAN_AXIS);
    }

#ifdef DEBUG
    Serial.println("Pan axis successfully homed and zeroed");
#endif

    return true;
}

// Home a specific axis
bool MotionControl::homeAxis(char axis) {
    bool success = true;

    switch (axis) {
        case 'X':
        case 'x':
            if (_xEnabled) {
                _currentX = 0;
            } else {
                success = false;
            }
            break;
        case 'Y':
        case 'y':
            if (_yEnabled) {
                _currentY = 0;
            } else {
                success = false;
            }
            break;
        case 'Z':
        case 'z':
            if (_zEnabled) {
                _currentZ = 0;
            } else {
                success = false;
            }
            break;
        case 'P':
        case 'p':
            return homePanAxis();  // Use the specialized pan homing
        case 'T':
        case 't':
            if (_tiltEnabled && _tiltServo != nullptr) {
                success = setTiltAngle(_tiltHomeAngle);
            } else {
                success = false;
            }
            break;
        default:
            success = false;
    }

    return success;
}

// Home all axes
bool MotionControl::homeAllAxes() {
    bool success = true;

    success &= homeAxis('X');
    success &= homeAxis('Y');
    success &= homeAxis('Z');
    success &= homeAxis('P');
    success &= homeAxis('T');

    if (success) {
        _homed = true;
    }

    return success;
}

// Move an axis to an absolute position
bool MotionControl::moveAbsolute(char axis, int32_t position) {
    if (!_initialized) {
        return false;
    }

    bool success = true;
    MotorDriver *motor = nullptr;

    // Select the appropriate motor connector based on the axis
    switch (axis) {
        case 'X':
        case 'x':
            if (!_xEnabled)
                return false;
            motor = &MOTOR_X_AXIS;
            break;
        case 'Y':
        case 'y':
            if (!_yEnabled)
                return false;
            motor = &MOTOR_Y_AXIS;
            break;
        case 'Z':
        case 'z':
            if (!_zEnabled)
                return false;
            motor = &MOTOR_Z_AXIS;
            break;
        case 'P':
        case 'p':
            if (!_panEnabled)
                return false;
            motor = &MOTOR_PAN_AXIS;
            break;
        case 'T':
        case 't':
            if (!_tiltEnabled)
                return false;
            // For tilt servo (using position as angle)
            return setTiltAngle(position);
        default:
            return false;
    }

    // Check if motor has any alerts
    if (motor->StatusReg().bit.AlertsPresent) {
        printAlerts(*motor);
        success = handleAlerts(*motor);
        if (!success) {
            return false;
        }
    }

    // Command the absolute move
    motor->Move(position, MotorDriver::MOVE_TARGET_ABSOLUTE);

    // Wait for the move to complete and HLFB to assert
    while ((!motor->StepsComplete() || motor->HlfbState() != MotorDriver::HLFB_ASSERTED) &&
           !motor->StatusReg().bit.AlertsPresent) {
        // Could add a timeout here if needed
        delay(10);
    }

    // Check if any alerts occurred during the move
    if (motor->StatusReg().bit.AlertsPresent) {
        printAlerts(*motor);
        success = handleAlerts(*motor);
    }

    // Update the current position if move was successful
    if (success) {
        switch (axis) {
            case 'X':
            case 'x':
                _currentX = position;
                break;
            case 'Y':
            case 'y':
                _currentY = position;
                break;
            case 'Z':
            case 'z':
                _currentZ = position;
                break;
            case 'P':
            case 'p':
                _currentPan = position;
                break;
        }
    }

    return success;
}

// Move an axis by a relative distance
bool MotionControl::moveRelative(char axis, int32_t distance) {
    int32_t currentPos = getCurrentPosition(axis);
    return moveAbsolute(axis, currentPos + distance);
}

// Move to a specified position (multi-axis)
bool MotionControl::moveToPosition(int32_t x, int32_t y, int32_t z, int32_t pan, int32_t tilt) {
    bool success = true;

    if (x >= 0) {
        success &= moveAbsolute('X', x);
    }

    if (y >= 0) {
        success &= moveAbsolute('Y', y);
    }

    if (z >= 0) {
        success &= moveAbsolute('Z', z);
    }

    if (pan >= 0) {
        success &= moveAbsolute('P', pan);
    }

    if (tilt >= 0) {
        success &= setTiltAngle(tilt);
    }

    return success;
}

// Stop all motion
bool MotionControl::stop() {
    MOTOR_X_AXIS.MoveStopAbrupt();
    MOTOR_Y_AXIS.MoveStopAbrupt();
    MOTOR_Z_AXIS.MoveStopAbrupt();
    MOTOR_PAN_AXIS.MoveStopAbrupt();

    return true;
}

// Set velocity for all motors
void MotionControl::setVelocity(int vx, int vy, int vz) {
    _velocityX = vx;
    _velocityY = vy;
    _velocityZ = vz;

    if (_initialized) {
        MOTOR_X_AXIS.VelMax(_velocityX);
        MOTOR_Y_AXIS.VelMax(_velocityY);
        MOTOR_Z_AXIS.VelMax(_velocityZ);
        // Pan uses X velocity by default
        MOTOR_PAN_AXIS.VelMax(_velocityX);
    }
}

// Set acceleration for all motors
void MotionControl::setAcceleration(int acceleration) {
    _accelerationLimit = acceleration;

    if (_initialized) {
        MOTOR_X_AXIS.AccelMax(_accelerationLimit);
        MOTOR_Y_AXIS.AccelMax(_accelerationLimit);
        MOTOR_Z_AXIS.AccelMax(_accelerationLimit);
        MOTOR_PAN_AXIS.AccelMax(_accelerationLimit);
    }
}

// Get current position of an axis
int32_t MotionControl::getCurrentPosition(char axis) {
    switch (axis) {
        case 'X':
        case 'x':
            return _currentX;
        case 'Y':
        case 'y':
            return _currentY;
        case 'Z':
        case 'z':
            return _currentZ;
        case 'P':
        case 'p':
            return _currentPan;
        case 'T':
        case 't':
            return _currentTilt;
        default:
            return 0;
    }
}

// Set the tilt servo angle limits
void MotionControl::setTiltLimits(int minAngle, int maxAngle) {
    if (minAngle >= 0 && minAngle < maxAngle && maxAngle <= 180) {
        _tiltMinAngle = minAngle;
        _tiltMaxAngle = maxAngle;

        // Update tilt servo limits if it exists
        if (_tiltServo != nullptr) {
            _tiltServo->setLimits(minAngle, maxAngle);
        }

#ifdef DEBUG
        Serial.print("Tilt limits set to min=");
        Serial.print(_tiltMinAngle);
        Serial.print(", max=");
        Serial.println(_tiltMaxAngle);
#endif
    }
#ifdef DEBUG
    else {
        Serial.println("ERROR: Invalid tilt limits");
    }
#endif
}

// Set the tilt servo angle
bool MotionControl::setTiltAngle(int angle) {
    if (!_tiltEnabled || _tiltServo == nullptr) {
        return false;
    }

    // Enforce hard limits for safety
    if (angle < _tiltMinAngle) {
        angle = _tiltMinAngle;
#ifdef DEBUG
        Serial.print("WARNING: Tilt angle limited to minimum: ");
        Serial.println(_tiltMinAngle);
#endif
    } else if (angle > _tiltMaxAngle) {
        angle = _tiltMaxAngle;
#ifdef DEBUG
        Serial.print("WARNING: Tilt angle limited to maximum: ");
        Serial.println(_tiltMaxAngle);
#endif
    }

    bool success = _tiltServo->setAngle(angle);
    if (success) {
        _currentTilt = angle;
    }

    return success;
}

// Set the pan angle (using the pan axis motor)
bool MotionControl::setPanAngle(int32_t angle) {
    return moveAbsolute('P', angle);
}

// Check if any motor is currently moving
bool MotionControl::isMoving() {
    if (!_initialized) {
        return false;
    }

    return !MOTOR_X_AXIS.StepsComplete() || !MOTOR_Y_AXIS.StepsComplete() ||
           !MOTOR_Z_AXIS.StepsComplete() || !MOTOR_PAN_AXIS.StepsComplete();
}

// Check if the system is homed
bool MotionControl::isHomed() {
    return _homed;
}

// Check if a specific motor is enabled
bool MotionControl::isEnabled(char axis) {
    switch (axis) {
        case 'X':
        case 'x':
            return _xEnabled;
        case 'Y':
        case 'y':
            return _yEnabled;
        case 'Z':
        case 'z':
            return _zEnabled;
        case 'P':
        case 'p':
            return _panEnabled;
        case 'T':
        case 't':
            return _tiltEnabled;
        default:
            return false;
    }
}

// Check if any motor has an error
bool MotionControl::hasError() {
    if (!_initialized) {
        return false;
    }

    return MOTOR_X_AXIS.StatusReg().bit.AlertsPresent ||
           MOTOR_Y_AXIS.StatusReg().bit.AlertsPresent ||
           MOTOR_Z_AXIS.StatusReg().bit.AlertsPresent ||
           MOTOR_PAN_AXIS.StatusReg().bit.AlertsPresent;
}

// Update method for continuous operations
void MotionControl::update() {
    // This method can be used for continuous operations
    // like checking for limit switches, updating status, etc.
}

// Helper function to wait for HLFB to assert
bool MotionControl::waitForHlfb(MotorDriver &motor, uint32_t timeoutMs) {
    unsigned long startTime = millis();

    while (motor.HlfbState() != MotorDriver::HLFB_ASSERTED &&
           !motor.StatusReg().bit.AlertsPresent) {
        if (timeoutMs > 0 && (millis() - startTime > timeoutMs)) {
            return false;  // Timeout occurred
        }
        delay(10);
    }

    if (motor.StatusReg().bit.AlertsPresent) {
        printAlerts(motor);
        return handleAlerts(motor);
    }

    return true;
}

// Print any active alerts for a motor
void MotionControl::printAlerts(MotorDriver &motor) {
#ifdef DEBUG
    Serial.println("Alerts present: ");
    if (motor.AlertReg().bit.MotionCanceledInAlert) {
        Serial.println("    MotionCanceledInAlert");
    }
    if (motor.AlertReg().bit.MotionCanceledPositiveLimit) {
        Serial.println("    MotionCanceledPositiveLimit");
    }
    if (motor.AlertReg().bit.MotionCanceledNegativeLimit) {
        Serial.println("    MotionCanceledNegativeLimit");
    }
    if (motor.AlertReg().bit.MotionCanceledSensorEStop) {
        Serial.println("    MotionCanceledSensorEStop");
    }
    if (motor.AlertReg().bit.MotionCanceledMotorDisabled) {
        Serial.println("    MotionCanceledMotorDisabled");
    }
    if (motor.AlertReg().bit.MotorFaulted) {
        Serial.println("    MotorFaulted");
    }
#endif
}

// Handle motor alerts
bool MotionControl::handleAlerts(MotorDriver &motor) {
    if (motor.AlertReg().bit.MotorFaulted) {
// Clear motor fault by cycling enable
#ifdef DEBUG
        Serial.println("Faults present. Cycling enable signal to motor to clear faults.");
#endif

        motor.EnableRequest(false);
        delay(10);
        motor.EnableRequest(true);

        // Wait for HLFB to assert after re-enabling
        unsigned long startTime = millis();
        while (motor.HlfbState() != MotorDriver::HLFB_ASSERTED && (millis() - startTime < 5000)) {
            // Wait up to 5 seconds for HLFB
            delay(10);
        }

        if (motor.HlfbState() != MotorDriver::HLFB_ASSERTED) {
#ifdef DEBUG
            Serial.println("Failed to clear motor fault");
#endif
            return false;
        }
    }

// Clear any remaining alerts
#ifdef DEBUG
    Serial.println("Clearing alerts");
#endif
    motor.ClearAlerts();

    return true;
}

// Get error message for debugging
const char *MotionControl::getErrorMessage() {
    // Implementation would depend on your error handling strategy
    // This is a placeholder
    return "No detailed error information available";
}