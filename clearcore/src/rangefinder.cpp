/**
 * Space Maquette - Rangefinder Implementation
 *
 * Based on the SEN0366 test code provided.
 */

#include "../include/rangefinder.h"

// Initialize static constants
const byte Rangefinder::CONT_MEAS_CMD[4] = {0x80, 0x06, 0x03, 0x77};

Rangefinder::Rangefinder(SerialDevices& serialDevices)
    : _serialDevices(serialDevices), _verbose(false), _lastDistance(-1.0) {}

void Rangefinder::init() {
#ifdef DEBUG
    Serial.println("Rangefinder initialized");
#endif
}

float Rangefinder::takeMeasurement() {
    log("=== Starting Measurement ===");

    // Switch to rangefinder device
    _serialDevices.switchToDevice(SerialDevices::RANGEFINDER);
    log("Switched to rangefinder");

    // Flush buffer
    while (Serial1.available()) {
        Serial1.read();
    }

    // Send measurement command
    log("Sending measurement command");
    Serial1.write(CONT_MEAS_CMD, sizeof(CONT_MEAS_CMD));

    // Wait for response
    float distance = -1.0;
    unsigned long startTime = millis();
    log("Waiting for response");

    while (millis() - startTime < 2000) {
        if (Serial1.available() >= 11) {
            // Read frame
            byte frame[11];
            for (int i = 0; i < 11; i++) {
                frame[i] = Serial1.read();
            }

#ifdef DEBUG
            if (_verbose) {
                Serial.print("Received frame: ");
                for (int i = 0; i < 11; i++) {
                    Serial.print(frame[i], HEX);
                    Serial.print(" ");
                }
                Serial.println();
            }
#endif

            // Process frame
            distance = processFrame(frame);
            _lastDistance = distance;
            break;
        }
        delay(10);
    }

    if (distance < 0) {
        log("Measurement failed");
    } else {
        char msg[32];
        sprintf(msg, "Distance = %.3f m", distance);
        log(msg);
    }

    log("=== Measurement Complete ===");
    return distance;
}

void Rangefinder::setVerbose(bool verbose) {
    _verbose = verbose;
}

float Rangefinder::getLastDistance() const {
    return _lastDistance;
}

float Rangefinder::processFrame(const byte* frame) {
    // Compute checksum
    byte check = 0;
    for (int i = 0; i < 10; i++) {
        check += frame[i];
    }
    check = ~check + 1;

    // Verify checksum
    if (check != frame[10]) {
        log("Checksum mismatch on sensor frame!");
        return -1.0;
    }

    // Check for error
    if (frame[3] == 'E' && frame[4] == 'R' && frame[5] == 'R') {
        log("Sensor reported 'ERR' => out of range");
        return -2.0;
    }

    // Parse distance
    float distance = (frame[3] - '0') * 100.0 + (frame[4] - '0') * 10.0 + (frame[5] - '0') +
                     (frame[7] - '0') * 0.1 + (frame[8] - '0') * 0.01 + (frame[9] - '0') * 0.001;

    return distance;
}

void Rangefinder::log(const char* message) {
#ifdef DEBUG
    if (_verbose) {
        Serial.println(message);
    }
#endif
}