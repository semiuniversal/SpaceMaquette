#ifndef SERIAL_DEVICES_H
#define SERIAL_DEVICES_H

#include "macros.h"

// Include STL headers directly - no protection needed with our new approach
// Add any STL includes here

// Arduino/ClearCore includes
#include <Arduino.h>

#include "ClearCore.h"

class SerialDevices {
public:
    enum DeviceType { NONE = 0, RANGEFINDER = 1, CAMERA = 2, TILT_SERVO = 3 };

    // Constructor with ClearCorePins parameter
    SerialDevices(ClearCorePins serialPin);

    // Constructor with HardwareSerial and relay pin
    SerialDevices(HardwareSerial &serial, int relayPin);

    // Initialize the serial devices
    bool init(unsigned long baudRate = 115200);

    // Begin serial communication
    void begin(unsigned long baudRate);

    // Select active device
    bool selectDevice(DeviceType device);

    // Switch to a specific device
    bool switchToDevice(DeviceType device);

    // Get the currently active device
    DeviceType getCurrentDevice() const;

    // Check if a device is currently active
    bool isDeviceActive(DeviceType device) const;

    // Serial communication methods
    size_t write(uint8_t data);
    size_t write(const uint8_t *buffer, size_t size);
    size_t write(const char *str);  // Add string version for convenience
    int available();
    int read();
    int peek();
    void flush();

private:
    HardwareSerial *_serial;
    int _relayPin;
    DeviceType _currentDevice;
    unsigned long _baudRate;
    ClearCorePins _serialPin;
};

#endif  // SERIAL_DEVICES_H