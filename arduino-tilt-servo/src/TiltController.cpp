#include "../includes/TiltController.h"

// Initialize global variables
char cmdBuffer[BUFFER_SIZE];
int bufferIndex = 0;
bool commandComplete = false;
Servo tiltServo;
float currentAngle = DEFAULT_ANGLE;

void resetBuffer() {
    bufferIndex = 0;
    commandComplete = false;
    memset(cmdBuffer, 0, BUFFER_SIZE);
}

void blinkLED(int times) {
    for (int i = 0; i < times; i++) {
        digitalWrite(STATUS_LED_PIN, HIGH);
        delay(100);
        digitalWrite(STATUS_LED_PIN, LOW);
        delay(100);
    }
}

void processSerialData() {
    while (Serial.available() > 0 && !commandComplete) {
        char c = Serial.read();
        if (DEBUG_ENABLED) {
            Serial.print(c);
        }

        // Handle end of command
        if (c == '\n' || c == '\r') {
            if (bufferIndex > 0) {
                cmdBuffer[bufferIndex] = '\0';  // Null terminate
                commandComplete = true;
                if (DEBUG_ENABLED) {
                    Serial.print("Received: ");
                    Serial.println(cmdBuffer);
                }
                break;
            }
        }
        // Add character to buffer if not full
        else if (bufferIndex < BUFFER_SIZE - 1) {
            cmdBuffer[bufferIndex++] = c;
        }
    }
}

void processCommand() {
    // Check for ANGLE command
    if (strncmp(cmdBuffer, "ANGLE:", 6) == 0) {
        // Extract angle value
        float angle = atof(&cmdBuffer[6]);

        // Constrain angle to valid range
        angle = constrain(angle, MIN_ANGLE, MAX_ANGLE);

        // Set servo position
        tiltServo.write(int(angle));
        currentAngle = angle;

        // Send acknowledgment
        if (DEBUG_ENABLED) {
            Serial.print("Angle set to ");
            Serial.println(angle);
        }
        Serial.println("OK");

        // Indicate command processed
        blinkLED(1);
    }
}
