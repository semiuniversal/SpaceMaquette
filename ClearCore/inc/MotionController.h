#pragma once
#include "ClearCore.h"

// Physical constants
#define CM_TO_COUNTS 4000      // Encoder counts per cm of travel
#define DEG_TO_COUNTS 111      // Encoder counts per degree rotation

// Pin definitions
#define X_ENABLE ConnectorM0
#define X_A_INPUT ConnectorM0_A
#define X_B_INPUT ConnectorM0_B
#define Y_ENABLE ConnectorM1
#define Y_A_INPUT ConnectorM1_A
#define Y_B_INPUT ConnectorM1_B
#define Z_ENABLE ConnectorM2
#define Z_A_INPUT ConnectorM2_A
#define Z_B_INPUT ConnectorM2_B
#define PAN_STEP ConnectorIO5
#define PAN_DIR ConnectorIO6
#define PAN_EN ConnectorIO7
#define PAN_FLAG ConnectorDI6
#define TILT_SERVO ConnectorA9
#define X_LIMIT ConnectorDI7
#define Y_LIMIT ConnectorDI8
#define Z_LIMIT ConnectorDI9

class MotionController {
public:
    struct Position {
        float x, y, z;
        float pan, tilt;
    };

    void begin();
    void update();
    void zeroAllAxes();
    bool isAtTarget();
    void checkSafetyLimits();
    void moveToPosition(const Position& target);
    Position getCurrentPosition() const;

private:
    Position currentPos = {0, 0, 0, 0, 0};
    bool isMoving = false;
    uint32_t lastMoveTime = 0;

    void configureSCMotor(MotorDriver& motor);
    void zeroPanAxis();
};