#include "serial_devices.h"

// Constructor with ClearCorePins
SerialDevices::SerialDevices(ClearCorePins serialPin)
    : _serial(nullptr),
      _relayPin(-1),
      _currentDevice(NONE),
      _baudRate(115200),
      _serialPin(serialPin) {}

// Constructor with HardwareSerial
SerialDevices::SerialDevices(HardwareSerial &serial, int relayPin)
    : _serial(&serial),
      _relayPin(relayPin),
      _currentDevice(NONE),
      _baudRate(115200),
      _serialPin(static_cast<ClearCorePins>(-1)) {}

bool SerialDevices::init(unsigned long baudRate) {
    _baudRate = baudRate;

    if (_serial != nullptr) {
        _serial->begin(baudRate);
    } else {
        // Initialize using ClearCorePins if that's what was provided
        // Add appropriate initialization code here
    }

    // Initialize relay pin if used
    if (_relayPin >= 0) {
        pinMode(_relayPin, OUTPUT);
        digitalWrite(_relayPin, LOW);
    }

    return true;
}

void SerialDevices::begin(unsigned long baudRate) {
    _baudRate = baudRate;

    if (_serial != nullptr) {
        _serial->begin(baudRate);
    } else {
        // Initialize using ClearCorePins if that's what was provided
        // Add appropriate initialization code here
    }
}

bool SerialDevices::selectDevice(DeviceType device) {
    return switchToDevice(device);
}

bool SerialDevices::switchToDevice(DeviceType device) {
    if (_currentDevice == device) {
        return true;  // Already selected
    }

    // Handle device switching logic
    if (_relayPin >= 0) {
        switch (device) {
            case RANGEFINDER:
                digitalWrite(_relayPin, LOW);
                break;
            case TILT_SERVO:
                digitalWrite(_relayPin, HIGH);
                break;
            case CAMERA:
                // Add camera-specific logic
                break;
            case NONE:
            default:
                // No device selected
                break;
        }
    }

    _currentDevice = device;
    return true;
}

SerialDevices::DeviceType SerialDevices::getCurrentDevice() const {
    return _currentDevice;
}

bool SerialDevices::isDeviceActive(DeviceType device) const {
    return _currentDevice == device;
}

// Serial communication methods
size_t SerialDevices::write(uint8_t data) {
    if (_serial != nullptr) {
        return _serial->write(data);
    }
    return 0;
}

size_t SerialDevices::write(const uint8_t *buffer, size_t size) {
    if (_serial != nullptr) {
        return _serial->write(buffer, size);
    }
    return 0;
}

size_t SerialDevices::write(const char *str) {
    if (_serial != nullptr) {
        return _serial->write(str);
    }
    return 0;
}

int SerialDevices::available() {
    if (_serial != nullptr) {
        return _serial->available();
    }
    return 0;
}

int SerialDevices::read() {
    if (_serial != nullptr) {
        return _serial->read();
    }
    return -1;
}

int SerialDevices::peek() {
    if (_serial != nullptr) {
        return _serial->peek();
    }
    return -1;
}

void SerialDevices::flush() {
    if (_serial != nullptr) {
        _serial->flush();
    }
}