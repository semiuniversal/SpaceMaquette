/**
 * Space Maquette - Rangefinder Module
 *
 * Interfaces with the SEN0366 infrared laser distance sensor.
 * Uses the shared serial devices module for communication.
 */

#pragma once

#include <Arduino.h>
#include <ClearCore.h>

#include "serial_devices.h"

class Rangefinder {
public:
    // Constructor
    Rangefinder(SerialDevices& serialDevices);

    // Initialize the rangefinder
    void init();

    // Take a single measurement
    // Returns distance in meters, or negative value on error:
    // -1: Communication error
    // -2: "ERR" response (out of range)
    float takeMeasurement();

    // Set verbose mode for debugging
    void setVerbose(bool verbose);

    // Get last measured distance
    float getLastDistance() const;

private:
    // Reference to serial devices module
    SerialDevices& _serialDevices;

    // Verbose mode flag
    bool _verbose;

    // Last measured distance
    float _lastDistance;

    // Command for continuous measurement
    static const byte CONT_MEAS_CMD[4];

    // Processes a received frame
    // Returns distance in meters, or negative value on error
    float processFrame(const byte* frame);

    // Debug logging
    void log(const char* message);
};