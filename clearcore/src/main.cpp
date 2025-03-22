#include <Arduino.h>

#include "ClearCore.h"
/**
 * Space Maquette - Main Program
 *
 * Main program for the ClearCore controller firmware.
 * Handles initialization and main loop processing.
 *
 * Author: William Tremblay (firmware by Claude)
 * Date: March 2025
 */

// Include modules
#include "command_handler.h"
#include "command_parser.h"
#include "configuration_manager.h"
#include "emergency.h"
#include "ethernet_device.h"
#include "motion_control.h"
#include "rangefinder.h"
#include "serial_devices.h"
#include "tilt_servo.h"
#include "web_server.h"

// Enable debug output to USB serial
#define DEBUG 1

// Pin definitions
#define ESTOP_PIN DI6
#define RELAY_PIN IO0
// Remove TILT_SERVO_PIN definition as it's already defined in motion_control.h

// Ethernet configuration
#define ETHERNET_PORT     8080
#define WEBSERVER_PORT    8000
#define ETHERNET_LOG_FILE "ETHERNET.LOG"

// Create system objects
EthernetDevice ethernetDevice(ETHERNET_PORT);     // Using Ethernet for host communication
WebServer webServer(WEBSERVER_PORT);              // Web server for SD card browser
CommandParser parser(ethernetDevice);             // Using Ethernet instead of Serial0
SerialDevices serialDevices(Serial1, RELAY_PIN);  // Using Serial1 (COM1) with relay pin
Rangefinder rangefinder(serialDevices);
TiltServo tiltServo(serialDevices);
MotionControl motion;  // Standard initialization, tilt servo handled separately
EmergencyStop estop(ESTOP_PIN);
ConfigurationManager config("CONFIG.TXT");
CommandHandler cmdHandler(parser, motion, rangefinder, estop, config);

// Print Ethernet diagnostics to Serial debug output
void printEthernetDiagnostics() {
#ifdef DEBUG
    EthernetDevice::NetworkStats stats = ethernetDevice.getNetworkStats();

    Serial.println("\nEthernet Status Report:");
    Serial.println("---------------------");

    // Connection state
    Serial.print("Connection State: ");
    switch (ethernetDevice.getConnectionState()) {
        case EthernetDevice::DISCONNECTED:
            Serial.println("DISCONNECTED");
            break;
        case EthernetDevice::CONNECTING:
            Serial.println("CONNECTING");
            break;
        case EthernetDevice::CONNECTED:
            Serial.println("CONNECTED");
            break;
        case EthernetDevice::CONNECTION_ERROR:
            Serial.print("ERROR (");
            Serial.print(ethernetDevice.getErrorString(ethernetDevice.getLastError()));
            Serial.println(")");
            break;
        case EthernetDevice::TIMEOUT:
            Serial.println("TIMEOUT");
            break;
        case EthernetDevice::RECONNECTING:
            Serial.println("RECONNECTING");
            break;
        default:
            Serial.println("UNKNOWN");
            break;
    }

    // IP Address
    Serial.print("IP Address: ");
    Serial.print(ethernetDevice.getIpAddressString());
    Serial.print(":");
    Serial.println(ethernetDevice.getPort());

    // Connection stats
    Serial.println("Statistics:");
    Serial.print("  Uptime: ");
    Serial.print(stats.uptime / 1000);
    Serial.println(" seconds");

    Serial.print("  Connections: ");
    Serial.println(stats.connectionCount);

    Serial.print("  Data: Sent=");
    Serial.print(stats.totalBytesSent);
    Serial.print(" bytes, Received=");
    Serial.print(stats.totalBytesReceived);
    Serial.println(" bytes");

    Serial.print("  Errors: ");
    Serial.println(stats.errorCount);

    Serial.print("  Reconnects: ");
    Serial.print(stats.reconnectAttempts);
    Serial.print(" attempts, ");
    Serial.print(stats.reconnectSuccess);
    Serial.println(" successful");

    // Current session
    if (ethernetDevice.getConnectionState() == EthernetDevice::CONNECTED) {
        Serial.print("  Session Duration: ");
        Serial.print(stats.connectionDuration / 1000);
        Serial.println(" seconds");
    }

    Serial.println("---------------------");
#endif
}

void setup() {
    // Initialize USB serial for debugging
    Serial.begin(115200);
    delay(2000);  // Allow time for USB connection if debugging

    Serial.println("Space Maquette Controller v1.0 (Ethernet)");
    Serial.println("----------------------------------");

    // Initialize config first so we can load Ethernet settings
    bool configLoaded = config.init();
#ifdef DEBUG
    if (configLoaded) {
        Serial.println("Configuration loaded successfully");
        config.dumpConfig();  // Dump configuration to serial
    } else {
        Serial.println("Using default configuration");
        Serial.println("ERROR: Failed to load configuration file");
        config.dumpConfig();  // Show what defaults are being used
    }
#endif

    // Configure Ethernet logging if SD card is available
    if (configLoaded) {
        // Enable Ethernet logging if configured
        bool loggingEnabled = config.getBool("ethernet_logging", false);
        if (loggingEnabled) {
            String logFile = config.getString("ethernet_log_file", ETHERNET_LOG_FILE);
            ethernetDevice.setLogFile(logFile.c_str());

            int logLevel = config.getInt("ethernet_log_level", EthernetDevice::LOG_WARNING);
            ethernetDevice.setLogLevel(static_cast<EthernetDevice::LogLevel>(logLevel));

            Serial.print("Ethernet logging enabled to: ");
            Serial.println(logFile);
        }
    }

    // Initialize Ethernet for host communication
    Serial.println("Initializing Ethernet...");
    bool ethernetInitSuccess = ethernetDevice.init();

#ifdef DEBUG
    if (ethernetInitSuccess) {
        Serial.print("Ethernet initialized successfully. IP: ");
        Serial.println(ethernetDevice.getIpAddressString());
        Serial.print("Listening on port: ");
        Serial.println(ETHERNET_PORT);
    } else {
        Serial.println("ERROR: Failed to initialize Ethernet");
        Serial.print("Last error: ");
        Serial.println(ethernetDevice.getErrorString(ethernetDevice.getLastError()));
        Serial.println("Check Ethernet cable and network settings");

        // PhyLinkActive state
        bool linkActive = ClearCore::EthernetManager::Instance().PhyLinkActive();
        Serial.print("Physical link active: ");
        Serial.println(linkActive ? "YES" : "NO");
    }

    // Apply any Ethernet configuration values
    if (configLoaded) {
        // Configure connection timeout
        int timeout = config.getInt("ethernet_timeout", 60000);
        ethernetDevice.setConnectionTimeout(timeout);

        // Configure heartbeat interval
        int heartbeat = config.getInt("ethernet_heartbeat", 10000);
        ethernetDevice.setHeartbeatInterval(heartbeat);

        // Configure reconnection
        bool reconnect = config.getBool("ethernet_reconnect", true);
        ethernetDevice.setReconnectEnabled(reconnect);

        Serial.print("Ethernet timeout: ");
        Serial.print(timeout / 1000);
        Serial.println(" seconds");

        Serial.print("Heartbeat interval: ");
        Serial.print(heartbeat / 1000);
        Serial.println(" seconds");

        Serial.print("Auto reconnect: ");
        Serial.println(reconnect ? "Enabled" : "Disabled");
    }
#endif

    // Initialize web server if enabled
    bool webServerEnabled = config.getBool("webserver_enabled", true);
    if (webServerEnabled) {
        Serial.println("Initializing Web Server...");
        bool webServerInitSuccess = webServer.init();

#ifdef DEBUG
        if (webServerInitSuccess) {
            Serial.print("Web server initialized successfully. ");
            Serial.print("Access at http://");
            Serial.print(webServer.getIpAddressString());
            Serial.print(":");
            Serial.println(WEBSERVER_PORT);
        } else {
            Serial.println("WARNING: Failed to initialize web server");
        }
#endif
    }

    // Initialize serial devices module (controls COM1 access)
    serialDevices.init();
    Serial1.begin(9600);  // Initialize COM1 for both rangefinder and tilt servo

    // Initialize system components
    parser.init();
    motion.setTiltServo(&tiltServo);  // Connect the tilt servo to motion control
    motion.init();
    rangefinder.begin();  // Using begin() instead of init()
    estop.init();

    // Initialize tilt servo with configuration parameters
    tiltServo.begin();  // Using begin() instead of init()
    tiltServo.setLimits(config.getInt("tilt_min", 45), config.getInt("tilt_max", 135));
    bool tiltInitSuccess = true;

#ifdef DEBUG
    if (tiltInitSuccess) {
        Serial.println("Tilt servo initialized successfully");
    } else {
        Serial.println("WARNING: Failed to initialize tilt servo");
    }
#endif

    // Apply configuration to subsystems
    if (configLoaded) {
        // Set motor velocities
        motion.setVelocity(config.getInt("velocity_x", DEFAULT_VELOCITY_LIMIT),
                           config.getInt("velocity_y", DEFAULT_VELOCITY_LIMIT),
                           config.getInt("velocity_z", DEFAULT_VELOCITY_LIMIT));

        // Set motor acceleration
        motion.setAcceleration(config.getInt("acceleration", DEFAULT_ACCELERATION_LIMIT));

        // Set tilt limits
        motion.setTiltLimits(config.getInt("tilt_min", 45), config.getInt("tilt_max", 135));
    }

    // Initialize command handler after configuration is loaded
    cmdHandler.init();

    // Print initial Ethernet diagnostics
#ifdef DEBUG
    printEthernetDiagnostics();
#endif

    Serial.println("System initialization complete");
    Serial.println("----------------------------------");
}

// Variables for periodic status reporting
unsigned long lastStatusTime = 0;
const unsigned long STATUS_INTERVAL = 30000;  // 30 seconds

void loop() {
    // Update Ethernet connection
    ethernetDevice.update();

    // Update web server
    webServer.update();

    // Check for emergency stop condition
    if (estop.check()) {
        // ESTOP newly activated
        parser.sendResponse("INFO", "ESTOP_ACTIVATED");
    }

    // Process incoming commands
    parser.update();

    // Update motion state if moving
    if (motion.isMoving() && !estop.isActive()) {
        motion.update();
    }

    // Periodic status reporting
#ifdef DEBUG
    unsigned long currentTime = millis();
    if (currentTime - lastStatusTime >= STATUS_INTERVAL) {
        lastStatusTime = currentTime;

        // Print periodic status information
        printEthernetDiagnostics();
    }
#endif
}