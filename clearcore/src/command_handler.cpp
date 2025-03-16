/**
 * Space Maquette - Command Handler Implementation
 */

#include "../include/command_handler.h"

CommandHandler::CommandHandler(CommandParser& parser, MotionControl& motion,
                               Rangefinder& rangefinder, EmergencyStop& estop)
    : _parser(parser),
      _motion(motion),
      _rangefinder(rangefinder),
      _estop(estop),
      _debugMode(false) {}

void CommandHandler::init() {
    // Register this handler with the parser
    _parser.setCommandHandler([this](CommandParser& parser) { this->processCommand(parser); });

#ifdef DEBUG
    Serial.println("Command handler initialized");
#endif
}

void CommandHandler::processCommand(CommandParser& parser) {
    const char* cmd = parser.getCommand();

#ifdef DEBUG
    Serial.print("Processing command: ");
    Serial.println(cmd);
#endif

    // Check for ESTOP first
    if (strcmp(cmd, "ESTOP") == 0) {
        _estop.activate();
        parser.sendResponse("OK", "ESTOP_ACTIVATED");
        return;
    }

    // If ESTOP is active, only allow certain commands
    if (_estop.isActive() && strcmp(cmd, "STATUS") != 0 && strcmp(cmd, "RESET_ESTOP") != 0) {
        parser.sendResponse("ERROR", "ESTOP_ACTIVE");
        return;
    }

    // Handle RESET_ESTOP
    if (strcmp(cmd, "RESET_ESTOP") == 0) {
        bool success = _estop.reset();
        if (success) {
            parser.sendResponse("OK", "ESTOP_RESET");
        } else {
            parser.sendResponse("ERROR", "ESTOP_STILL_ACTIVE");
        }
        return;
    }

    // Process command by category
    if (strcmp(cmd, "PING") == 0 || strcmp(cmd, "RESET") == 0 || strcmp(cmd, "STATUS") == 0 ||
        strcmp(cmd, "DEBUG") == 0) {
        handleSystemCommands();
    } else if (strcmp(cmd, "HOME") == 0 || strcmp(cmd, "MOVE") == 0 || strcmp(cmd, "STOP") == 0 ||
               strcmp(cmd, "VELOCITY") == 0) {
        handleMotionCommands();
    } else if (strcmp(cmd, "MEASURE") == 0 || strcmp(cmd, "SCAN") == 0) {
        handleRangefinderCommands();
    } else if (strcmp(cmd, "TILT") == 0 || strcmp(cmd, "PAN") == 0) {
        handleServoCommands();
    } else {
        parser.sendResponse("ERROR", "UNKNOWN_COMMAND");
    }
}

void CommandHandler::handleSystemCommands() {
    const char* cmd = _parser.getCommand();

    if (strcmp(cmd, "PING") == 0) {
        _parser.sendResponse("OK", "PONG");
    } else if (strcmp(cmd, "RESET") == 0) {
        // Soft reset functionality
        _parser.sendResponse("OK", "RESETTING");

        // Reset subsystems
        _motion.stop();

#ifdef DEBUG
        Serial.println("System reset");
#endif
    } else if (strcmp(cmd, "STATUS") == 0) {
        // Get current system status
        char statusBuffer[128];
        sprintf(statusBuffer, "X=%.2f,Y=%.2f,Z=%.2f,PAN=%.2f,TILT=%.2f,ESTOP=%d,MOVING=%d,HOMED=%d",
                _motion.getPositionX(), _motion.getPositionY(), _motion.getPositionZ(),
                _motion.getPanAngle(), _motion.getTiltAngle(), _estop.isActive() ? 1 : 0,
                _motion.isMoving() ? 1 : 0, _motion.isHomed() ? 1 : 0);

        _parser.sendResponse("OK", statusBuffer);
    } else if (strcmp(cmd, "DEBUG") == 0) {
        if (_parser.getParamCount() > 0) {
            const char* mode = _parser.getParam(0);
            if (strcmp(mode, "ON") == 0) {
                _debugMode = true;
                _rangefinder.setVerbose(true);
                _parser.sendResponse("OK", "DEBUG_ENABLED");
            } else if (strcmp(mode, "OFF") == 0) {
                _debugMode = false;
                _rangefinder.setVerbose(false);
                _parser.sendResponse("OK", "DEBUG_DISABLED");
            } else {
                _parser.sendResponse("ERROR", "INVALID_PARAM");
            }
        } else {
            _parser.sendResponse("ERROR", "MISSING_PARAM");
        }
    }
}

void CommandHandler::handleMotionCommands() {
    const char* cmd = _parser.getCommand();

    if (strcmp(cmd, "HOME") == 0) {
        if (_parser.getParamCount() > 0) {
            const char* axis = _parser.getParam(0);
            bool success = false;

            if (strcmp(axis, "ALL") == 0) {
                success = _motion.homeAll();
            } else if (strcmp(axis, "X") == 0) {
                success = _motion.homeX();
            } else if (strcmp(axis, "Y") == 0) {
                success = _motion.homeY();
            } else if (strcmp(axis, "Z") == 0) {
                success = _motion.homeZ();
            } else {
                _parser.sendResponse("ERROR", "INVALID_AXIS");
                return;
            }

            if (success) {
                _parser.sendResponse("OK", "HOMING_STARTED");
            } else {
                _parser.sendResponse("ERROR", "HOMING_FAILED");
            }
        } else {
            _parser.sendResponse("ERROR", "MISSING_PARAM");
        }
    } else if (strcmp(cmd, "MOVE") == 0) {
        if (_parser.getParamCount() >= 3) {
            float x = _parser.getParamAsFloat(0);
            float y = _parser.getParamAsFloat(1);
            float z = _parser.getParamAsFloat(2);
            float pan =
                _parser.getParamCount() > 3 ? _parser.getParamAsFloat(3) : _motion.getPanAngle();
            float tilt =
                _parser.getParamCount() > 4 ? _parser.getParamAsFloat(4) : _motion.getTiltAngle();

            bool success = _motion.moveToPosition(x, y, z, pan, tilt);

            if (success) {
                _parser.sendResponse("OK", "MOVE_STARTED");
            } else {
                _parser.sendResponse("ERROR", "MOVE_FAILED");
            }
        } else {
            _parser.sendResponse("ERROR", "MISSING_PARAMS");
        }
    } else if (strcmp(cmd, "STOP") == 0) {
        _motion.stop();
        _parser.sendResponse("OK", "MOTION_STOPPED");
    } else if (strcmp(cmd, "VELOCITY") == 0) {
        if (_parser.getParamCount() >= 3) {
            float vx = _parser.getParamAsFloat(0);
            float vy = _parser.getParamAsFloat(1);
            float vz = _parser.getParamAsFloat(2);

            _motion.setVelocity(vx, vy, vz);
            _parser.sendResponse("OK", "VELOCITY_SET");
        } else {
            _parser.sendResponse("ERROR", "MISSING_PARAMS");
        }
    }
}

void CommandHandler::handleRangefinderCommands() {
    const char* cmd = _parser.getCommand();

    if (strcmp(cmd, "MEASURE") == 0) {
        float distance = _rangefinder.takeMeasurement();

        if (distance >= 0) {
            _parser.sendFormattedResponse("OK", "%.3f", distance);
        } else if (distance == -2.0) {
            _parser.sendResponse("ERROR", "OUT_OF_RANGE");
        } else {
            _parser.sendResponse("ERROR", "MEASUREMENT_FAILED");
        }
    } else if (strcmp(cmd, "SCAN") == 0) {
        if (_parser.getParamCount() >= 5) {
            float x1 = _parser.getParamAsFloat(0);
            float y1 = _parser.getParamAsFloat(1);
            float x2 = _parser.getParamAsFloat(2);
            float y2 = _parser.getParamAsFloat(3);
            float step = _parser.getParamAsFloat(4);

            // Start scan operation
            // This would typically be implemented as a state machine
            // that executes over multiple loop iterations

            _parser.sendResponse("OK", "SCAN_STARTED");

#ifdef DEBUG
            Serial.print("Scan requested: (");
            Serial.print(x1);
            Serial.print(",");
            Serial.print(y1);
            Serial.print(") to (");
            Serial.print(x2);
            Serial.print(",");
            Serial.print(y2);
            Serial.print(") with step ");
            Serial.println(step);
#endif
        } else {
            _parser.sendResponse("ERROR", "MISSING_PARAMS");
        }
    }
}

void CommandHandler::handleServoCommands() {
    const char* cmd = _parser.getCommand();

    if (strcmp(cmd, "TILT") == 0) {
        if (_parser.getParamCount() > 0) {
            float angle = _parser.getParamAsFloat(0);
            bool success = _motion.setTiltAngle(angle);

            if (success) {
                _parser.sendResponse("OK", "TILT_SET");
            } else {
                _parser.sendResponse("ERROR", "TILT_FAILED");
            }
        } else {
            _parser.sendResponse("ERROR", "MISSING_PARAM");
        }
    } else if (strcmp(cmd, "PAN") == 0) {
        if (_parser.getParamCount() > 0) {
            float angle = _parser.getParamAsFloat(0);
            bool success = _motion.setPanAngle(angle);

            if (success) {
                _parser.sendResponse("OK", "PAN_SET");
            } else {
                _parser.sendResponse("ERROR", "PAN_FAILED");
            }
        } else {
            _parser.sendResponse("ERROR", "MISSING_PARAM");
        }
    }
}