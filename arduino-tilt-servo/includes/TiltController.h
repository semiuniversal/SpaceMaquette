/*
 * Space Maquette - Arduino Tilt Controller
 * 
 * Header file containing support functions for the tilt controller.
 */
#ifndef TILT_CONTROLLER_H
#define TILT_CONTROLLER_H

#include <Arduino.h>
#include <Servo.h>

// Pin Definitions
const int SERVO_PIN = 9;        // PWM pin for servo control
const int ENABLE_PIN = 2;       // Digital pin for enable signal
const int STATUS_LED_PIN = 13;  // Built-in LED for status indication

// Serial Communication
const long BAUD_RATE = 9600;
const unsigned long SERIAL_TIMEOUT = 100;  // ms

// Servo Configuration
const int MIN_PULSEWIDTH = 544;   // Minimum pulse width in microseconds
const int MAX_PULSEWIDTH = 2400;  // Maximum pulse width in microseconds
const int DEFAULT_ANGLE = 90;     // Default starting angle
const int MIN_ANGLE = 0;          // Minimum allowed angle
const int MAX_ANGLE = 180;        // Maximum allowed angle

// Command Processing
const int BUFFER_SIZE = 32;
extern char cmdBuffer[BUFFER_SIZE];
extern int bufferIndex;
extern bool commandComplete;

// Servo object
extern Servo tiltServo;

// Current angle
extern float currentAngle;

// Function declarations
void resetBuffer();
void blinkLED(int times);
void processSerialData();
void processCommand();

#endif // TILT_CONTROLLER_H
