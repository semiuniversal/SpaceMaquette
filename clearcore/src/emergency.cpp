/**
 * Space Maquette - Emergency Stop Implementation
 */

#include "../include/emergency.h"

EmergencyStop::EmergencyStop(int estopPin) : _estopPin(estopPin), _estopActive(false) {}

void EmergencyStop::init() {
    // Configure ESTOP input pin with pull-up
    // Using Arduino-compatible syntax
    pinMode(_estopPin, INPUT_PULLUP);

    // Check initial state (active LOW for emergency stop)
    _estopActive = !digitalRead(_estopPin);

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
    bool estopTriggered = !digitalRead(_estopPin);

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
    if (!digitalRead(_estopPin)) {
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
    // Using direct connector access for motor control
    ConnectorM0.EnableRequest(false);
    ConnectorM1.EnableRequest(false);
    ConnectorM2.EnableRequest(false);
    ConnectorM3.EnableRequest(false);

#ifdef DEBUG
    Serial.println("All motors disabled");
#endif
}