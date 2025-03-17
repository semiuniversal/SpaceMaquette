#include "macros.h"

// Include STL headers directly - no protection needed with our new approach
#include <algorithm>
// Add any other STL includes here

#include "rangefinder.h"
#include "serial_devices.h"  // Make sure it's explicitly included

Rangefinder::Rangefinder(SerialDevices &serialDevices)
    : _serialDevices(serialDevices), _lastMeasurement(0.0f), _debugEnabled(false) {
    // Initialization logic
}

Rangefinder::~Rangefinder() {
    // Cleanup logic
}

void Rangefinder::begin() {
    // Any initialization needed
}

float Rangefinder::takeMeasurement() {
    log("=== Starting Measurement ===");

    // Select rangefinder device
    if (!_serialDevices.selectDevice(SerialDevices::DeviceType::RANGEFINDER)) {
        log("Failed to select rangefinder device");
        return _lastMeasurement;
    }
    log("Selected rangefinder device");

    // Send measurement command
    _serialDevices.write("DIST\r\n");
    log("Sent DIST command");

    // Wait for response with timeout
    unsigned long startTime = millis();
    const unsigned long timeout = 1000;  // 1 second timeout

    // Buffer for response
    char buffer[32];
    size_t bufferIndex = 0;

    while (millis() - startTime < timeout) {
        if (_serialDevices.available()) {
            char c = _serialDevices.read();

            if (c == '\n' || c == '\r') {
                if (bufferIndex > 0) {
                    // Null terminate the string
                    buffer[bufferIndex] = '\0';

                    // Parse the distance value
                    float distance = parseDistance(buffer);

                    if (distance > 0) {
                        _lastMeasurement = distance;
                        log("Measurement successful: " + String(distance, 2) + "mm");
                        return distance;
                    }
                }
                // Reset buffer for next line
                bufferIndex = 0;
            } else if (bufferIndex < sizeof(buffer) - 1) {
                // Add character to buffer
                buffer[bufferIndex++] = c;
            }
        }
    }

    log("Measurement timeout or error");
    // Return last valid measurement on error
    return _lastMeasurement;
}

float Rangefinder::getLastMeasurement() const {
    return _lastMeasurement;
}

float Rangefinder::parseDistance(const char *buffer) {
    // Example parsing logic - adapt to your sensor's output format
    float distance = 0.0f;

    // Check for expected prefix (if any)
    if (strstr(buffer, "DIST:") == buffer) {
        // Parse after "DIST:" prefix
        distance = atof(buffer + 5);
    } else {
        // Try to parse as plain number
        distance = atof(buffer);
    }

    // Validate distance is within expected range
    if (distance < 0 || distance > 5000) {
        // Out of expected range (0-5000mm)
        return 0.0f;
    }

    return distance;
}

void Rangefinder::setDebug(bool enable) {
    _debugEnabled = enable;
}

void Rangefinder::log(const String &message) {
    if (_debugEnabled) {
        Serial.print("[Rangefinder] ");
        Serial.println(message);
    }
}