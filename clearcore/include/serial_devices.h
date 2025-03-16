#ifndef SERIAL_DEVICES_H
#define SERIAL_DEVICES_H

#include <Arduino.h>

// Define device types as enum outside the class for broader access
enum DeviceType { DEVICE_NONE = 0, DEVICE_RANGEFINDER = 1, DEVICE_TILT_SERVO = 2 };

class SerialDevices {
public:
    // Bring DeviceType enum into class scope for convenience
    static const DeviceType NONE = DEVICE_NONE;
    static const DeviceType RANGEFINDER = DEVICE_RANGEFINDER;
    static const DeviceType TILT_SERVO = DEVICE_TILT_SERVO;

    SerialDevices(HardwareSerial &serial, int relayPin);
    ~SerialDevices();

    // Initialize the serial device manager
    void begin(unsigned long baudRate);

    // Switch to a specific device
    bool switchToDevice(DeviceType device);

    // Get current active device
    DeviceType getCurrentDevice() const;

    // Check if a device is currently active
    bool isDeviceActive(DeviceType device) const;

    // Serial communication methods
    size_t write(uint8_t data);
    size_t write(const uint8_t *buffer, size_t size);
    int available();
    int read();
    int peek();
    void flush();

private:
    HardwareSerial &_serial;
    int _relayPin;
    DeviceType _currentDevice;
    unsigned long _baudRate;
};

#endif  // SERIAL_DEVICES_H