#ifndef STACK_DEBUG_H
#define STACK_DEBUG_H

#include <stdint.h> // Add this to define uint32_t

// Define this to enable stack monitoring
// #define STACK_MONITORING_ENABLED

// Function declarations
extern void checkStackUsage();
extern void reportStackUsage();

// Variable declaration
extern uint32_t stackHighWaterMark;

#endif  // STACK_DEBUG_H
