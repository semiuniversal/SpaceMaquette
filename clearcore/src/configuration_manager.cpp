/**
 * Space Maquette - Configuration Manager Implementation
 */

#include "../include/configuration_manager.h"

// Constructor
ConfigurationManager::ConfigurationManager(const char* configFile)
    : _configFilePath(configFile), _sdInitialized(false), _configCount(0) {}

// Initialize the configuration manager
bool ConfigurationManager::init() {
    // Initialize SD card
    _sdInitialized = SD.begin();

#ifdef DEBUG
    if (!_sdInitialized) {
        Serial.println("Failed to initialize SD card");
    } else {
        Serial.println("SD card initialized");
    }
#endif

    // Try to load configuration file
    if (_sdInitialized) {
        return loadConfig();
    }

    return false;
}

// Load configuration from SD card
bool ConfigurationManager::loadConfig() {
    if (!_sdInitialized && !SD.begin()) {
#ifdef DEBUG
        Serial.print("SD card not initialized, cannot load config: ");
        Serial.println(_configFilePath);
#endif
        return false;
    }

    // Clear existing configuration
    clear();

    // Open configuration file
    File configFile = SD.open(_configFilePath);
    if (!configFile) {
#ifdef DEBUG
        Serial.print("Failed to open config file: ");
        Serial.println(_configFilePath);
#endif
        return false;
    }

#ifdef DEBUG
    Serial.print("Loading configuration from: ");
    Serial.println(_configFilePath);
#endif

    // Read and parse each line
    while (configFile.available() && _configCount < MAX_CONFIG_ITEMS) {
        String line = configFile.readStringUntil('\n');
        line.trim();

        // Skip empty lines and comments
        if (line.length() == 0 || line.startsWith("#")) {
            continue;
        }

        // Parse config line
        if (!parseConfigLine(line)) {
#ifdef DEBUG
            Serial.print("Failed to parse config line: ");
            Serial.println(line);
#endif
        }
    }

    configFile.close();

#ifdef DEBUG
    Serial.print("Loaded ");
    Serial.print(_configCount);
    Serial.println(" configuration items");
#endif

    return true;
}

// Save configuration to SD card
bool ConfigurationManager::saveConfig() {
    if (!_sdInitialized && !SD.begin()) {
#ifdef DEBUG
        Serial.print("SD card not initialized, cannot save config: ");
        Serial.println(_configFilePath);
#endif
        return false;
    }

    // Remove existing file if it exists
    if (SD.exists(_configFilePath)) {
        SD.remove(_configFilePath);
    }

    // Create a new configuration file
    File configFile = SD.open(_configFilePath, FILE_WRITE);
    if (!configFile) {
#ifdef DEBUG
        Serial.print("Failed to create config file: ");
        Serial.println(_configFilePath);
#endif
        return false;
    }

#ifdef DEBUG
    Serial.print("Saving configuration to: ");
    Serial.println(_configFilePath);
#endif

    // Write header
    configFile.println("# Space Maquette Configuration");
    configFile.println("# Generated: " + String(millis()));
    configFile.println();

    // Write all configuration items
    for (int i = 0; i < _configCount; i++) {
        configFile.println(formatConfigLine(_configData[i]));
    }

    configFile.close();

#ifdef DEBUG
    Serial.print("Saved ");
    Serial.print(_configCount);
    Serial.println(" configuration items");
#endif

    return true;
}

// Get integer value
int ConfigurationManager::getInt(const char* key, int defaultValue) {
    int index = findKey(key);
    if (index < 0) {
        return defaultValue;
    }

    return _configData[index].value.toInt();
}

// Get float value
float ConfigurationManager::getFloat(const char* key, float defaultValue) {
    int index = findKey(key);
    if (index < 0) {
        return defaultValue;
    }

    return _configData[index].value.toFloat();
}

// Get boolean value
bool ConfigurationManager::getBool(const char* key, bool defaultValue) {
    int index = findKey(key);
    if (index < 0) {
        return defaultValue;
    }

    String value = _configData[index].value;
    value.toLowerCase();

    if (value == "true" || value == "1" || value == "yes" || value == "on") {
        return true;
    } else if (value == "false" || value == "0" || value == "no" || value == "off") {
        return false;
    }

    return defaultValue;
}

// Get string value
String ConfigurationManager::getString(const char* key, const String& defaultValue) {
    int index = findKey(key);
    if (index < 0) {
        return defaultValue;
    }

    return _configData[index].value;
}

// Set integer value
void ConfigurationManager::setInt(const char* key, int value) {
    int index = findKey(key);

    if (index >= 0) {
        // Update existing item
        _configData[index].value = String(value);
    } else if (_configCount < MAX_CONFIG_ITEMS) {
        // Add new item
        _configData[_configCount].key = String(key);
        _configData[_configCount].value = String(value);
        _configCount++;
    }
}

// Set float value
void ConfigurationManager::setFloat(const char* key, float value) {
    int index = findKey(key);

    if (index >= 0) {
        // Update existing item
        _configData[index].value = String(value);
    } else if (_configCount < MAX_CONFIG_ITEMS) {
        // Add new item
        _configData[_configCount].key = String(key);
        _configData[_configCount].value = String(value);
        _configCount++;
    }
}

// Set boolean value
void ConfigurationManager::setBool(const char* key, bool value) {
    int index = findKey(key);

    if (index >= 0) {
        // Update existing item
        _configData[index].value = value ? "true" : "false";
    } else if (_configCount < MAX_CONFIG_ITEMS) {
        // Add new item
        _configData[_configCount].key = String(key);
        _configData[_configCount].value = value ? "true" : "false";
        _configCount++;
    }
}

// Set string value
void ConfigurationManager::setString(const char* key, const String& value) {
    int index = findKey(key);

    if (index >= 0) {
        // Update existing item
        _configData[index].value = value;
    } else if (_configCount < MAX_CONFIG_ITEMS) {
        // Add new item
        _configData[_configCount].key = String(key);
        _configData[_configCount].value = value;
        _configCount++;
    }
}

// Check if key exists
bool ConfigurationManager::hasKey(const char* key) {
    return findKey(key) >= 0;
}

// Clear all configuration
void ConfigurationManager::clear() {
    _configCount = 0;
}

// Find key in configuration data
int ConfigurationManager::findKey(const char* key) {
    for (int i = 0; i < _configCount; i++) {
        if (_configData[i].key.equals(key)) {
            return i;
        }
    }

    return -1;
}

// Parse a configuration line
bool ConfigurationManager::parseConfigLine(const String& line) {
    // Find key-value separator
    int separatorPos = line.indexOf('=');
    if (separatorPos <= 0) {
        return false;
    }

    // Extract key and value
    String key = line.substring(0, separatorPos);
    String value = line.substring(separatorPos + 1);

    // Trim whitespace
    key.trim();
    value.trim();

    // Validate key
    if (key.length() == 0) {
        return false;
    }

    // Check if we have room for another item
    if (_configCount >= MAX_CONFIG_ITEMS) {
        return false;
    }

    // Store key-value pair
    _configData[_configCount].key = key;
    _configData[_configCount].value = value;
    _configCount++;

    return true;
}

// Format a configuration item as a string
String ConfigurationManager::formatConfigLine(const ConfigItem& item) {
    return item.key + "=" + item.value;
}