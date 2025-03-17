/**
 * Space Maquette - Command Parser
 *
 * Handles parsing and processing of serial commands from the host.
 *
 * Format: <CMD>:<PARAMS>;<CRC>\n
 * Example: MOVE:100.5,200.3,50.0;A5\n
 *
 * Key features:
 * - Buffers and parses incoming characters
 * - Supports multiple parameters
 * - Provides checksum verification
 * - Allows setting custom command handler callbacks
 */

#ifndef COMMAND_PARSER_H
#define COMMAND_PARSER_H

#include "macros.h"

// Include STL headers directly - no protection needed with our new approach
#include <algorithm>
#include <functional>
// Add any other STL includes here

// Arduino/ClearCore includes
#include <Arduino.h>
// Add other Arduino/ClearCore includes here

// Forward declaration for command handler callback
class CommandParser;
using CommandHandlerCallback = std::function<void(CommandParser&)>;

class CommandParser {
public:
    // Constants
    static const int CMD_BUFFER_SIZE = 64;
    static const int PARAM_BUFFER_SIZE = 256;
    static const int MAX_PARAMS = 10;

    // Constructors
    CommandParser();
    CommandParser(Stream& serial);

    // Initialization
    void init();

    // Process incoming character
    void processChar(char c);

    // Process all available serial data (more efficient than processChar)
    bool update();

    // Check if a complete command is available
    bool hasCommand() const;

    // Get the parsed command
    const char* getCommand() const;

    // Get number of parameters
    int getParamCount() const;

    // Get parameter at index
    const char* getParam(int index) const;

    // Get parameter as numeric value
    float getParamAsFloat(int index) const;
    int getParamAsInt(int index) const;

    // Response methods
    void sendResponse(const char* status, const char* message);
    void sendFormattedResponse(const char* status, const char* format, ...);

    // Set command handler callback
    void setCommandHandler(CommandHandlerCallback handler);

private:
    // Serial connection reference
    Stream* _serial;

    // Buffer for incoming data
    char _buffer[CMD_BUFFER_SIZE];
    int _bufferIndex;

    // Flag indicating a complete command has been received
    bool _commandComplete;

    // Parsed command components
    char _command[CMD_BUFFER_SIZE];
    char _paramBuffer[PARAM_BUFFER_SIZE];
    char* _params[MAX_PARAMS];
    int _paramCount;

    // Command handler callback
    CommandHandlerCallback _cmdHandler;

    // Reset the parser state
    void reset();

    // Parse the received command
    void parseCommand();

    // Verify checksum (if present)
    bool verifyChecksum();

    // Calculate CRC-16 checksum
    uint16_t calculateCRC(const char* data, size_t length);
};

#endif  // COMMAND_PARSER_H