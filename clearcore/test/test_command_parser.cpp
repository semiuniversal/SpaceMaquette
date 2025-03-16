/**
 * Space Maquette - Command Parser Tests
 * 
 * Unit tests for the command parser module.
 */

 #include <unity.h>
 #include "../include/command_parser.h"
 
 // Mock serial class for testing
 class MockSerial : public Stream {
 public:
     MockSerial() : _available(0), _position(0), _responseCount(0) {}
     
     // Add a command to the input buffer
     void addCommand(const char* command) {
         for (size_t i = 0; command[i] != '\0' && _available < sizeof(_buffer); i++) {
             _buffer[_available++] = command[i];
         }
     }
     
     // Check response count
     int getResponseCount() const {
         return _responseCount;
     }
     
     // Get last response
     const char* getLastResponse() const {
         return _lastResponse;
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
         // Capture response
         if (_responseCount < sizeof(_lastResponse) - 1) {
             _lastResponse[_responseCount++] = data;
             _lastResponse[_responseCount] = '\0';
         }
         return 1;
     }
     
     virtual size_t write(const uint8_t* buffer, size_t size) override {
         // Capture response
         for (size_t i = 0; i < size && _responseCount < sizeof(_lastResponse) - 1; i++) {
             _lastResponse[_responseCount++] = buffer[i];
             _lastResponse[_responseCount] = '\0';
         }
         return size;
     }
     
     virtual void flush() override {}
     
 private:
     byte _buffer[128];
     int _available;
     int _position;
     char _lastResponse[128];
     int _responseCount;
 };
 
 // Command handler flag for testing
 bool commandHandlerCalled = false;
 char lastCommand[32] = "";
 int lastParamCount = 0;
 
 void testCommandHandler(CommandParser& parser) {
     commandHandlerCalled = true;
     strcpy(lastCommand, parser.getCommand());
     lastParamCount = parser.getParamCount();
 }
 
 void setUp(void) {
     // Reset test state
     commandHandlerCalled = false;
     lastCommand[0] = '\0';
     lastParamCount = 0;
 }
 
 void test_parser_init(void) {
     MockSerial serial;
     CommandParser parser(serial);
     
     parser.init();
     
     // Not much to test for init, just make sure it doesn't crash
     TEST_ASSERT_TRUE(true);
 }
 
 void test_parser_basic_command(void) {
     MockSerial serial;
     CommandParser parser(serial);
     
     parser.init();
     parser.setCommandHandler(testCommandHandler);
     
     // Add a simple command
     serial.addCommand("PING\n");
     
     // Process command
     bool result = parser.update();
     
     // Check that command was processed
     TEST_ASSERT_TRUE(result);
     TEST_ASSERT_TRUE(commandHandlerCalled);
     TEST_ASSERT_EQUAL_STRING("PING", lastCommand);
     TEST_ASSERT_EQUAL(0, lastParamCount);
 }
 
 void test_parser_command_with_params(void) {
     MockSerial serial;
     CommandParser parser(serial);
     
     parser.init();
     parser.setCommandHandler(testCommandHandler);
     
     // Add command with parameters
     serial.addCommand("MOVE:100.5,200.3,50.0\n");
     
     // Process command
     bool result = parser.update();
     
     // Check that command was processed
     TEST_ASSERT_TRUE(result);
     TEST_ASSERT_TRUE(commandHandlerCalled);
     TEST_ASSERT_EQUAL_STRING("MOVE", lastCommand);
     TEST_ASSERT_EQUAL(3, lastParamCount);
     
     // Check parameter values
     TEST_ASSERT_EQUAL_FLOAT(100.5, parser.getParamAsFloat(0));
     TEST_ASSERT_EQUAL_FLOAT(200.3, parser.getParamAsFloat(1));
     TEST_ASSERT_EQUAL_FLOAT(50.0, parser.getParamAsFloat(2));
 }
 
 void test_parser_send_response(void) {
     MockSerial serial;
     CommandParser parser(serial);
     
     parser.init();
     
     // Send a response
     parser.sendResponse("OK", "TEST_RESPONSE");
     
     // Check response
     TEST_ASSERT_GREATER_THAN(0, serial.getResponseCount());
     TEST_ASSERT_TRUE(strstr(serial.getLastResponse(), "OK:TEST_RESPONSE") != NULL);
 }
 
 void test_parser_formatted_response(void) {
     MockSerial serial;
     CommandParser parser(serial);
     
     parser.init();
     
     // Send a formatted response
     parser.sendFormattedResponse("OK", "Value: %.2f", 123.456);
     
     // Check response
     TEST_ASSERT_GREATER_THAN(0, serial.getResponseCount());
     TEST_ASSERT_TRUE(strstr(serial.getLastResponse(), "OK:Value: 123.46") != NULL);
 }
 
 int main(void) {
     UNITY_BEGIN();
     
     RUN_TEST(test_parser_init);
     RUN_TEST(test_parser_basic_command);
     RUN_TEST(test_parser_command_with_params);
     RUN_TEST(test_parser_send_response);
     RUN_TEST(test_parser_formatted_response);
     
     return UNITY_END();
 }
 