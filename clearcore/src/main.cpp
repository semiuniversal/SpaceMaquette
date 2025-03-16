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
#include "../include/command_handler.h"
#include "../include/command_parser.h"
#include "../include/configuration_manager.h"
#include "../include/emergency.h"
#include "../include/motion_control.h"
#include "../include/rangefinder.h"

// Enable debug output to USB serial
#define DEBUG 1

// Pin definitions
#define ESTOP_PIN             DI6
#define RANGEFINDER_RELAY_PIN IO0
#define TILT_SERVO_PIN        IO1

// Create system objects
CommandParser parser(Serial0);  // Using Serial0 for COM0 (host communication)
MotionControl motion;
Rangefinder rangefinder(Serial1, RANGEFINDER_RELAY_PIN);  // Using Serial1 for COM1 (rangefinder)
EmergencyStop estop(ESTOP_PIN);
ConfigurationManager config("/maquette_config.txt");
CommandHandler cmdHandler(parser, motion, rangefinder, estop, config);

void setup() {
    // Initialize USB serial for debugging
    Serial.begin(115200);
    delay(2000);  // Allow time for USB connection if debugging

    Serial.println("Space Maquette Controller v1.0");
    Serial.println("----------------------------------");

    // Initialize host communication serial port (COM0)
    Serial0.begin(115200);

    // Initialize rangefinder serial port (COM1)
    // Check if we need a method to set TTL mode
    Serial1.begin(9600);

    // Initialize system components
    parser.init();
    motion.init();
    rangefinder.init();
    estop.init();

    // Initialize and load configuration
    bool configLoaded = config.init();
#ifdef DEBUG
    if (configLoaded) {
        Serial.println("Configuration loaded successfully");
    } else {
        Serial.println("Using default configuration");
    }
#endif

    // Apply configuration to subsystems
    if (configLoaded) {
        // Set motor velocities
        motion.setVelocity(config.getInt("velocity_x", DEFAULT_VELOCITY_LIMIT),
                           config.getInt("velocity_y", DEFAULT_VELOCITY_LIMIT),
                           config.getInt("velocity_z", DEFAULT_VELOCITY_LIMIT));

        // Set motor acceleration
        motion.setAcceleration(config.getInt("acceleration", DEFAULT_ACCELERATION_LIMIT));

        // Set tilt limits
        motion.setTiltLimits(config.getInt("tilt_min", 45), config.getInt("tilt_max", 135));
    }

    // Initialize command handler after configuration is loaded
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