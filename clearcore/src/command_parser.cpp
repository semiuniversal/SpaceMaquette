/**
 * Space Maquette - Command Parser Implementation
 */

#include "command_parser.h"

#include <stdarg.h>

// Default constructor (implementation needed for the header declaration)
CommandParser::CommandParser() : _bufferIndex(0), _commandComplete(false), _paramCount(0) {
    _serial = nullptr;
}

CommandParser::CommandParser(Stream& serial)
    : _bufferIndex(0), _commandComplete(false), _paramCount(0) {
    _serial = &serial;
}

void CommandParser::processChar(char c) {
    // Handle backspace
    if (c == '\b' && _bufferIndex > 0) {
        _bufferIndex--;
    }
    // Handle end of command (newline)
    else if (c == '\n' || c == '\r') {
        if (_bufferIndex > 0) {
            _buffer[_bufferIndex] = '\0';
            parseCommand();

            // Call command handler if registered
            if (_commandComplete && _cmdHandler) {
                _cmdHandler(*this);
            }

            reset();
        }
    }
    // Add character to buffer if not full
    else if (_bufferIndex < CMD_BUFFER_SIZE - 1) {
        _buffer[_bufferIndex++] = c;
    }
}

bool CommandParser::hasCommand() const {
    return _commandComplete;
}

void CommandParser::init() {
    reset();

#ifdef DEBUG
    Serial.println("Command parser initialized");
#endif
}

bool CommandParser::update() {
    // Ensure a serial interface exists
    if (!_serial) {
        return false;
    }

    // Process incoming serial data
    while (_serial->available() > 0) {
        char c = _serial->read();
        processChar(c);

        // If a complete command was found and processed, return true
        if (_commandComplete) {
            return true;
        }
    }

    return false;
}

void CommandParser::sendResponse(const char* status, const char* message) {
    if (!_serial) {
        return;
    }

    _serial->print(status);
    _serial->print(":");
    _serial->println(message);

#ifdef DEBUG
    Serial.print("Response: ");
    Serial.print(status);
    Serial.print(":");
    Serial.println(message);
#endif
}

void CommandParser::sendFormattedResponse(const char* status, const char* format, ...) {
    if (!_serial) {
        return;
    }

    // Print status part
    _serial->print(status);
    _serial->print(":");

    // Format and print data part
    char buffer[CMD_BUFFER_SIZE];
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, CMD_BUFFER_SIZE, format, args);
    va_end(args);

    _serial->println(buffer);

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

void CommandParser::setCommandHandler(CommandHandlerCallback handler) {
    _cmdHandler = handler;
}

void CommandParser::reset() {
    _bufferIndex = 0;
    _commandComplete = false;
    _paramCount = 0;
}

void CommandParser::parseCommand() {
    // Format: <CMD>:<PARAMS>;<CRC>\n

#ifdef DEBUG
    Serial.print("Parsing command: ");
    Serial.println(_buffer);
#endif

    // Find command-parameter separator
    char* colonPos = strchr(_buffer, ':');

    // Find checksum separator
    char* semicolonPos = strchr(_buffer, ';');

    // Extract command
    if (colonPos) {
        // Command is everything before the colon
        size_t cmdLength = colonPos - _buffer;
        strncpy(_command, _buffer, cmdLength);
        _command[cmdLength] = '\0';

        // Parameters are between colon and semicolon (or end if no semicolon)
        char* paramsStart = colonPos + 1;
        char* paramsEnd = semicolonPos ? semicolonPos : _buffer + _bufferIndex;

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
        strcpy(_command, _buffer);
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
    char* semicolonPos = strchr(_buffer, ';');
    if (!semicolonPos) {
        return true;  // No checksum provided, assume valid
    }

    // Calculate checksum on data before semicolon
    size_t dataLength = semicolonPos - _buffer;
    uint16_t calculatedCRC = calculateCRC(_buffer, dataLength);

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