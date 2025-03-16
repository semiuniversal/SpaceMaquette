/**
 * @brief Command parser for processing serial commands from a host device
 *
 * Parses incoming serial commands with a specific format: <CMD>:<PARAMS>;<CRC>\n
 * Supports command parsing, parameter extraction, and response generation
 *
 * Command format example: MOVE:100.5,200.3,50.0;A5\n
 *
 * Key features:
 * - Buffers and parses incoming characters
 * - Supports multiple parameters
 * - Provides checksum verification
 * - Allows setting custom command handler callbacks
 */
/**
 * Space Maquette - Command Parser
 *
 * Handles parsing and processing of serial commands from the host.
 *
 * Format: <CMD>:<PARAMS>;<CRC>\n
 * Example: MOVE:100.5,200.3,50.0;A5\n
 */

#ifndef COMMAND_PARSER_H
#define COMMAND_PARSER_H

#include "macros.h"

// Protect STL min/max before including STL headers
PROTECT_STD_MINMAX

#include <algorithm>
#include <functional>
// Add any other STL includes here

// Restore min/max macros after STL includes
RESTORE_MINMAX

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

    // Constructor
    CommandParser();

    // Process incoming character
    void processChar(char c);

    // Check if a complete command is available
    bool hasCommand() const;

    // Get the parsed command
    const char* getCommand() const;

    // Get number of parameters
    int getParamCount() const;

    // Get parameter at index
    const char* getParam(int index) const;

    // Get parameter as float
    float getParamAsFloat(int index) const;

    CommandParser(Stream& serial);

    // Response methods
    void sendResponse(const char* status, const char* message);
    void sendFormattedResponse(const char* status, const char* format, ...);

    // Set command handler callback
    void setCommandHandler(CommandHandlerCallback handler);

private:
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
    CommandHandlerCallback _commandHandler;

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