/**
 * Space Maquette - Test for macros.h min/max conflict resolution
 * 
 * This file tests the min/max conflict resolution approach implemented in macros.h
 */

// First include our macros.h
#include "../include/macros.h"

// Include Arduino.h which defines min/max macros
#include <Arduino.h>

// Now include algorithm which has std::min/std::max
PROTECT_STD_MINMAX
#include <algorithm>
#include <vector>
RESTORE_MINMAX

// Test function to verify our solution works
void testMinMaxFunctions() {
  // Test Arduino's min/max macros
  int a1 = 5, b1 = 10;
  int result1 = min(a1, b1);  // Should use Arduino's min macro
  int result2 = max(a1, b1);  // Should use Arduino's max macro
  
  // Test our sm::min/sm::max functions
  int a2 = 15, b2 = 20;
  int result3 = sm::min(a2, b2);  // Should use our min function
  int result4 = sm::max(a2, b2);  // Should use our max function
  
  // Test our SM_MIN/SM_MAX macros
  int a3 = 25, b3 = 30;
  int result5 = SM_MIN(a3, b3);  // Should use our SM_MIN macro
  int result6 = SM_MAX(a3, b3);  // Should use our SM_MAX macro
  
  // Test with mixed types
  float a4 = 35.5f, b4 = 40;
  float result7 = sm::min(a4, b4);  // Should use our min function with mixed types
  float result8 = sm::max(a4, b4);  // Should use our max function with mixed types
  
  // Test with STL algorithms that use std::min/std::max
  std::vector<int> vec = {5, 2, 8, 1, 9};
  PROTECT_STD_MINMAX
  int minVal = *std::min_element(vec.begin(), vec.end());
  int maxVal = *std::max_element(vec.begin(), vec.end());
  RESTORE_MINMAX
  
  // Print results to verify
  Serial.println("Testing min/max functions:");
  Serial.print("Arduino min(5, 10) = "); Serial.println(result1);
  Serial.print("Arduino max(5, 10) = "); Serial.println(result2);
  Serial.print("sm::min(15, 20) = "); Serial.println(result3);
  Serial.print("sm::max(15, 20) = "); Serial.println(result4);
  Serial.print("SM_MIN(25, 30) = "); Serial.println(result5);
  Serial.print("SM_MAX(25, 30) = "); Serial.println(result6);
  Serial.print("sm::min(35.5f, 40) = "); Serial.println(result7);
  Serial.print("sm::max(35.5f, 40) = "); Serial.println(result8);
  Serial.print("std::min_element = "); Serial.println(minVal);
  Serial.print("std::max_element = "); Serial.println(maxVal);
}
