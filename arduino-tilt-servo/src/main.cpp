/*
* Space Maquette - Arduino Tilt Controller
*
* This sketch controls a servo for the tilt function of the Space Maquette.
* It communicates with the ClearCore controller via hardware serial.
*
* Communication Protocol:
* - Commands: "ANGLE:XX.XX\r\n" - Set servo angle in degrees
* - Response: "OK\r\n" - Acknowledgment of successful command
*
* Hardware:
* - Arduino Nano Atmega328 - new bootloader
* - Servo connected to servo pin
* - Hardware Serial (pins 0/RX and 1/TX) for communication with ClearCore
* - Enable pin for controlling when the Arduino responds
/*
* Space Maquette - Arduino Tilt Controller
*
* This sketch controls a servo for the tilt function of the Space Maquette.
* It communicates with the ClearCore controller via hardware serial.
*
* Communication Protocol:
* - Commands: "ANGLE:XX.XX\r\n" - Set servo angle in degrees
* - Response: "OK\r\n" - Acknowledgment of successful command
*
* Hardware:
* - Arduino Nano Atmega328 - new bootloader
* - Servo connected to servo pin
* - Hardware Serial (pins 0/RX and 1/TX) for communication with ClearCore
* - Enable pin for controlling when the Arduino responds
*/
#include <Arduino.h>

#include "../includes/TiltController.h"
void setup() {
    // Initialize serial communication
    Serial.begin(BAUD_RATE);
    Serial.setTimeout(SERIAL_TIMEOUT);

    // Initialize pins
    pinMode(ENABLE_PIN, INPUT_PULLUP);  // Enable pin with pull-up resistor
    pinMode(STATUS_LED_PIN, OUTPUT);

    // Initialize servo
    tiltServo.attach(SERVO_PIN, MIN_PULSEWIDTH, MAX_PULSEWIDTH);
    tiltServo.write(DEFAULT_ANGLE);

    // Indicate ready
    blinkLED(10);
}

void loop() {
    // Check if enabled (LOW when enabled due to relay logic)
    bool enabled = (digitalRead(ENABLE_PIN) == LOW);

    // Set status LED based on enabled state
    digitalWrite(STATUS_LED_PIN, enabled);

    // Process serial data when enabled
    if (enabled && Serial.available()) {
        processSerialData();
    }

    // Process complete command
    if (commandComplete) {
        processCommand();
        resetBuffer();
    }
}
