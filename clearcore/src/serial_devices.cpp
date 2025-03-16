/**
 * Space Maquette - Serial Devices Implementation
 */

#include "../include/serial_devices.h"

SerialDevices::SerialDevices(int relayPin) : _relayPin(relayPin), _currentDevice(RANGEFINDER) {}

void SerialDevices::init() {
    // Configure relay pin
    pinMode(_relayPin, OUTPUT);

    // Start with rangefinder as the active device
    switchToDevice(RANGEFINDER);

#ifdef DEBUG
    Serial.println("Serial devices module initialized");
#endif
}

bool SerialDevices::switchToDevice(Device device) {
    // Only switch if it's a different device
    if (device == _currentDevice) {
        return true;
    }

    // Apply settings for this device
    applyDeviceSettings(device);

    // Update current device
    _currentDevice = device;

    // Wait for the relay to settle
    delay(100);

#ifdef DEBUG
    Serial.print("Switched to device: ");
    Serial.println(device == RANGEFINDER ? "RANGEFINDER" : "TILT_SERVO");
#endif

    return true;
}

SerialDevices::Device SerialDevices::getCurrentDevice() const {
    return _currentDevice;
}

bool SerialDevices::sendCommand(const char* command) {
    // Send command to the current device
    Serial1.println(command);
    return true;
}

String SerialDevices::readResponse(unsigned long timeoutMs) {
    String response = "";
    unsigned long startTime = millis();

    // Wait for response with timeout
    while (millis() - startTime < timeoutMs) {
        if (Serial1.available()) {
            char c = Serial1.read();
            if (c == '\n' || c == '\r') {
                if (response.length() > 0) {
                    break;
                }
            } else {
                response += c;
            }
        }
        delay(1);
    }

    return response;
}

void SerialDevices::applyDeviceSettings(Device device) {
    // Get settings for this device
    DeviceSettings settings = _deviceSettings[device];

    // Set relay state
    digitalWrite(_relayPin, settings.relayState);

    // Reset the serial port
    Serial1.end();

    // Reinitialize with the correct baud rate
    Serial1.begin(settings.baudRate);

    // Clear any existing data in the buffer
    while (Serial1.available()) {
        Serial1.read();
    }
}