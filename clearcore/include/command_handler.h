/**
 * Space Maquette - Command Handler
 *
 * Processes commands received from the host computer
 * and dispatches them to the appropriate subsystems.
 */

#pragma once

#include "command_parser.h"
#include "configuration_manager.h"
#include "emergency.h"
#include "motion_control.h"
#include "rangefinder.h"

class CommandHandler {
public:
    // Constructor
    CommandHandler(CommandParser& parser, MotionControl& motion, Rangefinder& rangefinder,
                   EmergencyStop& estop, ConfigurationManager& config);

    // Initialize the handler
    void init();

    // Process a command (called by parser)
    void processCommand(CommandParser& parser);

private:
    // References to system components
    CommandParser& _parser;
    MotionControl& _motion;
    Rangefinder& _rangefinder;
    EmergencyStop& _estop;
    ConfigurationManager& _config;

    // Command processing methods
    void handleSystemCommands();
    void handleMotionCommands();
    void handleRangefinderCommands();
    void handleServoCommands();
    void handleConfigCommands();

    // System state
    bool _debugMode;
};