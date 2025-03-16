/**
 * Space Maquette - Command Parser Implementation
 */

#include "command_parser.h"

#include <stdarg.h>

#include "command_parser.h"

CommandParser::CommandParser(Stream& serial)
    : _serial(serial),
      _cmdHandler(nullptr),
      _cmdIndex(0),
      _commandComplete(false),
      _paramCount(0) {}
void CommandParser::init() {
    reset();

#ifdef DEBUG
    Serial.println("Command parser initialized");
#endif
}

bool CommandParser::update() {
    // Process incoming serial data
    while (_serial.available() > 0) {
        char c = _serial.read();

        // Handle backspace
        if (c == '\b' && _cmdIndex > 0) {
            _cmdIndex--;
        }
        // Handle end of command (newline)
        else if (c == '\n' || c == '\r') {
            if (_cmdIndex > 0) {
                _cmdBuffer[_cmdIndex] = '\0';
                parseCommand();

                // Call command handler if registered
                if (_commandComplete && _cmdHandler) {
                    _cmdHandler(*this);
                }

                reset();
                return _commandComplete;
            }
        }
        // Add character to buffer if not full
        else if (_cmdIndex < CMD_BUFFER_SIZE - 1) {
            _cmdBuffer[_cmdIndex++] = c;
        }
    }

    return false;
}

void CommandParser::sendResponse(const char* status, const char* data) {
    _serial.print(status);
    _serial.print(":");
    _serial.println(data);

#ifdef DEBUG
    Serial.print("Response: ");
    Serial.print(status);
    Serial.print(":");
    Serial.println(data);
#endif
}

void CommandParser::sendFormattedResponse(const char* status, const char* format, ...) {
    // Print status part
    _serial.print(status);
    _serial.print(":");

    // Format and print data part
    char buffer[CMD_BUFFER_SIZE];
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, CMD_BUFFER_SIZE, format, args);
    va_end(args);

    _serial.println(buffer);

#ifdef DEBUG
    Serial.print("Response: ");
    Serial.print(status);
    Serial.print(":");
    Serial.println(buffer);
#endif
}

const char* CommandParser::getCommand() const {
    return _command;
}

int CommandParser::getParamCount() const {
    return _paramCount;
}

const char* CommandParser::getParam(int index) const {
    if (index >= 0 && index < _paramCount) {
        return _params[index];
    }
    return "";
}

float CommandParser::getParamAsFloat(int index) const {
    return atof(getParam(index));
}

int CommandParser::getParamAsInt(int index) const {
    return atoi(getParam(index));
}

void CommandParser::setCommandHandler(CommandHandler handler) {
    _cmdHandler = handler;
}

void CommandParser::reset() {
    _cmdIndex = 0;
    _commandComplete = false;
    _paramCount = 0;
}

void CommandParser::parseCommand() {
    // Format: <CMD>:<PARAMS>;<CRC>\n

#ifdef DEBUG
    Serial.print("Parsing command: ");
    Serial.println(_cmdBuffer);
#endif

    // Find command-parameter separator
    char* colonPos = strchr(_cmdBuffer, ':');

    // Find checksum separator
    char* semicolonPos = strchr(_cmdBuffer, ';');

    // Extract command
    if (colonPos) {
        // Command is everything before the colon
        size_t cmdLength = colonPos - _cmdBuffer;
        strncpy(_command, _cmdBuffer, cmdLength);
        _command[cmdLength] = '\0';

        // Parameters are between colon and semicolon (or end if no semicolon)
        char* paramsStart = colonPos + 1;
        char* paramsEnd = semicolonPos ? semicolonPos : _cmdBuffer + _cmdIndex;

        // Copy parameters to buffer
        size_t paramsLength = paramsEnd - paramsStart;
        strncpy(_paramBuffer, paramsStart, paramsLength);
        _paramBuffer[paramsLength] = '\0';

        // Split parameters by comma
        char* token = strtok(_paramBuffer, ",");
        _paramCount = 0;

        while (token && _paramCount < MAX_PARAMS) {
            _params[_paramCount++] = token;
            token = strtok(NULL, ",");
        }
    } else {
        // No parameters, command is the entire buffer
        strcpy(_command, _cmdBuffer);
    }

    // Verify checksum if present
    if (semicolonPos && !verifyChecksum()) {
        sendResponse("ERROR", "CHECKSUM_MISMATCH");
        _commandComplete = false;
        return;
    }

    _commandComplete = true;

#ifdef DEBUG
    Serial.print("Command: ");
    Serial.print(_command);
    Serial.print(", Params: ");
    Serial.println(_paramCount);
    for (int i = 0; i < _paramCount; i++) {
        Serial.print("  ");
        Serial.print(i);
        Serial.print(": ");
        Serial.println(_params[i]);
    }
#endif
}

bool CommandParser::verifyChecksum() {
    // Format: <CMD>:<PARAMS>;<CRC>\n

    // Find checksum separator
    char* semicolonPos = strchr(_cmdBuffer, ';');
    if (!semicolonPos) {
        return true;  // No checksum provided, assume valid
    }

    // Calculate checksum on data before semicolon
    size_t dataLength = semicolonPos - _cmdBuffer;
    uint16_t calculatedCRC = calculateCRC(_cmdBuffer, dataLength);

    // Extract received checksum (hexadecimal after semicolon)
    uint16_t receivedCRC = 0;
    sscanf(semicolonPos + 1, "%x", &receivedCRC);

#ifdef DEBUG
    Serial.print("Checksum: calculated=0x");
    Serial.print(calculatedCRC, HEX);
    Serial.print(", received=0x");
    Serial.println(receivedCRC, HEX);
#endif

    return calculatedCRC == receivedCRC;
}

uint16_t CommandParser::calculateCRC(const char* data, size_t length) {
    // Simple CRC-16 implementation
    uint16_t crc = 0xFFFF;

    for (size_t i = 0; i < length; i++) {
        crc ^= (uint8_t)data[i];
        for (int j = 0; j < 8; j++) {
            if (crc & 0x0001) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc = crc >> 1;
            }
        }
    }

    return crc;
}