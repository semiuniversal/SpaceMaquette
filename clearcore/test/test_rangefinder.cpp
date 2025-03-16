/**
 * Space Maquette - Rangefinder Tests
 * 
 * Unit tests for the rangefinder module.
 */

 #include <unity.h>
 #include "../include/rangefinder.h"
 
 // Mock serial class for testing
 class MockSerial : public Stream {
 public:
     MockSerial() : _available(0), _position(0) {}
     
     // Add data to receive buffer
     void addData(const byte* data, size_t length) {
         for (size_t i = 0; i < length && _available < sizeof(_buffer); i++) {
             _buffer[_available++] = data[i];
         }
     }
     
     // Set buffer to valid measurement frame (123.456m)
     void setValidMeasurement() {
         // ADDR=0x80, GRP=0x06, CMD=0x83, '1', '2', '3', '.', '4', '5', '6', CS
         byte frame[] = {0x80, 0x06, 0x83, '1', '2', '3', '.', '4', '5', '6', 0xB5};
         addData(frame, sizeof(frame));
     }
     
     // Set buffer to error frame
     void setErrorMeasurement() {
         // ADDR=0x80, GRP=0x06, CMD=0x83, 'E', 'R', 'R', '-', '-', '0', '0', CS
         byte frame[] = {0x80, 0x06, 0x83, 'E', 'R', 'R', '-', '-', '0', '0', 0xB7};
         addData(frame, sizeof(frame));
     }
     
     // Stream interface implementation
     virtual int available() override { return _available; }
     
     virtual int read() override {
         if (_available <= 0) return -1;
         byte data = _buffer[_position++];
         _available--;
         return data;
     }
     
     virtual int peek() override {
         if (_available <= 0) return -1;
         return _buffer[_position];
     }
     
     virtual size_t write(uint8_t data) override {
         // Just capture the write, don't actually do anything
         return 1;
     }
     
     virtual size_t write(const uint8_t* buffer, size_t size) override {
         // Just capture the write, don't actually do anything
         return size;
     }
     
     virtual void flush() override {}
     
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
     TEST_ASSERT_EQUAL(LOW, mockRelayState);
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
 