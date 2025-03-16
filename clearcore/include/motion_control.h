/**
 * Space Maquette - Motion Control Module
 *
 * Handles control of ClearPath servo motors for X, Y, Z, and Pan axes,
 * plus tilt servo control. Implements homing, absolute positioning,
 * and status reporting.
 */

#pragma once

#include <Arduino.h>
#include <ClearCore.h>

// Motion control constants
#define MAX_X          2000.0  // mm
#define MAX_Y          2000.0  // mm
#define MAX_Z          1000.0  // mm
#define SAFE_Z         50.0    // mm - safe height for motion
#define MIN_TILT_ANGLE 0.0     // degrees
#define MAX_TILT_ANGLE 90.0    // degrees
#define MIN_PAN_ANGLE  0.0     // degrees
#define MAX_PAN_ANGLE  360.0   // degrees

// Motion state enumeration
enum MotionState { IDLE, HOMING, MOVING, ERROR };

class MotionControl {
public:
    // Constructor
    MotionControl();

    // Initialize motion control
    void init();

    // Homing functions
    bool homeAll();
    bool homeX();
    bool homeY();
    bool homeZ();
    bool homePan();

    // Position control
    bool moveToPosition(float x, float y, float z, float pan, float tilt);
    bool setTiltAngle(float angle);
    bool setPanAngle(float angle);
    void stop();

    // Velocity control
    void setVelocity(float vx, float vy, float vz);

    // Status functions
    bool isMoving() const;
    bool isHomed() const;
    float getPositionX() const;
    float getPositionY() const;
    float getPositionZ() const;
    float getPanAngle() const;
    float getTiltAngle() const;

    // Update motion state (call in main loop)
    void update();

    // Enable/disable motors
    void enableMotors(bool enable);

private:
    // Motor definitions
    const MotorDriver _motorX = MotorDriver::MOTOR_1;
    const MotorDriver _motorY = MotorDriver::MOTOR_2;
    const MotorDriver _motorZ = MotorDriver::MOTOR_3;
    const MotorDriver _motorPan = MotorDriver::MOTOR_4;

    // Pin for tilt servo
    int _tiltServoPin;

    // Current positions
    float _positionX;
    float _positionY;
    float _positionZ;
    float _panAngle;
    float _tiltAngle;

    // Target positions
    float _targetX;
    float _targetY;
    float _targetZ;
    float _targetPan;
    float _targetTilt;

    // Velocities
    float _velocityX;
    float _velocityY;
    float _velocityZ;

    // System state
    MotionState _state;
    bool _homed;

    // Setup motors
    void setupMotors();

    // Convert angle to PWM for tilt servo
    int angleToPWM(float angle);
};