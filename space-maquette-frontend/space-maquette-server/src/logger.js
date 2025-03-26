// logger.js
const debug = true;

module.exports = function logDebug(...args) {
  if (debug) {
    console.log(`[DEBUG ${new Date().toISOString()}]`, ...args);
  }
};
