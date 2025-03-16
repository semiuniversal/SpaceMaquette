/**
 * Space Maquette - Emergency Stop Implementation
 */

#include "../include/emergency.h"

EmergencyStop::EmergencyStop(int estopPin) : _estopPin(estopPin), _estopActive(false) {}

void EmergencyStop::init() {
    // Configure ESTOP input pin with pull-up
    ConnectorMgr.InModeSet(_estopPin, InputMode::ACTIVE_LOW_PULL_UP);

    // Check initial state
    _estopActive = !ConnectorMgr.DigitalInState(_estopPin);

    // If ESTOP is active on startup, disable motors
    if (_estopActive) {
        disableMotors();

#ifdef DEBUG
        Serial.println("WARNING: Emergency stop active on startup");
#endif
    }

#ifdef DEBUG
    Serial.println("Emergency stop system initialized");
#endif
}

bool EmergencyStop::check() {
    // Read ESTOP input (active low)
    bool estopTriggered = !ConnectorMgr.DigitalInState(_estopPin);

    // If ESTOP newly activated
    if (estopTriggered && !_estopActive) {
        activate();
        return true;
    }

    return false;
}

void EmergencyStop::activate() {
    // Set ESTOP flag
    _estopActive = true;

    // Immediately disable all motors
    disableMotors();

#ifdef DEBUG
    Serial.println("EMERGENCY STOP ACTIVATED");
#endif
}

bool EmergencyStop::isActive() const {
    return _estopActive;
}

bool EmergencyStop::reset() {
    // Check if ESTOP condition is cleared
    if (!ConnectorMgr.DigitalInState(_estopPin)) {
#ifdef DEBUG
        Serial.println("Cannot reset: Emergency stop still active");
#endif
        return false;  // ESTOP still active, can't reset
    }

    // Reset ESTOP state
    _estopActive = false;

#ifdef DEBUG
    Serial.println("Emergency stop reset");
#endif

    // Note: Motors remain disabled until explicitly re-enabled
    // by motion control commands

    return true;
}

void EmergencyStop::disableMotors() {
    // Disable all motors by removing enable signal
    MotorMgr.MotorEnableSet(MotorDriver::MOTOR_1, false);
    MotorMgr.MotorEnableSet(MotorDriver::MOTOR_2, false);
    MotorMgr.MotorEnableSet(MotorDriver::MOTOR_3, false);
    MotorMgr.MotorEnableSet(MotorDriver::MOTOR_4, false);

#ifdef DEBUG
    Serial.println("All motors disabled");
#endif
}