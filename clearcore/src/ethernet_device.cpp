#include "ethernet_device.h"

// Constructor
EthernetDevice::EthernetDevice(uint16_t port)
    : _server(port),
      _initialized(false),
      _port(port),
      _connectionState(DISCONNECTED),
      _lastError(ERROR_NONE),
      _lastActivityTime(0),
      _connectionStartTime(0),
      _lastReconnectTime(0),
      _initializationTime(0),
      _connectionTimeout(60000),  // Default: 1 minute timeout
      _reconnectInterval(5000),   // Default: 5 seconds between reconnects
      _heartbeatInterval(10000),  // Default: 10 seconds between heartbeats
      _lastHeartbeatSent(0),
      _lastHeartbeatReceived(0),
      _reconnectEnabled(true),
      _reconnectAttempts(0),
      _commandBufferIndex(0),
      _loggingEnabled(false),
      _logLevel(LOG_WARNING) {
    // Initialize IP string buffer
    _ipString[0] = '\0';
    _logFilePath[0] = '\0';

    // Initialize statistics
    memset(&_stats, 0, sizeof(_stats));

    // Initialize reconnection backoff times (in ms)
    _reconnectBackoff[0] = 1000;   // 1 second
    _reconnectBackoff[1] = 2000;   // 2 seconds
    _reconnectBackoff[2] = 5000;   // 5 seconds
    _reconnectBackoff[3] = 10000;  // 10 seconds
    _reconnectBackoff[4] = 30000;  // 30 seconds
}

// Initialize the Ethernet device
bool EthernetDevice::init() {
    _initializationTime = millis();

    // Get the Ethernet Manager instance
    ClearCore::EthernetManager& ethernetManager = ClearCore::EthernetManager::Instance();

    // Initialize the Ethernet stack
    ethernetManager.Setup();

    // Log initialization start
    logEvent("INIT_START", LOG_INFO);

    // Wait for the physical link to be active before proceeding
    uint8_t linkAttempts = 0;
    while (!ethernetManager.PhyLinkActive()) {
        if (linkAttempts++ > 30) {
            updateConnectionState(CONNECTION_ERROR, ERROR_LINK_DOWN);
            logEvent("LINK_TIMEOUT", LOG_ERROR, ERROR_LINK_DOWN);
            return false;
        }
        delay(500);
    }

    logEvent("LINK_ACTIVE", LOG_INFO);

    // Try to get an IP address via DHCP with timeout
    bool dhcpSuccess = false;
    uint8_t dhcpAttempts = 0;

    while (!dhcpSuccess && dhcpAttempts < 3) {
        dhcpSuccess = ethernetManager.DhcpBegin();
        if (!dhcpSuccess) {
            delay(1000);
            dhcpAttempts++;
        }
    }

    // If DHCP fails, set a static IP
    if (!dhcpSuccess) {
        logEvent("DHCP_FAILED", LOG_WARNING, ERROR_DHCP_FAILED);

        // Use a default static IP configuration
        ethernetManager.LocalIp(ClearCore::IpAddress(192, 168, 1, 177));
        ethernetManager.NetmaskIp(ClearCore::IpAddress(255, 255, 255, 0));
        ethernetManager.GatewayIp(ClearCore::IpAddress(192, 168, 1, 1));

        logEvent("STATIC_IP_SET", LOG_INFO);
    } else {
        logEvent("DHCP_SUCCESS", LOG_INFO);
    }

    // Format the IP address as a string
    ClearCore::IpAddress ip = ethernetManager.LocalIp();
    // Use the StringValue method to get a string representation of the IP address
    strncpy(_ipString, ip.StringValue(), sizeof(_ipString) - 1);
    _ipString[sizeof(_ipString) - 1] = '\0';  // Ensure null termination

    // Start the server
    _server.Begin();
    logEvent("SERVER_STARTED", LOG_INFO);

    _initialized = true;
    updateConnectionState(DISCONNECTED);
    return true;
}

// Set log file
void EthernetDevice::setLogFile(const char* logFilePath) {
    strncpy(_logFilePath, logFilePath, sizeof(_logFilePath) - 1);
    _logFilePath[sizeof(_logFilePath) - 1] = '\0';
    _loggingEnabled = true;

#ifdef DEBUG
    Serial.print("Log file set to: ");
    Serial.println(_logFilePath);
#endif

    // Create log file with header if it doesn't exist
    if (SD.exists(_logFilePath)) {
#ifdef DEBUG
        Serial.println("Log file exists, will append to it");
#endif
        return;  // File exists, we'll append to it
    }

    File logFile = SD.open(_logFilePath, FILE_WRITE);
    if (logFile) {
        logFile.println("# Space Maquette Ethernet Log");
        logFile.println("# Timestamp,LogLevel,Event,IP,ErrorCode,Details");
        logFile.println("# ----------------------------------");
        logFile.close();
#ifdef DEBUG
        Serial.println("Created new log file with header");
#endif
    } else {
#ifdef DEBUG
        Serial.print("ERROR: Failed to create log file: ");
        Serial.println(_logFilePath);
#endif
    }
}

// Set log level
void EthernetDevice::setLogLevel(LogLevel level) {
    _logLevel = level;
}

// Set reconnect enabled
void EthernetDevice::setReconnectEnabled(bool enabled) {
    _reconnectEnabled = enabled;
}

// Set connection timeout
void EthernetDevice::setConnectionTimeout(unsigned long timeoutMs) {
    _connectionTimeout = timeoutMs;
}

// Set heartbeat interval
void EthernetDevice::setHeartbeatInterval(unsigned long intervalMs) {
    _heartbeatInterval = intervalMs;
}

// Stream interface implementation
int EthernetDevice::available() {
    update();

    if (_client.Connected()) {
        return _client.BytesAvailable();
    }
    return 0;
}

int EthernetDevice::read() {
    update();

    if (_client.Connected()) {
        int value = _client.Read();
        if (value >= 0) {
            trackReceivedData(1);
            _lastActivityTime = millis();
        }
        return value;
    }
    return -1;
}

int EthernetDevice::peek() {
    update();

    if (_client.Connected()) {
        return _client.Peek();
    }
    return -1;
}

size_t EthernetDevice::write(uint8_t data) {
    update();

    if (_client.Connected()) {
        size_t written = _client.Send(data);
        if (written > 0) {
            trackSentData(written);
            _lastActivityTime = millis();
        } else {
            // Store data for potential reconnection
            if (_reconnectEnabled && _pendingQueue.size() < MAX_PENDING_ITEMS) {
                PendingData pending;
                pending.data[0] = data;
                pending.size = 1;
                _pendingQueue.push(pending);
            }

            updateConnectionState(CONNECTION_ERROR, ERROR_SEND_FAILED);
            logEvent("SEND_FAILED", LOG_ERROR, ERROR_SEND_FAILED);

            // Try to reconnect
            if (_reconnectEnabled) {
                reconnect();
            }
        }
        return written;
    } else if (_reconnectEnabled && _pendingQueue.size() < MAX_PENDING_ITEMS) {
        // Store for reconnection
        PendingData pending;
        pending.data[0] = data;
        pending.size = 1;
        _pendingQueue.push(pending);
        return 1;  // Pretend we wrote it
    }
    return 0;
}

size_t EthernetDevice::write(const uint8_t* buffer, size_t size) {
    update();

    if (_client.Connected()) {
        size_t written = _client.Send(buffer, size);
        if (written > 0) {
            trackSentData(written);
            _lastActivityTime = millis();
        } else if (size > 0) {
            // Store data for potential reconnection
            if (_reconnectEnabled && _pendingQueue.size() < MAX_PENDING_ITEMS &&
                size <= sizeof(PendingData::data)) {
                PendingData pending;
                memcpy(pending.data, buffer, size);
                pending.size = size;
                _pendingQueue.push(pending);
            }

            updateConnectionState(CONNECTION_ERROR, ERROR_SEND_FAILED);
            logEvent("SEND_FAILED", LOG_ERROR, ERROR_SEND_FAILED);

            // Try to reconnect
            if (_reconnectEnabled) {
                reconnect();
            }
        }
        return written;
    } else if (_reconnectEnabled && _pendingQueue.size() < MAX_PENDING_ITEMS &&
               size <= sizeof(PendingData::data)) {
        // Store for reconnection
        PendingData pending;
        memcpy(pending.data, buffer, size);
        pending.size = size;
        _pendingQueue.push(pending);
        return size;  // Pretend we wrote it
    }
    return 0;
}

void EthernetDevice::flush() {
    update();

    if (_client.Connected()) {
        _client.Flush();
    }
}

// Connection management
bool EthernetDevice::isConnected() {
    update();
    return _connectionState == CONNECTED;
}

bool EthernetDevice::connect() {
    if (_connectionState == CONNECTED && _client.Connected()) {
        return true;  // Already connected
    }

    updateConnectionState(CONNECTING);
    logEvent("CONNECTING", LOG_INFO);

    // Try to get a client from the server
    _client = _server.Available();

    if (_client.Connected()) {
        updateConnectionState(CONNECTED);
        _connectionStartTime = millis();
        _lastActivityTime = _connectionStartTime;
        _stats.connectionCount++;

        logEvent("CONNECTED", LOG_INFO);

        // Send any pending data
        flushPendingData();

        return true;
    }

    updateConnectionState(DISCONNECTED);
    return false;
}

void EthernetDevice::disconnect() {
    if (_client.Connected()) {
        _client.Close();
        logEvent("DISCONNECTED", LOG_INFO);
    }

    updateConnectionState(DISCONNECTED);
    resetReconnectionCounters();
}

EthernetDevice::ConnectionState EthernetDevice::getConnectionState() const {
    return _connectionState;
}

void EthernetDevice::update() {
    // Update the Ethernet manager
    ClearCore::EthernetManager::Instance().Refresh();

    // Check for connection timeout
    checkConnectionTimeout();

    // Check if we should send a heartbeat
    if (_connectionState == CONNECTED && (_heartbeatInterval > 0) &&
        (millis() - _lastHeartbeatSent >= _heartbeatInterval)) {
        sendHeartbeat();
    }

    // If we have no client or client disconnected
    if (_connectionState != CONNECTED || !_client.Connected()) {
        // If we had a client before, log the disconnection
        if (_connectionState == CONNECTED) {
            updateConnectionState(DISCONNECTED);
            logEvent("CLIENT_DISCONNECTED", LOG_WARNING, ERROR_CLIENT_DISCONNECTED);

            // Try to reconnect if enabled
            if (_reconnectEnabled) {
                reconnect();
            }
        }

        // Check for a new client
        _client = _server.Available();

        // If we got a new client
        if (_client.Connected()) {
            updateConnectionState(CONNECTED);
            _connectionStartTime = millis();
            _lastActivityTime = _connectionStartTime;
            _stats.connectionCount++;

            logEvent("CLIENT_CONNECTED", LOG_INFO);

            // Send any pending data from previous connection
            flushPendingData();
        }
    }
}

// Heartbeat mechanism
void EthernetDevice::sendHeartbeat() {
    if (_client.Connected()) {
        // Simple heartbeat packet
        const uint8_t heartbeat[] = {0xFF, 0xFE, 0xFD, 0xFC};
        size_t written = _client.Send(heartbeat, sizeof(heartbeat));

        if (written == sizeof(heartbeat)) {
            _lastHeartbeatSent = millis();
            trackSentData(written);
            logEvent("HEARTBEAT_SENT", LOG_DEBUG);
        }
    }
}

bool EthernetDevice::checkHeartbeat() {
    // This would normally check for a heartbeat response
    // For now, we just verify the connection is active
    if (_client.Connected()) {
        // Consider the connection alive if there was activity recently
        bool isAlive = (millis() - _lastActivityTime) < _connectionTimeout;
        if (isAlive) {
            _lastHeartbeatReceived = millis();
        }
        return isAlive;
    }
    return false;
}

// Reconnection
bool EthernetDevice::reconnect() {
    if (_connectionState == CONNECTED && _client.Connected()) {
        return true;  // Already connected
    }

    // Check if we've hit maximum reconnect attempts
    if (_reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        logEvent("RECONNECT_MAX_ATTEMPTS", LOG_WARNING, ERROR_RECONNECT_FAILED);
        updateConnectionState(DISCONNECTED);
        resetReconnectionCounters();
        return false;
    }

    // Check if it's time for the next reconnect attempt
    unsigned long currentTime = millis();
    unsigned long delay = calculateReconnectDelay();

    if ((currentTime - _lastReconnectTime) < delay) {
        return false;  // Not time to reconnect yet
    }

    _lastReconnectTime = currentTime;
    _reconnectAttempts++;

    updateConnectionState(RECONNECTING);
    logEvent("RECONNECTING", LOG_INFO);

    // Try to get a client from the server
    _client = _server.Available();

    if (_client.Connected()) {
        updateConnectionState(CONNECTED);
        _connectionStartTime = millis();
        _lastActivityTime = _connectionStartTime;
        _stats.connectionCount++;
        _stats.reconnectSuccess++;

        logEvent("RECONNECT_SUCCESS", LOG_INFO);

        // Send any pending data from previous connection
        flushPendingData();

        resetReconnectionCounters();
        return true;
    }

    logEvent("RECONNECT_FAILED", LOG_WARNING, ERROR_RECONNECT_FAILED);
    updateConnectionState(DISCONNECTED);

    return false;
}

// Get the server's IP address as a string
const char* EthernetDevice::getIpAddressString() {
    return _ipString;
}

// Get the server port
uint16_t EthernetDevice::getPort() const {
    return _port;
}

// Get last error code
EthernetDevice::ErrorCode EthernetDevice::getLastError() const {
    return _lastError;
}

// Clear error state
void EthernetDevice::clearError() {
    _lastError = ERROR_NONE;
}

// Get error string from error code
const char* EthernetDevice::getErrorString(ErrorCode code) {
    switch (code) {
        case ERROR_NONE:
            return "No error";
        case ERROR_INITIALIZATION_FAILED:
            return "Initialization failed";
        case ERROR_LINK_DOWN:
            return "Physical link down";
        case ERROR_DHCP_FAILED:
            return "DHCP failed";
        case ERROR_CLIENT_DISCONNECTED:
            return "Client disconnected";
        case ERROR_BUFFER_OVERFLOW:
            return "Buffer overflow";
        case ERROR_SEND_FAILED:
            return "Send failed";
        case ERROR_TIMEOUT:
            return "Connection timeout";
        case ERROR_INVALID_DATA:
            return "Invalid data";
        case ERROR_RECONNECT_FAILED:
            return "Reconnection failed";
        default:
            return "Unknown error";
    }
}

// Get network statistics
EthernetDevice::NetworkStats EthernetDevice::getNetworkStats() const {
    NetworkStats stats = _stats;

    // Update dynamic fields
    stats.uptime = millis() - _initializationTime;
    stats.connectionDuration =
        (_connectionState == CONNECTED) ? (millis() - _connectionStartTime) : 0;

    return stats;
}

// Reset statistics
void EthernetDevice::resetStats() {
    memset(&_stats, 0, sizeof(_stats));
}

// Get diagnostic information
String EthernetDevice::getDiagnosticInfo() {
    String info = "Ethernet Diagnostics\n";
    info += "------------------\n";

    // Connection status
    info += "Status: ";
    switch (_connectionState) {
        case DISCONNECTED:
            info += "Disconnected";
            break;
        case CONNECTING:
            info += "Connecting";
            break;
        case CONNECTED:
            info += "Connected";
            break;
        case CONNECTION_ERROR:
            info += "Error";
            break;
        case TIMEOUT:
            info += "Timeout";
            break;
        case RECONNECTING:
            info += "Reconnecting";
            break;
    }
    info += "\n";

    // IP and port
    info += "IP: " + String(_ipString) + ":" + String(_port) + "\n";

    // Last error
    if (_lastError != ERROR_NONE) {
        info += "Error: " + String(getErrorString(_lastError)) + "\n";
    }

    // Statistics
    NetworkStats stats = getNetworkStats();
    info += "Uptime: " + String(stats.uptime / 1000) + " seconds\n";
    info += "Connections: " + String(stats.connectionCount) + "\n";
    info += "Sent: " + String(stats.totalBytesSent) + " bytes\n";
    info += "Received: " + String(stats.totalBytesReceived) + " bytes\n";
    info += "Errors: " + String(stats.errorCount) + "\n";
    info += "Reconnects: " + String(stats.reconnectAttempts) + " attempts, " +
            String(stats.reconnectSuccess) + " successful\n";

    // Current connection
    if (_connectionState == CONNECTED) {
        info += "Connection active for " + String(stats.connectionDuration / 1000) + " seconds\n";
        info +=
            "Last activity: " + String((millis() - _lastActivityTime) / 1000) + " seconds ago\n";
    }

    // Heartbeat
    if (_heartbeatInterval > 0) {
        info += "Heartbeat interval: " + String(_heartbeatInterval / 1000) + " seconds\n";
        if (_lastHeartbeatSent > 0) {
            info += "Last heartbeat: " + String((millis() - _lastHeartbeatSent) / 1000) +
                    " seconds ago\n";
        }
    }

    // Pending queue size
    info += "Pending data: " + String(_pendingQueue.size()) + " items\n";

    // Logging status
    info += "Logging: " + String(_loggingEnabled ? "Enabled" : "Disabled");
    if (_loggingEnabled) {
        info += " (Level: " + String((int)_logLevel) + ", File: " + String(_logFilePath) + ")";
    }
    info += "\n";

    return info;
}

// Log event with log level and optional error code
void EthernetDevice::logEvent(const char* eventType, LogLevel level, ErrorCode code) {
    // Skip logging if level is higher than configured level
    if (!_loggingEnabled || _logFilePath[0] == '\0' || level > _logLevel) {
        return;
    }

#ifdef DEBUG
    Serial.print("Logging event: ");
    Serial.print(eventType);
    Serial.print(" (level ");
    Serial.print((int)level);
    Serial.print(") to ");
    Serial.println(_logFilePath);
#endif

    File logFile = SD.open(_logFilePath, FILE_WRITE);
    if (!logFile) {
#ifdef DEBUG
        Serial.print("ERROR: Failed to open log file: ");
        Serial.println(_logFilePath);
#endif
        return;
    }

    // Format: timestamp,level,event,ip,error_code,details
    logFile.print(millis());
    logFile.print(",");
    logFile.print(level);
    logFile.print(",");
    logFile.print(eventType);
    logFile.print(",");
    logFile.print(_ipString);
    logFile.print(",");
    logFile.print((int)code);
    logFile.print(",");

    // Add details based on event type and error code
    if (code != ERROR_NONE) {
        logFile.print(getErrorString(code));
    }

    // Add connection stats for certain events
    if (strcmp(eventType, "CLIENT_CONNECTED") == 0 ||
        strcmp(eventType, "CLIENT_DISCONNECTED") == 0 ||
        strcmp(eventType, "RECONNECT_SUCCESS") == 0) {
        logFile.print(" (Connections:");
        logFile.print(_stats.connectionCount);
        logFile.print(",Errors:");
        logFile.print(_stats.errorCount);
        logFile.print(")");
    }

    logFile.println();

    // Close file immediately to ensure data is written
    logFile.close();

#ifdef DEBUG
    Serial.println("Log entry written and file closed");
#endif
}

// Update connection state and track errors
void EthernetDevice::updateConnectionState(ConnectionState newState, ErrorCode errorCode) {
    _connectionState = newState;

    if (errorCode != ERROR_NONE) {
        _lastError = errorCode;
        _stats.errorCount++;
    }

    // Update reconnection statistics
    if (newState == RECONNECTING) {
        _stats.reconnectAttempts++;
    }
}

// Check for connection timeout
void EthernetDevice::checkConnectionTimeout() {
    if (_connectionState == CONNECTED && (millis() - _lastActivityTime > _connectionTimeout)) {
        updateConnectionState(TIMEOUT, ERROR_TIMEOUT);
        logEvent("CONNECTION_TIMEOUT", LOG_WARNING, ERROR_TIMEOUT);

        // Try to reconnect if enabled
        if (_reconnectEnabled) {
            reconnect();
        }
    }
}

// Calculate reconnect delay with exponential backoff
unsigned long EthernetDevice::calculateReconnectDelay() {
    if (_reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        return _reconnectBackoff[_reconnectAttempts];
    }
    return _reconnectBackoff[MAX_RECONNECT_ATTEMPTS - 1];
}

// Flush pending data after reconnection
bool EthernetDevice::flushPendingData() {
    if (!_client.Connected() || _pendingQueue.empty()) {
        return false;
    }

    bool success = true;

    // Try to send all pending data
    while (!_pendingQueue.empty()) {
        PendingData& pending = _pendingQueue.front();
        size_t written = _client.Send(pending.data, pending.size);

        if (written == pending.size) {
            trackSentData(written);
            _pendingQueue.pop();
        } else {
            success = false;
            break;
        }
    }

    if (!_pendingQueue.empty()) {
        logEvent("PENDING_DATA_PARTIAL", LOG_WARNING);
    } else if (success) {
        logEvent("PENDING_DATA_SENT", LOG_INFO);
    }

    return success;
}

// Track received data for statistics
void EthernetDevice::trackReceivedData(size_t bytes) {
    _stats.totalBytesReceived += bytes;
    _stats.currentBytesReceived += bytes;
}

// Track sent data for statistics
void EthernetDevice::trackSentData(size_t bytes) {
    _stats.totalBytesSent += bytes;
    _stats.currentBytesSent += bytes;
}

// Reset reconnection counters after successful connection
void EthernetDevice::resetReconnectionCounters() {
    _reconnectAttempts = 0;
    _lastReconnectTime = 0;
}