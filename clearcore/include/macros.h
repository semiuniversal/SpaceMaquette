/**
 * Space Maquette - Common Macros
 *
 * This file provides a comprehensive solution for min/max operations that don't conflict
 * with Arduino's macros or the C++ STL.
 */

#pragma once

#ifndef SPACE_MAQUETTE_MACROS_H
#define SPACE_MAQUETTE_MACROS_H

// Step 1: Save Arduino's min/max macros before they might be undefined
#ifdef min
    #define ARDUINO_MIN_MACRO(a, b) min(a, b)
    #undef min
#endif

#ifdef max
    #define ARDUINO_MAX_MACRO(a, b) max(a, b)
    #undef max
#endif

// Step 2: Define our own namespace with min/max functions
namespace sm {
    template <typename T>
    inline T min(T a, T b) {
        return (a < b) ? a : b;
    }

    template <typename T>
    inline T max(T a, T b) {
        return (a > b) ? a : b;
    }
    
    // Overloads for mixed types
    template <typename T, typename U>
    inline auto min(T a, U b) -> decltype(a < b ? a : b) {
        return (a < b) ? a : b;
    }
    
    template <typename T, typename U>
    inline auto max(T a, U b) -> decltype(a > b ? a : b) {
        return (a > b) ? a : b;
    }
}

// Step 3: Define macros for easy use in code
// These will work regardless of whether Arduino's min/max are defined
#define SM_MIN(a, b) sm::min((a), (b))
#define SM_MAX(a, b) sm::max((a), (b))

// Step 4: Define macros to help with STL includes
// Use these before and after including STL headers that use min/max
#define PROTECT_STD_MINMAX \
    _Pragma("push_macro(\"min\")") \
    _Pragma("push_macro(\"max\")") \
    _Pragma("undef min") \
    _Pragma("undef max")

#define RESTORE_MINMAX \
    _Pragma("pop_macro(\"max\")") \
    _Pragma("pop_macro(\"min\")")

// Step 5: Include order helper
// This macro should be used at the top of files that need both Arduino and STL
#define INCLUDE_ORDER_HELPER \
    /* First include Arduino headers */ \
    /* Then protect min/max macros before STL includes */ \
    PROTECT_STD_MINMAX \
    /* Now include STL headers */ \
    /* Finally restore Arduino macros if needed */ \
    RESTORE_MINMAX

#endif // SPACE_MAQUETTE_MACROS_H
