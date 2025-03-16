/**
 * Space Maquette - Rangefinder Module
 *
 * Interfaces with the SEN0366 infrared laser distance sensor.
 * Controls power via relay and handles communication protocol.
 */

#pragma once

#include <Arduino.h>
#include <ClearCore.h>

class Rangefinder {
public:
    // Constructor
    Rangefinder(Stream& serial, int relayPin);

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
    // Serial port connected to rangefinder
    Stream& _serial;

    // Pin controlling relay power
    int _relayPin;

    // Verbose mode flag
    bool _verbose;

    // Last measured distance
    float _lastDistance;

    // Command for continuous measurement
    static const byte CONT_MEAS_CMD[4];

    // Powers on the sensor
    void powerOn();

    // Powers off the sensor
    void powerOff();

    // Processes a received frame
    // Returns distance in meters, or negative value on error
    float processFrame(const byte* frame);

    // Debug logging
    void log(const char* message);
};