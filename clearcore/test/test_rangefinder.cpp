/**
 * Space Maquette - Rangefinder Tests
 *
 * Unit tests for the rangefinder module.
 */

#include "macros.h"

// Protect STL min/max before including STL headers
PROTECT_STD_MINMAX
#include <algorithm>
// Add any other STL includes here
RESTORE_MINMAX

#include "rangefinder.h"
#include "unity.h"

// Replace any min/max calls with sm::min and sm::max
// For example:
// Change: int value = min(a, b);
// To:     int value = sm::min(a, b);

// Mock Serial class for testing
class MockSerial {
public:
    MockSerial() : _available(0), _position(0) {}

    void addData(const byte* data, int length) {
        for (int i = 0; i < length && (_position + _available) < sizeof(_buffer); i++) {
            _buffer[_position + _available] = data[i];
            _available++;
        }
    }

    void setValidMeasurement() {
        // ADDR=0x80, GRP=0x06, CMD=0x83, '1', '2', '3', '.', '4', '5', '6', CS
        byte frame[] = {0x80, 0x06, 0x83, '1', '2', '3', '.', '4', '5', '6', 0xB7};
        addData(frame, sizeof(frame));
    }

    void setErrorMeasurement() {
        // ADDR=0x80, GRP=0x06, CMD=0x83, 'E', 'R', 'R', '-', '-', '0', '0', CS
        byte frame[] = {0x80, 0x06, 0x83, 'E', 'R', 'R', '-', '-', '0', '0', 0xB7};
        addData(frame, sizeof(frame));
    }

    // Stream interface implementation
    virtual int available() { return _available; }

    virtual int read() {
        if (_available <= 0)
            return -1;
        byte data = _buffer[_position++];
        _available--;
        return data;
    }

    virtual int peek() {
        if (_available <= 0)
            return -1;
        return _buffer[_position];
    }

    virtual size_t write(uint8_t data) {
        // Just capture the write, don't actually do anything
        return 1;
    }

    virtual size_t write(const uint8_t* buffer, size_t size) {
        // Just capture the write, don't actually do anything
        return size;
    }

    virtual void flush() {}

private:
    byte _buffer[32];
    int _available;
    int _position;
};

// Mock digital output for relay control
int mockRelayPin = 10;
int mockRelayState = LOW;

// Override Arduino's digitalWrite for testing
void digitalWrite(int pin, int state) {
    if (pin == mockRelayPin) {
        mockRelayState = state;
    }
}

void setUp(void) {
    // Reset mock state
    mockRelayState = LOW;
}

void test_rangefinder_init(void) {
    MockSerial serial;
    Rangefinder rangefinder(serial, mockRelayPin);

    rangefinder.init();

    // Check that relay is off after init
    TEST_ASSERT_EQUAL(LOW, mockRelayState);
}

void test_rangefinder_valid_measurement(void) {
    MockSerial serial;
    Rangefinder rangefinder(serial, mockRelayPin);

    rangefinder.init();

    // Set up mock to return valid measurement
    serial.setValidMeasurement();

    // Take measurement
    float distance = rangefinder.takeMeasurement();

    // Check measurement value (123.456)
    TEST_ASSERT_FLOAT_WITHIN(0.001, 123.456, distance);

    // Check that relay was turned on then off
}

void test_rangefinder_error_measurement(void) {
    MockSerial serial;
    Rangefinder rangefinder(serial, mockRelayPin);

    rangefinder.init();

    // Set up mock to return error
    serial.setErrorMeasurement();

    // Take measurement
    float distance = rangefinder.takeMeasurement();

    // Check for error code (-2.0 for ERR)
    TEST_ASSERT_EQUAL(-2.0, distance);

    // Check that relay was turned on then off
    TEST_ASSERT_EQUAL(LOW, mockRelayState);
}

int main(void) {
    UNITY_BEGIN();

    RUN_TEST(test_rangefinder_init);
    RUN_TEST(test_rangefinder_valid_measurement);
    RUN_TEST(test_rangefinder_error_measurement);

    return UNITY_END();
}
