#ifndef WEB_SERVER_H
#define WEB_SERVER_H

#include "macros.h"

// Include STL headers directly
#include <functional>

// Arduino/ClearCore includes
#include <Arduino.h>
#include "ClearCore.h"
#include <SD.h>

// Ethernet includes
#include "EthernetManager.h"
#include "EthernetTcpServer.h"
#include "EthernetTcpClient.h"

/**
 * Space Maquette - Web Server
 *
 * Simple HTTP server for browsing SD card contents.
 * Provides read-only access to logs and configuration files.
 */
class WebServer {
public:
    // Default port for the web server
    static const uint16_t DEFAULT_PORT = 8000;
    
    // Maximum path length
    static const size_t MAX_PATH_LENGTH = 64;
    
    // Maximum response buffer size
    static const size_t RESPONSE_BUFFER_SIZE = 2048;
    
    // Constructor
    WebServer(uint16_t port = DEFAULT_PORT);
    
    // Initialize the web server
    bool init();
    
    // Update method (called in main loop)
    void update();
    
    // Get server's IP address
    const char* getIpAddressString();
    
private:
    ClearCore::EthernetTcpServer _server;
    ClearCore::EthernetTcpClient _client;
    bool _initialized;
    uint16_t _port;
    char _ipString[16]; // Buffer to hold IP address string
    
    // Request parsing
    void handleClient();
    void parseRequest(const String& request);
    
    // Response generation
    void sendResponse(const String& status, const String& contentType, const String& content);
    void sendFile(const String& path, const String& contentType);
    void sendDirectoryListing(const String& path);
    void send404();
    
    // Helper methods
    String getContentType(const String& filename);
    String urlDecode(const String& text);
    String getPath(const String& request);
};

#endif // WEB_SERVER_H
