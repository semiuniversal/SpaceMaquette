/**
 * Space Maquette - Tilt Servo Module
 *
 * Controls a tilt servo via communication with a secondary Arduino.
 * Uses the shared serial devices module for communication.
 */

#pragma once

#include <Arduino.h>
#include <ClearCore.h>

#include "serial_devices.h"

class TiltServo {
public:
    // Constructor
    TiltServo(SerialDevices& serialDevices);

    // Initialize the tilt servo
    bool init(int minAngle = 0, int maxAngle = 180);

    // Set tilt angle
    bool setAngle(int angle);

    // Get current angle
    int getCurrentAngle() const;

    // Set min/max angle limits
    void setLimits(int minAngle, int maxAngle);

    // Check if initialized
    bool isInitialized() const;

private:
    // Reference to serial devices module
    SerialDevices& _serialDevices;

    // Initialization state
    bool _initialized;

    // Current angle
    int _currentAngle;

    // Min/max angle limits
    int _minAngle;
    int _maxAngle;

    // Send a command and wait for response
    bool sendCommandWithResponse(const char* command, const char* expectedResponse,
                                 unsigned long timeoutMs = 1000);

    // Format to proper Arduino command protocol
    String formatCommand(const char* command, int param = -1);
};