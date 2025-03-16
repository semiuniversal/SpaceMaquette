#include <Arduino.h>
#include "ClearCore.h"
#include "stack-debug.h"

/**
 * Space Maquette - Main Program
 * 
 * Main program for the ClearCore controller firmware.
 * Handles initialization and main loop processing.
 * 
 * Author: William Tremblay (firmware by Claude)
 * Date: March 2025
 */

 
 // Include modules
 #include "../include/command_parser.h"
 #include "../include/command_handler.h"
 #include "../include/motion_control.h"
 #include "../include/rangefinder.h"
 #include "../include/emergency.h"
 
 // Enable debug output to USB serial
 #define DEBUG 1
 
 // Pin definitions
 #define ESTOP_PIN ConnectorDI::DI_6
 #define RANGEFINDER_RELAY_PIN ConnectorIO::IO_0
 #define TILT_SERVO_PIN ConnectorIO::IO_1
 
 // Create system objects
 CommandParser parser(Serial1);
 MotionControl motion;
 Rangefinder rangefinder(Serial2, RANGEFINDER_RELAY_PIN);
 EmergencyStop estop(ESTOP_PIN);
 CommandHandler cmdHandler(parser, motion, rangefinder, estop);
 
 void setup() {
     // Initialize USB serial for debugging
     Serial.begin(115200);
     delay(2000);  // Allow time for USB connection if debugging
     
     Serial.println("Space Maquette Controller v1.0");
     Serial.println("----------------------------------");
     
     // Initialize host communication serial port (COM0)
     Serial1.begin(115200);
     
     // Initialize rangefinder serial port (COM1)
     Serial2.ttl(true);  // TTL mode
     Serial2.begin(9600);
     
     // Initialize system components
     parser.init();
     motion.init();
     rangefinder.init();
     estop.init();
     cmdHandler.init();
     
     Serial.println("System initialization complete");
     Serial.println("----------------------------------");
 }
 
 void loop() {
     // Check for emergency stop condition
     if (estop.check()) {
         // ESTOP newly activated
         parser.sendResponse("INFO", "ESTOP_ACTIVATED");
     }
     
     // Process incoming commands
     parser.update();
     
     // Update motion state if moving
     if (motion.isMoving() && !estop.isActive()) {
         motion.update();
     }
     
     // Small delay to prevent CPU hogging
     delay(1);
 }