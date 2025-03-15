#ifndef STACK_DEBUG_H
#define STACK_DEBUG_H

#include <Arduino.h>

#ifdef STACK_MONITORING_ENABLED
extern "C" {
extern uint32_t _estack;          // Stack top
extern uint32_t _Min_Stack_Size;  // Minimum stack size

volatile uint32_t stackHighWaterMark = 0;

void checkStackUsage() {
    uint32_t currentSP = __get_MSP();
    uint32_t stackUsed = (uint32_t)&_estack - currentSP;

    if (stackUsed > stackHighWaterMark) {
        stackHighWaterMark = stackUsed;
    }
}}

void reportStackUsage() {
    Serial.print("Stack high water mark: ");
    Serial.print(stackHighWaterMark);
    Serial.println(" bytes");

    uint32_t stackSize = (uint32_t)&_Min_Stack_Size;
    uint32_t percentUsed = (stackHighWaterMark * 100) / stackSize;

    Serial.print("Stack usage: ");
    Serial.print(percentUsed);
    Serial.println("%");
}
#endif

#endif  // STACK_DEBUG_H
