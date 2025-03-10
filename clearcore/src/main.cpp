#include <Arduino.h>
#include "ClearCore.h"

// Global count variable
unsigned long count = 0;

void setup() {
    // Initialize serial communication
    Serial.begin(115200);

    // Wait for serial port to connect (for native USB)
    while (!Serial) {
        delay(10);
    }

    Serial.println("ClearCore initialization successful!");

    // Set up LED pin
    ConnectorLed.Mode(Connector::OUTPUT_DIGITAL);
}

void loop() {
    // Blink the on-board LED
    ConnectorLed.State(true);
    delay(500);
    ConnectorLed.State(false);
    delay(500);

    // Print the running message along with the count
    if (count == 0) {
        Serial.println("ClearCore is running.");
    } else {
        Serial.print("ClearCore is running... I've told you this ");
        Serial.print(count);
        Serial.println(" times already!");
    }
    // Increment count each loop iteration
    count++;
}