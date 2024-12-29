#pragma once
#include "ClearCore.h"

class LaserSensor {
public:
    void begin();
    void powerOn();
    void powerOff();
    void startMeasuring();
    float readDistance();

private:
    const uint8_t CONTINUOUS_MEASURE_CMD[4] = {0x80, 0x06, 0x03, 0x77};
    const uint8_t STOP_CMD[3] = {0x80, 0x04, 0x02, 0x7A};
    uint8_t data[11] = {0};
};