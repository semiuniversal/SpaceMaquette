/**
 * Space Maquette - Command Parser
 *
 * Handles parsing and processing of serial commands from the host.
 *
 * Format: <CMD>:<PARAMS>;<CRC>\n
 * Example: MOVE:100.5,200.3,50.0;A5\n
 */

#pragma once

// Fix for Arduino min/max macro conflicts with C++ STL
#ifdef min
#undef min
#endif

#ifdef max
#undef max
#endif

#include <Arduino.h>
#include <ClearCore.h>

#include <functional>

#define CMD_BUFFER_SIZE   128
#define MAX_PARAMS        10
#define PARAM_BUFFER_SIZE 128

class CommandParser {
public:
    // Constructor
    CommandParser(Stream& serial);

    // Initialize the parser
    void init();

    // Process incoming serial data (call in main loop)
    // Returns true if a complete command was processed
    bool update();

    // Send a response to the host
    void sendResponse(const char* status, const char* data);

    // Send a formatted response with multiple parameters
    void sendFormattedResponse(const char* status, const char* format, ...);

    // Access the parsed command and parameters
    const char* getCommand() const;
    int getParamCount() const;
    const char* getParam(int index) const;
    float getParamAsFloat(int index) const;
    int getParamAsInt(int index) const;

    // Register command handler callback
    typedef std::function<void(CommandParser& parser)> CommandHandler;
    void setCommandHandler(CommandHandler handler);

private:
    // Serial port for host communication
    Stream& _serial;

    // Command handler callback
    CommandHandler _cmdHandler;

    // Buffer for incoming command
    char _cmdBuffer[CMD_BUFFER_SIZE];
    int _cmdIndex;

    // Flag indicating a complete command has been received
    bool _commandComplete;

    // Parsed command components
    char _command[CMD_BUFFER_SIZE];
    char _paramBuffer[PARAM_BUFFER_SIZE];
    char* _params[MAX_PARAMS];
    int _paramCount;

    // Reset the parser state
    void reset();

    // Parse the received command
    void parseCommand();

    // Verify checksum (if present)
    bool verifyChecksum();

    // Calculate CRC-16 checksum
    uint16_t calculateCRC(const char* data, size_t length);
};