#include "tilt_servo.h"

TiltServo::TiltServo(SerialDevices &serialDevices, float minAngle, float maxAngle)
    : _serialDevices(serialDevices),
      _minAngle(minAngle),
      _maxAngle(maxAngle),
      _currentAngle(0.0f),
      _targetAngle(0.0f),
      _debugEnabled(false) {
    // Initialization
}

TiltServo::~TiltServo() {
    // Cleanup
}

void TiltServo::begin() {
    // Any initialization needed
    _currentAngle = 0.0f;
    _targetAngle = 0.0f;
}

bool TiltServo::setAngle(float angle) {
    // Constrain the angle to the allowed range
    float constrainedAngle = constrain(angle, _minAngle, _maxAngle);

    if (constrainedAngle != angle) {
        log("Angle " + String(angle, 2) + " constrained to " + String(constrainedAngle, 2));
    }

    _targetAngle = constrainedAngle;

    // Switch to tilt servo device
    if (!_serialDevices.switchToDevice(SerialDevices::TILT_SERVO)) {
        log("Failed to switch to tilt servo device");
        return false;
    }

    log("Set angle to " + String(constrainedAngle, 2));

    // Clear any pending data
    while (_serialDevices.available()) {
        _serialDevices.read();
    }

    // Send the angle command to the Arduino
    // Format: "ANGLE:XX.XX\r\n"
    String command = "ANGLE:" + String(constrainedAngle, 2) + "\r\n";
    _serialDevices.write(command.c_str());

    // Wait for acknowledgment with timeout
    if (waitForAck()) {
        _currentAngle = constrainedAngle;
        return true;
    }

    log("Failed to set angle - no acknowledgment");
    return false;
}

float TiltServo::getCurrentAngle() const {
    return _currentAngle;
}

float TiltServo::getTargetAngle() const {
    return _targetAngle;
}

void TiltServo::setLimits(float minAngle, float maxAngle) {
    _minAngle = minAngle;
    _maxAngle = maxAngle;

    // If current angle is outside new limits, adjust it
    if (_currentAngle < _minAngle) {
        setAngle(_minAngle);
    } else if (_currentAngle > _maxAngle) {
        setAngle(_maxAngle);
    }
}

bool TiltServo::waitForAck() {
    unsigned long startTime = millis();
    const unsigned long timeout = 1000;  // 1 second timeout

    // Buffer for response
    char buffer[32];
    size_t bufferIndex = 0;

    while (millis() - startTime < timeout) {
        if (_serialDevices.available()) {
            char c = _serialDevices.read();

            if (c == '\n' || c == '\r') {
                if (bufferIndex > 0) {
                    // Null terminate the string
                    buffer[bufferIndex] = '\0';

                    // Check for "OK" response
                    if (strcmp(buffer, "OK") == 0) {
                        log("Received ACK");
                        return true;
                    }
                }
                // Reset buffer for next line
                bufferIndex = 0;
            } else if (bufferIndex < sizeof(buffer) - 1) {
                // Add character to buffer
                buffer[bufferIndex++] = c;
            }
        }
    }

    log("ACK timeout");
    return false;
}
void TiltServo::setDebug(bool enable) {
    _debugEnabled = enable;
}

void TiltServo::log(const String &message) {
    if (_debugEnabled) {
        Serial.print("[TiltServo] ");
        Serial.println(message);
    }
}