/**
 * Space Maquette - Common Macros
 *
 * This file provides a solution for min/max macro conflicts with C++ standard library
 * while preserving ClearCore library functionality.
 */

#pragma once

// This pattern ensures we don't include this file twice
#ifndef SPACE_MAQUETTE_MACROS_H
#define SPACE_MAQUETTE_MACROS_H

// Define our namespace min/max functions to use in our code
namespace spacemaquette {
template <typename T>
inline T min(T a, T b) {
    return (a < b) ? a : b;
}

template <typename T>
inline T max(T a, T b) {
    return (a > b) ? a : b;
}
}  // namespace spacemaquette

// The most important part: this macro should be inserted BEFORE including C++ STL headers
// that use std::min or std::max
#define PROTECT_STD_MINMAX                                                                      \
    /* Save existing min/max macros if they exist */                                            \
    _Pragma("push_macro(\"min\")")                                                              \
        _Pragma("push_macro(\"max\")") /* Temporarily undefine them so STL headers see the real \
                                          std::min/max */                                       \
        _Pragma("undef min") _Pragma("undef max")

// This macro should be inserted AFTER including C++ STL headers
#define RESTORE_MINMAX                        \
    /* Restore the original min/max macros */ \
    _Pragma("pop_macro(\"min\")") _Pragma("pop_macro(\"max\")")

#endif  // SPACE_MAQUETTE_MACROS_H