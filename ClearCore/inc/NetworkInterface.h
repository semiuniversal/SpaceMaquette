#include "NetworkInterface.h"

void NetworkInterface::begin() {
    IPAddress ip(192, 168, 1, 177);
    IPAddress gateway(192, 168, 1, 1);
    IPAddress subnet(255, 255, 255, 0);
    
    EthernetMgr.Setup();
    EthernetMgr.LocalIP(ip);
    EthernetMgr.Gateway(gateway);
    EthernetMgr.NetMask(subnet);
    
    server.begin();
}

void NetworkInterface::update() {
    EthernetClient client = server.available();
    if (client) {
        if (client.available()) {
            DeserializationError error = deserializeJson(doc, client);
            
            if (!error) {
                const char* cmd = doc["cmd"];
                JsonObject params = doc["params"];
                handleCommand(cmd, params);
            }
            sendResponse(client);
        }
        client.stop();
    }
}

void NetworkInterface::handleCommand(const char* cmd, JsonObject params) {
    if (strcmp(cmd, "move") == 0) {
        handleMove(params);
    }
    else if (strcmp(cmd, "zero") == 0) {
        motion.zeroAllAxes();
    }
    else if (strcmp(cmd, "stop") == 0) {
        // Implement emergency stop
    }
}

void NetworkInterface::handleMove(JsonObject params) {
    MotionController::Position target = motion.getCurrentPosition();
    
    if (params.containsKey("x")) target.x = params["x"];
    if (params.containsKey("y")) target.y = params["y"];
    if (params.containsKey("z")) target.z = params["z"];
    if (params.containsKey("pan")) target.pan = params["pan"];
    if (params.containsKey("tilt")) target.tilt = params["tilt"];
    
    motion.moveToPosition(target);
}

void NetworkInterface::sendResponse(EthernetClient& client) {
    doc.clear();
    MotionController::Position pos = motion.getCurrentPosition();
    
    JsonObject position = doc.createNestedObject("position");
    position["x"] = pos.x;
    position["y"] = pos.y;
    position["z"] = pos.z;
    position["pan"] = pos.pan;
    position["tilt"] = pos.tilt;
    
    doc["moving"] = !motion.isAtTarget();
    
    serializeJson(doc, client);
    client.println();
}

void NetworkInterface::sendLaserData(float distance) {
    // Create a new connection for push updates if needed
    // or store for next status update
}

void NetworkInterface::sendStatus(const MotionController::Position& pos) {
    // Periodic status updates to connected clients
}