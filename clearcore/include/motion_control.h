#ifndef MOTION_CONTROL_H
#define MOTION_CONTROL_H

#include "ClearCore.h"

// Define default velocity and acceleration limits
#define DEFAULT_VELOCITY_LIMIT     10000   // pulses per sec
#define DEFAULT_ACCELERATION_LIMIT 100000  // pulses per sec^2

// Define motor connector aliases for clarity in code
#define MOTOR_X_AXIS    ConnectorM0
#define MOTOR_Y_AXIS    ConnectorM1
#define MOTOR_Z_AXIS    ConnectorM2
#define MOTOR_PAN_AXIS  ConnectorM3
#define SERVO_TILT_AXIS ConnectorIO0

class MotionControl {
private:
    // Define motor status flags
    bool _initialized;
    bool _homed;

    // Current positions for each axis
    int32_t _currentX;
    int32_t _currentY;
    int32_t _currentZ;
    int32_t _currentPan;
    int32_t _currentTilt;

    // Speed and acceleration parameters
    int _velocityLimit;
    int _accelerationLimit;

    // Motor enabled states
    bool _xEnabled;
    bool _yEnabled;
    bool _zEnabled;
    bool _panEnabled;
    bool _tiltEnabled;

    // Helper function to check HLFB status
    bool waitForHlfb(MotorDriver &motor, uint32_t timeoutMs = 5000);

    // Alert handling functions
    void printAlerts(MotorDriver &motor);
    bool handleAlerts(MotorDriver &motor);

public:
    // Constructor
    MotionControl();

    // Initialization
    bool initialize();

    // Motor enable/disable functions
    bool enableMotor(char axis);
    bool disableMotor(char axis);
    bool enableAllMotors();
    bool disableAllMotors();

    // Homing functions
    bool homeAxis(char axis);
    bool homeAllAxes();

    // Motion functions
    bool moveAbsolute(char axis, int32_t position);
    bool moveRelative(char axis, int32_t distance);
    bool moveToPosition(int32_t x, int32_t y, int32_t z, int32_t pan = -1, int32_t tilt = -1);
    bool stop();

    // Parameter functions
    void setVelocity(int velocity);
    void setAcceleration(int acceleration);
    int getVelocity();
    int getAcceleration();

    // Position query functions
    int32_t getCurrentPosition(char axis);
    bool isMoving();
    bool isHomed();

    // Status functions
    bool isEnabled(char axis);
    bool hasError();
    const char *getErrorMessage();
};

#endif  // MOTION_CONTROL_H