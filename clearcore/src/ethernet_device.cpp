#include "ethernet_device.h"

// Constructor
EthernetDevice::EthernetDevice(uint16_t port) : _server(port), _initialized(false), _port(port) {
    // Initialize IP string buffer
    _ipString[0] = '\0';
}

// Initialize the Ethernet device
bool EthernetDevice::init() {
    // Initialize the Ethernet Manager
    ClearCore::EthernetManager &ethernetManager = ClearCore::EthernetManager::Instance();

    // Initialize the Ethernet hardware
    ethernetManager.Initialize();

    // Initialize the PHY
    ethernetManager.PhyInitialize();

    // Setup the Ethernet stack
    ethernetManager.Setup();

    // Try to get an IP address via DHCP
    bool dhcpSuccess = ethernetManager.DhcpBegin();

    // If DHCP fails, set a static IP
    if (!dhcpSuccess) {
        // Use a default static IP configuration
        ethernetManager.LocalIp(ClearCore::IpAddress(192, 168, 1, 177));
        ethernetManager.NetmaskIp(ClearCore::IpAddress(255, 255, 255, 0));
        ethernetManager.GatewayIp(ClearCore::IpAddress(192, 168, 1, 1));
    }

    // Format the IP address as a string
    ClearCore::IpAddress ip = ethernetManager.LocalIp();
    // Use the StringValue method to get a string representation of the IP address
    strncpy(_ipString, ip.StringValue(), sizeof(_ipString) - 1);
    _ipString[sizeof(_ipString) - 1] = '\0';  // Ensure null termination

    // Start the server
    _server.Begin();

    _initialized = true;
    return true;
}

// Stream interface implementation
int EthernetDevice::available() {
    // Check for new client connections
    update();

    // Return the number of bytes available from the client
    if (_client.Connected()) {
        return _client.BytesAvailable();
    }
    return 0;
}

int EthernetDevice::read() {
    // Check for new client connections
    update();

    // Read a byte from the client
    if (_client.Connected()) {
        return _client.Read();
    }
    return -1;
}

int EthernetDevice::peek() {
    // Check for new client connections
    update();

    // Peek at the next byte from the client
    if (_client.Connected()) {
        return _client.Peek();
    }
    return -1;
}

size_t EthernetDevice::write(uint8_t data) {
    // Check for new client connections
    update();

    // Write a byte to the client
    if (_client.Connected()) {
        return _client.Send(data);
    }
    return 0;
}

size_t EthernetDevice::write(const uint8_t *buffer, size_t size) {
    // Check for new client connections
    update();

    // Write a buffer to the client
    if (_client.Connected()) {
        return _client.Send(buffer, size);
    }
    return 0;
}

void EthernetDevice::flush() {
    // Check for new client connections
    update();

    // Flush the client
    if (_client.Connected()) {
        _client.Flush();
    }
}

// Additional methods
bool EthernetDevice::isConnected() {
    update();
    return _client.Connected();
}

void EthernetDevice::update() {
    // Update the Ethernet manager
    ClearCore::EthernetManager::Instance().Refresh();

    // Check if we have a client
    if (!_client.Connected()) {
        // Check for a new client
        _client = _server.Available();
    }
}

// Get the server's IP address as a string
const char *EthernetDevice::getIpAddressString() {
    ClearCore::IpAddress ip = ClearCore::EthernetManager::Instance().LocalIp();
    // Use the StringValue method to get a string representation of the IP address
    strncpy(_ipString, ip.StringValue(), sizeof(_ipString) - 1);
    _ipString[sizeof(_ipString) - 1] = '\0';  // Ensure null termination
    return _ipString;
}
