/**
 * Space Maquette - Emergency Stop Module
 *
 * Handles emergency stop functionality, immediately disabling motors
 * while keeping the controller active to communicate with the host.
 */

#pragma once

#include <Arduino.h>
#include <ClearCore.h>

class EmergencyStop {
public:
    // Constructor
    EmergencyStop(int estopPin);

    // Initialize the emergency stop system
    void init();

    // Check ESTOP status (call in main loop)
    // Returns true if newly activated
    bool check();

    // Manually activate ESTOP
    void activate();

    // Get current ESTOP state
    bool isActive() const;

    // Reset after ESTOP condition cleared
    // Returns true if successfully reset
    bool reset();

private:
    // Pin connected to ESTOP circuit
    int _estopPin;

    // Current ESTOP state
    bool _estopActive;

    // Disable all motors
    void disableMotors();
};