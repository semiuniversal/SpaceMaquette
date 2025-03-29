// src/logger.js
const fs = require('fs');
const path = require('path');

let debugFlags = { default: false }; // Default config

try {
  const configPath = path.join(__dirname, 'logger.config.json');
  if (fs.existsSync(configPath)) {
    const configFile = fs.readFileSync(configPath);
    const configFromFile = JSON.parse(configFile.toString());
    // Merge loaded config with defaults, ensuring default exists
    debugFlags = { ...debugFlags, ...configFromFile };
    console.log(`[Logger] Logging config loaded:`, debugFlags);
  } else {
     console.log(`[Logger] Config file not found at ${configPath}. Using default flags:`, debugFlags);
  }
} catch (error) {
  console.error('[Logger] Error reading or parsing logger.config.json:', error);
  // Keep default flags if there's an error
}

/**
 * Logs debug messages if the corresponding key is enabled in logger.config.json
 * or if the "default" key is enabled.
 * @param {string} key - The key representing the module or feature area.
 * @param {...any} args - The messages/objects to log.
 */
function logDebug(key, ...args) {
  // Log if the specific key is true OR if the default is true
  if (debugFlags[key] === true || (debugFlags[key] === undefined && debugFlags.default === true)) {
    // Add the key to the output for context
    console.info(`[DEBUG][${key}][${new Date().toISOString()}]`, ...args);
  }
}

module.exports = {
  logDebug,
  // Optionally export the flags if needed elsewhere, though not recommended for modification
  // getDebugFlags: () => ({ ...debugFlags })
};