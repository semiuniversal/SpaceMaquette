/**
 * Space Maquette - Serial Devices Module
 *
 * Manages shared access to the COM1 serial port via relay control.
 * Provides communication interfaces for the rangefinder and tilt servo.
 */

#pragma once

#include <Arduino.h>
#include <ClearCore.h>

// Device types that can be connected to COM1
enum Device { RANGEFINDER, TILT_SERVO };

class SerialDevices {
public:
    // Constructor
    SerialDevices(int relayPin);

    // Initialize the module
    void init();

    // Switch to a specific device
    bool switchToDevice(Device device);

    // Get currently active device
    Device getCurrentDevice() const;

    // Send a command to the current device
    bool sendCommand(const char* command);

    // Read a response with timeout
    String readResponse(unsigned long timeoutMs = 1000);

    // Wait for a response to include expected text (with timeout)
    bool waitForResponse(const char* expectedText, unsigned long timeoutMs = 1000);

    // Flush the serial buffer
    void flushBuffer();

private:
    // Relay control pin
    int _relayPin;

    // Currently active device
    Device _currentDevice;

    // Settings for each device
    struct DeviceSettings {
        bool relayState;  // Relay state for this device (HIGH/LOW)
        int baudRate;     // Baud rate for this device
    };

    // Settings for each device type
    DeviceSettings _deviceSettings[2] = {
        {HIGH, 9600},  // RANGEFINDER: Relay HIGH, 9600 baud
        {LOW, 9600}    // TILT_SERVO: Relay LOW, 9600 baud
    };

    // Apply settings for the specified device
    void applyDeviceSettings(Device device);
};