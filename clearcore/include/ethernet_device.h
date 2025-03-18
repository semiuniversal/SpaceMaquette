#ifndef ETHERNET_DEVICE_H
#define ETHERNET_DEVICE_H

#include "macros.h"

// Include STL headers directly
#include <functional>

// Arduino/ClearCore includes
#include <Arduino.h>
#include "ClearCore.h"

// Ethernet includes
#include "EthernetManager.h"
#include "EthernetTcpServer.h"
#include "EthernetTcpClient.h"

/**
 * Space Maquette - Ethernet Device
 *
 * Handles communication with the host over Ethernet.
 * Implements the Stream interface for compatibility with CommandParser.
 */
class EthernetDevice : public Stream {
public:
    // Default port for the server
    static const uint16_t DEFAULT_PORT = 8080;
    
    // Constructor
    EthernetDevice(uint16_t port = DEFAULT_PORT);
    
    // Initialize the Ethernet device
    bool init();
    
    // Stream interface implementation
    virtual int available() override;
    virtual int read() override;
    virtual int peek() override;
    virtual size_t write(uint8_t data) override;
    virtual size_t write(const uint8_t *buffer, size_t size) override;
    virtual void flush() override;
    
    // Additional methods
    bool isConnected();
    void update();
    
    // Get the server's IP address as a string
    const char* getIpAddressString();
    
private:
    ClearCore::EthernetTcpServer _server;
    ClearCore::EthernetTcpClient _client;
    bool _initialized;
    uint16_t _port;
    char _ipString[16]; // Buffer to hold IP address string
};

#endif // ETHERNET_DEVICE_H
