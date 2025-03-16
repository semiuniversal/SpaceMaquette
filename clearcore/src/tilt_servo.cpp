/**
 * Space Maquette - Tilt Servo Implementation
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
    _serialDevices.switchToDevice(SerialDevices::TILT_SERVO);

    // Send initialization command
    char command[50];
    sprintf(command, "INIT:min=%d,max=%d", _minAngle, _maxAngle);

    // Send command and wait for response
    bool success = sendCommandWithResponse(command, "OK:INIT", 500);

    if (success) {
        _initialized = true;
#ifdef DEBUG
        Serial.println("Tilt servo initialized successfully");
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
        return false;
    }

    // Enforce angle limits
    if (angle < _minAngle) {
        angle = _minAngle;
#ifdef DEBUG
        Serial.print("WARNING: Tilt angle limited to minimum: ");
        Serial.println(_minAngle);
#endif
    } else if (angle > _maxAngle) {
        angle = _maxAngle;
#ifdef DEBUG
        Serial.print("WARNING: Tilt angle limited to maximum: ");
        Serial.println(_maxAngle);
#endif
    }

    // Switch to tilt servo device
    _serialDevices.switchToDevice(SerialDevices::TILT_SERVO);

    // Send tilt command
    char command[20];
    sprintf(command, "TILT:%d", angle);

    // Send command and wait for response
    bool success = sendCommandWithResponse(command, "OK:TILT");

    if (success) {
        _currentAngle = angle;
    }

    return success;
}

int TiltServo::getCurrentAngle() const {
    return _currentAngle;
}

void TiltServo::setLimits(int minAngle, int maxAngle) {
    if (minAngle >= 0 && minAngle < maxAngle && maxAngle <= 180) {
        _minAngle = minAngle;
        _maxAngle = maxAngle;

#ifdef DEBUG
        Serial.print("Tilt limits set to min=");
        Serial.print(_minAngle);
        Serial.print(", max=");
        Serial.println(_maxAngle);
#endif
    }
#ifdef DEBUG
    else {
        Serial.println("ERROR: Invalid tilt limits");
    }
#endif
}

bool TiltServo::isInitialized() const {
    return _initialized;
}

bool TiltServo::sendCommandWithResponse(const char* command, const char* expectedResponse,
                                        unsigned long timeoutMs) {
    // Send command
    _serialDevices.sendCommand(command);

    // Wait for response
    String response = _serialDevices.readResponse(timeoutMs);

    // Check if response contains expected text
    return response.indexOf(expectedResponse) != -1;
}