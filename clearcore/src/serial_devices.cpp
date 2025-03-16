#include "serial_devices.h"

// Constructor
SerialDevices::SerialDevices(HardwareSerial &serial, int relayPin)
    : _serial(serial), _relayPin(relayPin), _currentDevice(NONE), _baudRate(0) {
    // Initialize relay pin as output
    pinMode(_relayPin, OUTPUT);
    // Default state (neither device active)
    digitalWrite(_relayPin, LOW);
}

// Destructor
SerialDevices::~SerialDevices() {
    // Ensure both devices are inactive when this object is destroyed
    _currentDevice = NONE;
    digitalWrite(_relayPin, LOW);
}

// Initialize the serial device manager
void SerialDevices::begin(unsigned long baudRate) {
    _baudRate = baudRate;
    _serial.begin(_baudRate);
    _currentDevice = NONE;
    // Ensure both devices are inactive initially
    digitalWrite(_relayPin, LOW);
}

// Switch to a specific device
bool SerialDevices::switchToDevice(DeviceType device) {
    // If already on the requested device, do nothing
    if (_currentDevice == device) {
        return true;
    }

    // Set relay state based on requested device
    switch (device) {
        case NONE:
            digitalWrite(_relayPin, LOW);  // Neither device active
            break;
        case RANGEFINDER:
            digitalWrite(_relayPin, LOW);  // Activate rangefinder (relay off)
            break;
        case TILT_SERVO:
            digitalWrite(_relayPin, HIGH);  // Activate tilt servo (relay on)
            break;
        default:
            return false;  // Invalid device
    }

    // Update current device
    _currentDevice = device;
    return true;
}

// Get current active device
DeviceType SerialDevices::getCurrentDevice() const {
    return _currentDevice;
}

// Check if a device is currently active
bool SerialDevices::isDeviceActive(DeviceType device) const {
    return _currentDevice == device;
}

// Serial communication methods - these simply pass through to the HardwareSerial object
size_t SerialDevices::write(uint8_t data) {
    return _serial.write(data);
}

size_t SerialDevices::write(const uint8_t *buffer, size_t size) {
    return _serial.write(buffer, size);
}

int SerialDevices::available() {
    return _serial.available();
}

int SerialDevices::read() {
    return _serial.read();
}

int SerialDevices::peek() {
    return _serial.peek();
}

void SerialDevices::flush() {
    _serial.flush();
}