#ifndef RANGEFINDER_H
#define RANGEFINDER_H

#include <Arduino.h>

#include "serial_devices.h"

class Rangefinder {
public:
    Rangefinder(SerialDevices &serialDevices);
    ~Rangefinder();

    // Initialize the rangefinder
    void begin();

    // Take a distance measurement
    float takeMeasurement();

    // Get the last successful measurement
    float getLastMeasurement() const;

    // Enable/disable debug output
    void setDebug(bool enable);

private:
    // Parse distance from sensor response
    float parseDistance(const char *buffer);

    // Debug logging
    void log(const String &message);

    // Reference to the serial device manager
    SerialDevices &_serialDevices;

    // Last valid measurement
    float _lastMeasurement;

    // Debug flag
    bool _debugEnabled;
};

#endif  // RANGEFINDER_H