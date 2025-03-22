/**
 * Space Maquette - Configuration Manager
 *
 * Handles loading and saving configuration data from SD card.
 * Provides a centralized interface for accessing system parameters.
 */

#ifndef CONFIGURATION_MANAGER_H
#define CONFIGURATION_MANAGER_H

#include <Arduino.h>
#include <SD.h>
#include <SPI.h>

class ConfigurationManager {
public:
    // Constructor
    ConfigurationManager(const char* configFile = "CONFIG.TXT");

    // Initialization
    bool init();

    // Load configuration from SD card
    bool loadConfig();

    // Save configuration to SD card
    bool saveConfig();

    // Get configuration values with defaults
    int getInt(const char* key, int defaultValue = 0);
    float getFloat(const char* key, float defaultValue = 0.0f);
    bool getBool(const char* key, bool defaultValue = false);
    String getString(const char* key, const String& defaultValue = "");

    // Set configuration values
    void setInt(const char* key, int value);
    void setFloat(const char* key, float value);
    void setBool(const char* key, bool value);
    void setString(const char* key, const String& value);

    // Check if a key exists
    bool hasKey(const char* key);

    // Clear all configuration
    void clear();

    // Debug - dump all configuration items to Serial
    void dumpConfig();

private:
    // Config file path
    String _configFilePath;

    // SD card initialized flag
    bool _sdInitialized;

    // Configuration data storage
    struct ConfigItem {
        String key;
        String value;
    };

    // Maximum configuration items
    static const int MAX_CONFIG_ITEMS = 50;

    // Configuration data array
    ConfigItem _configData[MAX_CONFIG_ITEMS];
    int _configCount;

    // Helper methods
    int findKey(const char* key);
    bool parseConfigLine(const String& line);
    String formatConfigLine(const ConfigItem& item);
};

#endif  // CONFIGURATION_MANAGER_H