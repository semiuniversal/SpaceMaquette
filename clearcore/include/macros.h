/**
 * Space Maquette - Common Macros
 *
 * This file provides helper functions for min/max operations that don't conflict
 * with Arduino's macros or the C++ STL.
 */

#pragma once

#ifndef SPACE_MAQUETTE_MACROS_H
#define SPACE_MAQUETTE_MACROS_H

// Simple namespace with differently named functions
namespace sm {
template <typename T>
inline T minimum(T a, T b) {
    return (a < b) ? a : b;
}

template <typename T>
inline T maximum(T a, T b) {
    return (a > b) ? a : b;
}
}  // namespace sm

// No need for the PROTECT_STD_MINMAX and RESTORE_MINMAX macros anymore
// since we're using differently named functions

// Helper macros for easy use in code
#define SM_MIN(a, b) sm::minimum((a), (b))
#define SM_MAX(a, b) sm::maximum((a), (b))

#endif  // SPACE_MAQUETTE_MACROS_H