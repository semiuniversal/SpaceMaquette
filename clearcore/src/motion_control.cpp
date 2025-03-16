#include "motion_control.h"

// Constructor
MotionControl::MotionControl() {
    _initialized = false;
    _homed = false;

    _currentX = 0;
    _currentY = 0;
    _currentZ = 0;
    _currentPan = 0;
    _currentTilt = 0;

    _velocityLimit = DEFAULT_VELOCITY_LIMIT;
    _accelerationLimit = DEFAULT_ACCELERATION_LIMIT;

    _xEnabled = false;
    _yEnabled = false;
    _zEnabled = false;
    _panEnabled = false;
    _tiltEnabled = false;
}

// Initialize the motion control system
bool MotionControl::initialize() {
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
    MOTOR_X_AXIS.VelMax(_velocityLimit);
    MOTOR_X_AXIS.AccelMax(_accelerationLimit);
    MOTOR_Y_AXIS.VelMax(_velocityLimit);
    MOTOR_Y_AXIS.AccelMax(_accelerationLimit);
    MOTOR_Z_AXIS.VelMax(_velocityLimit);
    MOTOR_Z_AXIS.AccelMax(_accelerationLimit);
    MOTOR_PAN_AXIS.VelMax(_velocityLimit);
    MOTOR_PAN_AXIS.AccelMax(_accelerationLimit);

    // Configure IO-0 for tilt servo (RC Servo)
    SERVO_TILT_AXIS.Mode(Connector::IO_MODE_SERVO);

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

    // Tilt is handled separately as it's an RC servo
    _tiltEnabled = true;

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

// Home a specific axis
bool MotionControl::homeAxis(char axis) {
    // Implementation would depend on your homing strategy
    // This is a placeholder that would need to be customized

    return true;
}

// Home all axes
bool MotionControl::homeAllAxes() {
    bool success = true;

    success &= homeAxis('X');
    success &= homeAxis('Y');
    success &= homeAxis('Z');
    success &= homeAxis('P');

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
            SERVO_TILT_AXIS.ServoPositionSet(position);
            _currentTilt = position;
            return true;
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
        success &= moveAbsolute('T', tilt);
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
void MotionControl::setVelocity(int velocity) {
    _velocityLimit = velocity;

    if (_initialized) {
        MOTOR_X_AXIS.VelMax(_velocityLimit);
        MOTOR_Y_AXIS.VelMax(_velocityLimit);
        MOTOR_Z_AXIS.VelMax(_velocityLimit);
        MOTOR_PAN_AXIS.VelMax(_velocityLimit);
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

// Get current velocity limit
int MotionControl::getVelocity() {
    return _velocityLimit;
}

// Get current acceleration limit
int MotionControl::getAcceleration() {
    return _accelerationLimit;
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

// Helper function to wait for HLFB to assert
bool MotionControl::waitForHlfb(MotorDriver &motor, uint32_t timeoutMs) {
    unsigned long startTime = millis();

    while (motor.HlfbState() != MotorDriver::HLFB_ASSERTED &&
           !motor.StatusReg().bit.AlertsPresent) {
        if (timeoutMs > 0 && (millis() - startTime > timeoutMs)) {
            return false;  // Timeout occurred
        }
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