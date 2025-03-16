/**
 * Space Maquette - Serial Devices Module Implementation
 */

#include "../include/serial_devices.h"

SerialDevices::SerialDevices(int relayPin) : _relayPin(relayPin), _currentDevice(RANGEFINDER) {}

void SerialDevices::init() {
    // Configure relay pin as output
    pinMode(_relayPin, OUTPUT);

    // Default to rangefinder device
    switchToDevice(RANGEFINDER);

#ifdef DEBUG
    Serial.println("Serial devices module initialized");
#endif
}

bool SerialDevices::switchToDevice(Device device) {
    // Don't switch if already on the requested device
    if (_currentDevice == device) {
        return true;
    }

    // Apply settings for the requested device
    applyDeviceSettings(device);

    // Update current device
    _currentDevice = device;

    // Give time for the relay to settle and device to initialize
    delay(50);

    // Clear any pending data
    flushBuffer();

    return true;
}

Device SerialDevices::getCurrentDevice() const {
    return _currentDevice;
}

bool SerialDevices::sendCommand(const char* command) {
    Serial1.flush();  // Ensure any previous transmission is complete
    Serial1.println(command);

#ifdef DEBUG
    Serial.print("Serial device command: ");
    Serial.println(command);
#endif

    return true;
}

String SerialDevices::readResponse(unsigned long timeoutMs) {
    String response = "";
    unsigned long startTime = millis();

    // Read until timeout or newline
    while (millis() - startTime < timeoutMs) {
        if (Serial1.available()) {
            char c = Serial1.read();

            // Check for end of response
            if (c == '\n' || c == '\r') {
                if (response.length() > 0) {
                    break;  // Exit if we have data and hit a newline
                }
                // Otherwise ignore leading newlines/carriage returns
            } else {
                response += c;  // Add character to response
            }
        }
        delay(1);  // Small delay to prevent CPU hogging
    }

#ifdef DEBUG
    if (response.length() > 0) {
        Serial.print("Serial device response: ");
        Serial.println(response);
    } else if (millis() - startTime >= timeoutMs) {
        Serial.println("Serial device response timeout");
    }
#endif

    return response;
}

bool SerialDevices::waitForResponse(const char* expectedText, unsigned long timeoutMs) {
    unsigned long startTime = millis();
    String buffer = "";

    // Read until timeout or expected text found
    while (millis() - startTime < timeoutMs) {
        if (Serial1.available()) {
            char c = Serial1.read();
            buffer += c;

            // Check if buffer contains expected text
            if (buffer.indexOf(expectedText) >= 0) {
#ifdef DEBUG
                Serial.print("Expected response found: ");
                Serial.println(buffer);
#endif
                return true;
            }

            // Keep buffer size reasonable
            if (buffer.length() > 100) {
                buffer = buffer.substring(buffer.length() - 50);
            }
        }
        delay(1);  // Small delay to prevent CPU hogging
    }

#ifdef DEBUG
    Serial.println("Expected response not found before timeout");
    Serial.print("Buffer: ");
    Serial.println(buffer);
#endif

    return false;
}

void SerialDevices::flushBuffer() {
    // Clear any pending data from serial buffer
    while (Serial1.available()) {
        Serial1.read();
    }
}

void SerialDevices::applyDeviceSettings(Device device) {
    // Set relay state based on device
    digitalWrite(_relayPin, _deviceSettings[device].relayState);

#ifdef DEBUG
    Serial.print("Switched to ");
    Serial.println(device == RANGEFINDER ? "RANGEFINDER" : "TILT_SERVO");
    Serial.print("Relay state: ");
    Serial.println(_deviceSettings[device].relayState ? "HIGH" : "LOW");
#endif
}