#ifndef ETHERNET_DEVICE_H
#define ETHERNET_DEVICE_H

#include "macros.h"

// Include STL headers directly
#include <functional>
#include <queue>

// Arduino/ClearCore includes
#include <Arduino.h>

#include "ClearCore.h"

// Ethernet includes
#include "EthernetManager.h"
#include "EthernetTcpClient.h"
#include "EthernetTcpServer.h"

// SD Card includes
#include <SD.h>

/**
 * Space Maquette - Ethernet Device
 *
 * Handles communication with the host over Ethernet.
 * Implements the Stream interface for compatibility with CommandParser.
 * Includes connection tracking, error logging, and reconnection strategies.
 */
class EthernetDevice : public Stream {
public:
    // Default port for the server
    static const uint16_t DEFAULT_PORT = 8080;

    // Connection states for tracking
    enum ConnectionState {
        DISCONNECTED,      // No client connected
        CONNECTING,        // In the process of connecting
        CONNECTED,         // Client connected and active
        CONNECTION_ERROR,  // Error occurred during connection
        TIMEOUT,           // Connection timed out
        RECONNECTING       // Attempting to reconnect
    };

    // Error codes for logging
    enum ErrorCode {
        ERROR_NONE = 0,                   // No error
        ERROR_INITIALIZATION_FAILED = 1,  // Ethernet initialization failed
        ERROR_LINK_DOWN = 2,              // Physical link down
        ERROR_DHCP_FAILED = 3,            // DHCP failed
        ERROR_CLIENT_DISCONNECTED = 4,    // Client disconnected unexpectedly
        ERROR_BUFFER_OVERFLOW = 5,        // Receive buffer overflow
        ERROR_SEND_FAILED = 6,            // Failed to send data
        ERROR_TIMEOUT = 7,                // Connection timeout
        ERROR_INVALID_DATA = 8,           // Received invalid data
        ERROR_RECONNECT_FAILED = 9        // Reconnection attempt failed
    };

    // Log levels
    enum LogLevel {
        LOG_NONE = 0,     // No logging
        LOG_ERROR = 1,    // Log errors only
        LOG_WARNING = 2,  // Log warnings and errors
        LOG_INFO = 3,     // Log general information
        LOG_DEBUG = 4     // Log detailed debug information
    };

    // Network statistics structure
    struct NetworkStats {
        uint32_t totalBytesSent;           // Total bytes sent since startup
        uint32_t totalBytesReceived;       // Total bytes received since startup
        uint32_t currentBytesSent;         // Bytes sent in current session
        uint32_t currentBytesReceived;     // Bytes received in current session
        uint32_t connectionCount;          // Number of client connections
        uint32_t errorCount;               // Number of errors occurred
        uint32_t reconnectAttempts;        // Number of reconnection attempts
        uint32_t reconnectSuccess;         // Number of successful reconnections
        unsigned long uptime;              // Ethernet device uptime in milliseconds
        unsigned long connectionDuration;  // Current connection duration in milliseconds
    };

    // Constructor
    EthernetDevice(uint16_t port = DEFAULT_PORT);

    // Initialization
    bool init();

    // Configuration
    void setLogFile(const char* logFilePath);
    void setLogLevel(LogLevel level);
    void setReconnectEnabled(bool enabled);
    void setConnectionTimeout(unsigned long timeoutMs);
    void setHeartbeatInterval(unsigned long intervalMs);

    // Stream interface implementation
    virtual int available() override;
    virtual int read() override;
    virtual int peek() override;
    virtual size_t write(uint8_t data) override;
    virtual size_t write(const uint8_t* buffer, size_t size) override;
    virtual void flush() override;

    // Connection management
    bool isConnected();
    bool connect();
    void disconnect();
    ConnectionState getConnectionState() const;
    void update();

    // Heartbeat mechanism
    void sendHeartbeat();
    bool checkHeartbeat();

    // Reconnection
    bool reconnect();

    // Network information
    const char* getIpAddressString();
    uint16_t getPort() const;

    // Error handling and logging
    ErrorCode getLastError() const;
    void clearError();
    const char* getErrorString(ErrorCode code);

    // Connection statistics
    NetworkStats getNetworkStats() const;
    void resetStats();

    // Diagnostics
    String getDiagnosticInfo();

private:
    ClearCore::EthernetTcpServer _server;
    ClearCore::EthernetTcpClient _client;
    bool _initialized;
    uint16_t _port;
    char _ipString[16];  // Buffer to hold IP address string

    // Connection state tracking
    ConnectionState _connectionState;
    ErrorCode _lastError;
    unsigned long _lastActivityTime;
    unsigned long _connectionStartTime;
    unsigned long _lastReconnectTime;
    unsigned long _initializationTime;

    // Connection timeouts and intervals (in milliseconds)
    unsigned long _connectionTimeout;
    unsigned long _reconnectInterval;
    unsigned long _heartbeatInterval;
    unsigned long _lastHeartbeatSent;
    unsigned long _lastHeartbeatReceived;

    // Reconnection settings
    bool _reconnectEnabled;
    uint8_t _reconnectAttempts;
    static const uint8_t MAX_RECONNECT_ATTEMPTS = 5;
    unsigned long _reconnectBackoff[MAX_RECONNECT_ATTEMPTS];

    // Command buffer for partial commands during reconnection
    static const uint16_t COMMAND_BUFFER_SIZE = 256;
    char _commandBuffer[COMMAND_BUFFER_SIZE];
    uint16_t _commandBufferIndex;

    // Statistics
    NetworkStats _stats;

    // Logging
    bool _loggingEnabled;
    char _logFilePath[32];
    LogLevel _logLevel;

    // Pending data queue for reconnection
    struct PendingData {
        uint8_t data[64];
        size_t size;
    };
    std::queue<PendingData> _pendingQueue;
    static const uint8_t MAX_PENDING_ITEMS = 10;

    // Helper methods
    void logEvent(const char* eventType, LogLevel level, ErrorCode code = ERROR_NONE);
    void updateConnectionState(ConnectionState newState, ErrorCode errorCode = ERROR_NONE);
    void checkConnectionTimeout();
    unsigned long calculateReconnectDelay();
    bool flushPendingData();
    void trackReceivedData(size_t bytes);
    void trackSentData(size_t bytes);
    void resetReconnectionCounters();
};

#endif  // ETHERNET_DEVICE_H