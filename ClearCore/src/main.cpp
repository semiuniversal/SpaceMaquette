#include "ClearCore.h"
#include "MotionController.h"
#include "LaserSensor.h"
#include "NetworkInterface.h"

// System components
MotionController motion;
LaserSensor laser;
NetworkInterface network;

// Safety and status flags
bool emergencyStop = false;
uint32_t lastStatusUpdate = 0;
const uint32_t STATUS_INTERVAL = 100; // ms

void setup() {
    // Initialize hardware
    ConnectorCOM0.Mode(Connector::USB_CDC);
    ConnectorCOM0.Speed(115200);
    
    // Initialize subsystems
    motion.begin();
    laser.begin();
    network.begin();
    
    // Initial hardware setup
    motion.zeroAllAxes();
    laser.powerOn();
    laser.startMeasuring();
    
    Serial.println("Space Maquette system initialized");
}

void loop() {
    // Emergency stop check
    if (emergencyStop) {
        motion.checkSafetyLimits();
        return;
    }
    
    // Process network commands and motion updates
    network.update();
    motion.update();
    
    // Regular status updates
    uint32_t now = millis();
    if (now - lastStatusUpdate >= STATUS_INTERVAL) {
        MotionController::Position pos = motion.getCurrentPosition();
        network.sendStatus(pos);
        
        if (motion.isAtTarget()) {
            float distance = laser.readDistance();
            network.sendLaserData(distance);
        }
        
        lastStatusUpdate = now;
    }
    
    // Safety checks
    if (!motion.checkSafetyLimits()) {
        emergencyStop = true;
        Serial.println("Emergency stop triggered");
    }
}