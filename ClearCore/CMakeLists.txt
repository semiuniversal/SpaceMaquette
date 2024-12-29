cmake_minimum_required(VERSION 3.12)
project(SpaceMaquette)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ClearCore SDK path
set(CLEARCORE_SDK_PATH "${CMAKE_SOURCE_DIR}/lib/ClearCore")

include_directories(
    ${CLEARCORE_SDK_PATH}/inc
    ${CMAKE_SOURCE_DIR}/inc
)

add_executable(SpaceMaquette
    src/main.cpp
    src/MotionController.cpp
    src/LaserSensor.cpp
    src/NetworkInterface.cpp
)

target_link_libraries(SpaceMaquette
    ${CLEARCORE_SDK_PATH}/lib/libClearCore.a
)