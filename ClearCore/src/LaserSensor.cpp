#include "LaserSensor.h"
#include "MotionController.h" // For pin definitions

void LaserSensor::begin() {
    Serial1.begin(9600);
    LASER_POWER.Mode(Connector::OUTPUT_DIGITAL);
    LASER_POWER.State(false);
}

void LaserSensor::powerOn() {
    LASER_POWER.State(true);
    delay(100);  // Initialization delay
}

void LaserSensor::powerOff() {
    Serial1.write(STOP_CMD, 3);
    delay(50);
    LASER_POWER.State(false);
}

void LaserSensor::startMeasuring() {
    Serial1.write(CONTINUOUS_MEASURE_CMD, 4);
}

float LaserSensor::readDistance() {
    if (Serial1.available() < 11) {
        return -1;  // Not enough data
    }
    
    // Read full data packet
    for (int i = 0; i < 11; i++) {
        data[i] = Serial1.read();
    }
    
    // Verify checksum
    uint8_t check = 0;
    for (int i = 0; i < 10; i++) {
        check += data[i];
    }
    check = ~check + 1;
    
    if (data[10] != check) {
        return -2;  // Checksum error
    }
    
    // Check for error condition
    if (data[3] == 'E' && data[4] == 'R' && data[5] == 'R') {
        return -3;  // Out of range
    }
    
    // Parse distance value (format: XXX.YYY)
    float distance = (data[3] - '0') * 100.0f +
                    (data[4] - '0') * 10.0f +
                    (data[5] - '0') * 1.0f +
                    (data[7] - '0') * 0.1f +
                    (data[8] - '0') * 0.01f +
                    (data[9] - '0') * 0.001f;
    
    return distance;
}