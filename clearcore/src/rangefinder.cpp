/**
 * Space Maquette - Rangefinder Implementation
 *
 * Based on the SEN0366 test code provided.
 */

#include "../include/rangefinder.h"

// Initialize static constants
const byte Rangefinder::CONT_MEAS_CMD[4] = {0x80, 0x06, 0x03, 0x77};

Rangefinder::Rangefinder(Stream& serial, int relayPin)
    : _serial(serial), _relayPin(relayPin), _verbose(false), _lastDistance(-1.0) {}

void Rangefinder::init() {
    // Configure relay pin
    pinMode(_relayPin, OUTPUT);
    powerOff();  // Start with sensor powered off

#ifdef DEBUG
    Serial.println("Rangefinder initialized");
#endif
}

float Rangefinder::takeMeasurement() {
    log("=== Starting Measurement ===");

    // Power on and wait for boot
    powerOn();
    delay(1000);
    log("Sensor boot delay complete");

    // Flush buffer
    while (_serial.available()) {
        _serial.read();
    }

    // Send measurement command
    log("Sending measurement command");
    _serial.write(CONT_MEAS_CMD, sizeof(CONT_MEAS_CMD));

    // Wait for response
    float distance = -1.0;
    unsigned long startTime = millis();
    log("Waiting for response");

    while (millis() - startTime < 2000) {
        if (_serial.available() >= 11) {
            // Read frame
            byte frame[11];
            for (int i = 0; i < 11; i++) {
                frame[i] = _serial.read();
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

    // Power off sensor
    powerOff();

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

void Rangefinder::powerOn() {
    log("Powering sensor ON");
    digitalWrite(_relayPin, HIGH);
}

void Rangefinder::powerOff() {
    log("Powering sensor OFF");
    digitalWrite(_relayPin, LOW);
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