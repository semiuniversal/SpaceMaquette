/**
 * Space Maquette - Tilt Servo Module Implementation
 */

#include "../include/tilt_servo.h"

TiltServo::TiltServo(SerialDevices& serialDevices)
    : _serialDevices(serialDevices),
      _initialized(false),
      _currentAngle(90),
      _minAngle(0),
      _maxAngle(180) {}

bool TiltServo::init(int minAngle, int maxAngle) {
    // Set limits
    setLimits(minAngle, maxAngle);

    // Switch to tilt servo device
    if (!_serialDevices.switchToDevice(TILT_SERVO)) {
#ifdef DEBUG
        Serial.println("Failed to switch to TILT_SERVO device");
#endif
        return false;
    }

    // Send initialization command with limits
    String initCmd = formatCommand("INIT", _minAngle);
    initCmd += "," + String(_maxAngle);

    bool success = sendCommandWithResponse(initCmd.c_str(), "OK");

    if (success) {
        _initialized = true;

        // Set to middle position
        int middleAngle = (_minAngle + _maxAngle) / 2;
        setAngle(middleAngle);

#ifdef DEBUG
        Serial.print("Tilt servo initialized with limits: ");
        Serial.print(_minAngle);
        Serial.print(" - ");
        Serial.println(_maxAngle);
#endif
    } else {
#ifdef DEBUG
        Serial.println("Failed to initialize tilt servo");
#endif
    }

    return success;
}

bool TiltServo::setAngle(int angle) {
    if (!_initialized) {
#ifdef DEBUG
        Serial.println("Cannot set angle: Tilt servo not initialized");
#endif
        return false;
    }

    // Apply limits
    if (angle < _minAngle) {
#ifdef DEBUG
        Serial.print("Limiting angle to minimum: ");
        Serial.println(_minAngle);
#endif
        angle = _minAngle;
    } else if (angle > _maxAngle) {
#ifdef DEBUG
        Serial.print("Limiting angle to maximum: ");
        Serial.println(_maxAngle);
#endif
        angle = _maxAngle;
    }

    // Switch to tilt servo device
    if (!_serialDevices.switchToDevice(TILT_SERVO)) {
#ifdef DEBUG
        Serial.println("Failed to switch to TILT_SERVO device");
#endif
        return false;
    }

    // Send angle command
    String angleCmd = formatCommand("ANGLE", angle);

    bool success = sendCommandWithResponse(angleCmd.c_str(), "OK");

    if (success) {
        _currentAngle = angle;

#ifdef DEBUG
        Serial.print("Tilt angle set to: ");
        Serial.println(angle);
#endif
    } else {
#ifdef DEBUG
        Serial.print("Failed to set tilt angle to: ");
        Serial.println(angle);
#endif
    }

    return success;
}

int TiltServo::getCurrentAngle() const {
    return _currentAngle;
}

void TiltServo::setLimits(int minAngle, int maxAngle) {
    // Validate limits
    if (minAngle >= 0 && minAngle < maxAngle && maxAngle <= 180) {
        _minAngle = minAngle;
        _maxAngle = maxAngle;

#ifdef DEBUG
        Serial.print("Tilt limits set to: ");
        Serial.print(_minAngle);
        Serial.print(" - ");
        Serial.println(_maxAngle);
#endif
    } else {
#ifdef DEBUG
        Serial.println("Invalid tilt limits, using defaults");
#endif
    }
}

bool TiltServo::isInitialized() const {
    return _initialized;
}

bool TiltServo::sendCommandWithResponse(const char* command, const char* expectedResponse,
                                        unsigned long timeoutMs) {
    // Send the command
    _serialDevices.sendCommand(command);

    // Wait for the expected response
    return _serialDevices.waitForResponse(expectedResponse, timeoutMs);
}

String TiltServo::formatCommand(const char* command, int param) {
    String formattedCmd = String(command);

    if (param >= 0) {
        formattedCmd += ":" + String(param);
    }

    return formattedCmd;
}