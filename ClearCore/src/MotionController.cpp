#include "MotionController.h"

void MotionController::begin() {
    // Configure SC motors
    configureSCMotor(X_ENABLE);
    configureSCMotor(Y_ENABLE);
    configureSCMotor(Z_ENABLE);
    
    // Configure pan stepper
    PAN_STEP.Mode(Connector::OUTPUT_DIGITAL);
    PAN_DIR.Mode(Connector::OUTPUT_DIGITAL);
    PAN_EN.Mode(Connector::OUTPUT_DIGITAL);
    PAN_FLAG.Mode(Connector::INPUT_DIGITAL);
    
    // Configure limit switches
    X_LIMIT.Mode(Connector::INPUT_DIGITAL);
    Y_LIMIT.Mode(Connector::INPUT_DIGITAL);
    Z_LIMIT.Mode(Connector::INPUT_DIGITAL);
    
    // Configure tilt servo
    TILT_SERVO.Mode(Connector::OUTPUT_PWM);
    TILT_SERVO.PwmFrequency(50);
    
    // Enable all motors
    X_ENABLE.EnableRequest(true);
    Y_ENABLE.EnableRequest(true);
    Z_ENABLE.EnableRequest(true);
    PAN_EN.State(true);
}

void MotionController::configureSCMotor(MotorDriver& motor) {
    motor.EnableRequest(false);
    motor.Mode(MotorDriver::MOTOR_MODE_MOTOR);
    motor.MotorInAState(false);
    motor.MotorInBState(false);
    motor.VelMax(20000);  // Maximum velocity in counts/sec
    motor.AccelMax(100000); // Maximum acceleration in counts/sec^2
    motor.PositionOffset(0);
    motor.HlfbMode(MotorDriver::HLFB_MODE_HAS_BIPOLAR);
    motor.HlfbCarrier(MotorDriver::HLFB_CARRIER_482_HZ);
}

void MotionController::moveToPosition(const Position& target) {
    isMoving = true;
    
    // Convert to encoder counts
    int32_t xCounts = target.x * CM_TO_COUNTS;
    int32_t yCounts = target.y * CM_TO_COUNTS;
    int32_t zCounts = target.z * CM_TO_COUNTS;
    
    // Move SC motors with position control
    X_ENABLE.Move(xCounts, MotorDriver::MOVE_TARGET_ABSOLUTE);
    Y_ENABLE.Move(yCounts, MotorDriver::MOVE_TARGET_ABSOLUTE);
    Z_ENABLE.Move(zCounts, MotorDriver::MOVE_TARGET_ABSOLUTE);
    
    // Handle pan stepper
    int32_t panSteps = (target.pan - currentPos.pan) * DEG_TO_COUNTS;
    if (panSteps) {
        PAN_DIR.State(panSteps > 0);
        for (int32_t i = 0; i < abs(panSteps); i++) {
            PAN_STEP.State(true);
            DelayUsec(100);
            PAN_STEP.State(false);
            DelayUsec(100);
        }
    }
    
    // Update tilt servo
    if (target.tilt != currentPos.tilt) {
        uint16_t pulseWidth = map(target.tilt, -90, 90, 1000, 2000);
        TILT_SERVO.PwmDuty(pulseWidth);
    }
    
    currentPos = target;
    lastMoveTime = millis();
}

void MotionController::update() {
    // Check if all moves are complete
    if (isMoving && isAtTarget()) {
        isMoving = false;
    }
    
    // Monitor safety limits
    checkSafetyLimits();
}

void MotionController::zeroPanAxis() {
    PAN_DIR.State(false);  // CCW direction
    
    // Find flag at slow speed
    while (!PAN_FLAG.State()) {
        PAN_STEP.State(true);
        DelayUsec(200);
        PAN_STEP.State(false);
        DelayUsec(200);
        
        if (checkSafetyLimits() == false) return;
    }
    
    // Back off flag
    PAN_DIR.State(true);
    for (int i = 0; i < 50; i++) {
        PAN_STEP.State(true);
        DelayUsec(100);
        PAN_STEP.State(false);
        DelayUsec(100);
    }
    
    // Approach slowly
    PAN_DIR.State(false);
    while (!PAN_FLAG.State()) {
        PAN_STEP.State(true);
        DelayUsec(400);
        PAN_STEP.State(false);
        DelayUsec(400);
        
        if (checkSafetyLimits() == false) return;
    }
    
    currentPos.pan = 0;
}

void MotionController::zeroAllAxes() {
    isMoving = true;
    
    // Disable position control temporarily
    X_ENABLE.EnableRequest(false);
    Y_ENABLE.EnableRequest(false);
    Z_ENABLE.EnableRequest(false);
    
    // Configure for homing
    X_ENABLE.Mode(MotorDriver::MOTOR_MODE_STEP_DIR);
    Y_ENABLE.Mode(MotorDriver::MOTOR_MODE_STEP_DIR);
    Z_ENABLE.Mode(MotorDriver::MOTOR_MODE_STEP_DIR);
    
    // Zero Z first for safety
    while (!Z_LIMIT.State()) {
        Z_ENABLE.StepDirection(false);
        DelayUsec(100);
        if (checkSafetyLimits() == false) break;
    }
    
    // Zero X and Y
    while (!X_LIMIT.State()) {
        X_ENABLE.StepDirection(false);
        DelayUsec(100);
        if (checkSafetyLimits() == false) break;
    }
    
    while (!Y_LIMIT.State()) {
        Y_ENABLE.StepDirection(false);
        DelayUsec(100);
        if (checkSafetyLimits() == false) break;
    }
    
    // Reset to position control mode
    configureSCMotor(X_ENABLE);
    configureSCMotor(Y_ENABLE);
    configureSCMotor(Z_ENABLE);
    
    X_ENABLE.EnableRequest(true);
    Y_ENABLE.EnableRequest(true);
    Z_ENABLE.EnableRequest(true);
    
    // Zero pan axis
    zeroPanAxis();
    
    // Set tilt to zero
    TILT_SERVO.PwmDuty(1500); // Center position
    
    currentPos = {0, 0, 0, 0, 0};
    isMoving = false;
}

bool MotionController::checkSafetyLimits() {
    if (X_LIMIT.State() || Y_LIMIT.State() || Z_LIMIT.State()) {
        X_ENABLE.EnableRequest(false);
        Y_ENABLE.EnableRequest(false);
        Z_ENABLE.EnableRequest(false);
        PAN_EN.State(false);
        isMoving = false;
        return false;
    }
    return true;
}

bool MotionController::isAtTarget() {
    return X_ENABLE.StepsComplete() && 
           Y_ENABLE.StepsComplete() && 
           Z_ENABLE.StepsComplete() && 
           (millis() - lastMoveTime > 100);
}

Position MotionController::getCurrentPosition() const {
    return currentPos;
}