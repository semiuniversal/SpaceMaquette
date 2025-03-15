#include "stack-debug.h"

#include <Arduino.h>

// Define the variable (only once)
uint32_t stackHighWaterMark = 0;

// Define a stack canary pattern
#define STACK_CANARY 0xABCDEF42

// Estimated stack size for SAME53N19A in ClearCore
// This is an estimate - adjust if you have more specific information
#define ESTIMATED_STACK_SIZE 8192  // 8KB is typical for SAMD51 applications

// Function to initialize the stack monitoring
void initStackMonitoring() {
    // Create a large array on the stack and fill it with canaries
    // This will extend toward the maximum stack depth
    const int bufferSize = 2048;  // Adjust based on available memory
    volatile uint32_t buffer[bufferSize];

    for (int i = 0; i < bufferSize; i++) {
        buffer[i] = STACK_CANARY;
    }

    // Now check how many canaries are still intact
    // This tells us how much stack space is available
    int i;
    for (i = 0; i < bufferSize; i++) {
        if (buffer[i] != STACK_CANARY) {
            break;
        }
    }

    // Calculate and report initial stack usage
    uint32_t initialStackUsage = (bufferSize - i) * sizeof(uint32_t);
    Serial.print("Initial stack usage: ");
    Serial.print(initialStackUsage);
    Serial.print(" bytes (");
    Serial.print((initialStackUsage * 100) / ESTIMATED_STACK_SIZE);
    Serial.println("% of estimated stack)");

    // Update high water mark
    if (initialStackUsage > stackHighWaterMark) {
        stackHighWaterMark = initialStackUsage;
    }
}

// Recursive function to test stack depth
uint32_t testStackDepth(int depth, uint32_t maxDepth) {
    // Local variables to consume stack space
    volatile uint8_t buffer[64];

    // Mark the buffer with a pattern
    for (int i = 0; i < 64; i++) {
        buffer[i] = i & 0xFF;
    }

    // Update high water mark based on recursion depth
    uint32_t currentDepth = depth * sizeof(buffer);
    if (currentDepth > stackHighWaterMark) {
        stackHighWaterMark = currentDepth;
    }

    // Prevent infinite recursion
    if (depth >= maxDepth) {
        return currentDepth;
    }

    // Recurse deeper
    return testStackDepth(depth + 1, maxDepth);
}

void checkStackUsage() {
    // Initialize stack monitoring on first call
    static bool initialized = false;
    if (!initialized) {
        initStackMonitoring();
        initialized = true;
    }

    // Periodically test stack depth with controlled recursion
    static uint32_t lastTestTime = 0;
    uint32_t currentTime = millis();

    if (currentTime - lastTestTime > 5000) {  // Test every 5 seconds
        // Test stack with controlled recursion
        // Adjust maxDepth based on your application
        uint32_t depth = testStackDepth(0, 20);

        lastTestTime = currentTime;
    }
}

void reportStackUsage() {
    Serial.print("Stack high water mark: ");
    Serial.print(stackHighWaterMark);
    Serial.print(" bytes (");
    Serial.print((stackHighWaterMark * 100) / ESTIMATED_STACK_SIZE);
    Serial.println("% of estimated stack)");

    // We don't have a reliable way to measure current usage
    // so we'll just report the high water mark
    Serial.print("Current stack usage: at least ");
    Serial.print(stackHighWaterMark);
    Serial.println(" bytes");

    // Add warning if stack usage is high
    uint32_t percentUsed = (stackHighWaterMark * 100) / ESTIMATED_STACK_SIZE;
    if (percentUsed > 80) {
        Serial.println("WARNING: Stack usage above 80%!");
    } else if (percentUsed > 60) {
        Serial.println("NOTICE: Stack usage above 60%");
    }
}
