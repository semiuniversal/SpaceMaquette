#ifndef TILT_SERVO_H
#define TILT_SERVO_H

#include <Arduino.h>

#include "serial_devices.h"

class TiltServo {
public:
    TiltServo(SerialDevices &serialDevices, float minAngle = 0.0f, float maxAngle = 180.0f);
    ~TiltServo();

    // Initialize the tilt servo
    void begin();

    // Set the tilt angle (constrained to min/max)
    bool setAngle(float angle);

    // Get the current angle
    float getCurrentAngle() const;

    // Get the target angle
    float getTargetAngle() const;

    // Set min/max angle limits
    void setLimits(float minAngle, float maxAngle);

    // Enable/disable debug output
    void setDebug(bool enable);

private:
    // Wait for acknowledgment from Arduino
    bool waitForAck();

    // Debug logging
    void log(const String &message);

    // Reference to the serial device manager
    SerialDevices &_serialDevices;

    // Angle limits
    float _minAngle;
    float _maxAngle;

    // Current and target angles
    float _currentAngle;
    float _targetAngle;

    // Debug flag
    bool _debugEnabled;
};

#endif  // TILT_SERVO_H