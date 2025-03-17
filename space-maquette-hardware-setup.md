# Space Maquette Hardware Setup Guide

## Overview

This guide provides detailed instructions for setting up the hardware components of the Space Maquette system, including:

1. ClearCore controller connections
2. SEN0366 infrared laser distance sensor (rangefinder)
3. Arduino Nano for tilt servo control
4. Relay for switching between rangefinder and tilt servo
5. Level shifter (if needed)

## System Architecture

The Space Maquette system uses a Teknic ClearCore controller as the main controller, which communicates with:
- Host computer via COM0 (Serial0)
- Rangefinder and Arduino Nano (for tilt servo) via COM1 (Serial1)
- ClearPath servos for X, Y, Z, and Pan axes

A relay is used to switch the COM1 serial connection between the rangefinder and the Arduino Nano controlling the tilt servo.

## ClearCore Connections

### ClearCore Serial Ports

| Port | Function | Baud Rate | Connected To |
|------|----------|-----------|--------------|
| COM0 (Serial0) | Host communication | 115200 | Host computer |
| COM1 (Serial1) | Rangefinder/Tilt servo | 9600 | Relay switch (to rangefinder or Arduino) |

### ClearCore COM1 Port Pinout

| Pin | Signal | Description | Connection |
|-----|--------|-------------|------------|
| 4 | GND | Ground | Common ground for rangefinder and Arduino |
| 5 | TX | Transmit | To relay (switches between rangefinder RX and Arduino RX) |
| 6 | 5VOB | 5V output | Power supply for devices (optional) |
| 8 | RX | Receive | From relay (switches between rangefinder TX and Arduino TX) |

### ClearCore IO Pins

| Pin | Function | Connected To |
|-----|----------|--------------|
| IO0 | Relay control | Relay coil (controls switching) |
| DI6 | Emergency stop | E-stop switch |
| DI7 | X-axis limit switch | X-axis minimum position sensor |
| DI8 | Y-axis limit switch | Y-axis minimum position sensor |
| DI9 | Z-axis limit switch | Z-axis minimum position sensor |
| DI2 | Pan home sensor | Pan zero position optical sensor |
| M0 | X-axis motor | ClearPath servo for X-axis |
| M1 | Y-axis motor | ClearPath servo for Y-axis |
| M2 | Z-axis motor | ClearPath servo for Z-axis |
| M3 | Pan-axis motor | ClearPath servo for Pan-axis |

## Rangefinder (SEN0366) Connections

| SEN0366 Wire | Color | Connected To |
|--------------|-------|--------------|
| Power | Red | Relay output (5V) |
| Ground | Black | ClearCore GND (COM1 pin 4) |
| TX | Yellow | Relay → ClearCore RX (COM1 pin 8) |
| RX | White | Relay → ClearCore TX (COM1 pin 5) |

## Arduino Nano Connections

| Arduino Nano Pin | Function | Connected To |
|------------------|----------|--------------|
| 0 (RX) | Serial RX | Relay → ClearCore TX (COM1 pin 5) |
| 1 (TX) | Serial TX | Relay → ClearCore RX (COM1 pin 8) |
| 2 | Enable pin | Relay output (active when selected) |
| 9 | Servo control | Tilt servo signal wire |
| 5V | Power output | Tilt servo power (red wire) |
| GND | Ground | Tilt servo ground (black/brown wire) and ClearCore GND |
| VIN | Power input | 5V power supply |

## Relay Wiring

The relay is used to switch the serial connection between the rangefinder and the Arduino Nano.

| Relay Pin | Function | Connected To |
|-----------|----------|--------------|
| Coil + | Control input | ClearCore IO0 |
| Coil - | Control ground | ClearCore GND |
| COM (TX path) | Common terminal | ClearCore RX (COM1 pin 8) |
| NO (TX path) | Normally open | Arduino Nano TX (pin 1) |
| NC (TX path) | Normally closed | Rangefinder TX (yellow) |
| COM (RX path) | Common terminal | ClearCore TX (COM1 pin 5) |
| NO (RX path) | Normally open | Arduino Nano RX (pin 0) |
| NC (RX path) | Normally closed | Rangefinder RX (white) |
| COM (Power) | Common terminal | 5V power supply |
| NO (Power) | Normally open | Arduino Nano enable pin (pin 2) |
| NC (Power) | Normally closed | Rangefinder power (red) |

**Note:** This setup requires a dual-pole relay (or two separate relays) to switch both TX and RX lines.

## Level Shifter (Optional)

If needed, a level shifter can be used to convert between different voltage levels (e.g., 3.3V and 5V).

| Level Shifter Pin | Connected To (Low Voltage Side) | Connected To (High Voltage Side) |
|-------------------|----------------------------------|----------------------------------|
| LV | 3.3V source | - |
| GND | Common ground | Common ground |
| HV | - | 5V source |
| LV1 | 3.3V device TX | - |
| LV2 | 3.3V device RX | - |
| HV1 | - | 5V device RX |
| HV2 | - | 5V device TX |

## Wiring Diagram

```
                           ┌─────────────────┐
                           │                 │
                           │    ClearCore    │
                           │                 │
                           └─────┬─────┬─────┘
                                 │     │
                                 │     │
                 ┌───────────────┘     └───────────────┐
                 │                                     │
                 │                                     │
         ┌───────┴───────┐                     ┌───────┴───────┐
         │  COM0 (Host)  │                     │  COM1 (Devices)│
         └───────────────┘                     └───────┬───────┘
                                                       │
                                                       │
                                               ┌───────┴───────┐
                                               │     Relay     │
                                               │  Controlled   │
                                               │   by IO0      │
                                               └───────┬───────┘
                                                       │
                                                       │
                               ┌─────────────────────┬─┴──────────────────────┐
                               │                     │                        │
                               │                     │                        │
                       ┌───────┴───────┐     ┌───────┴───────┐      ┌────────┴────────┐
                       │  Rangefinder  │     │  Arduino Nano │      │    Power        │
                       │   (SEN0366)   │     │  (Tilt Servo) │      │   Switching     │
                       └───────────────┘     └───────────────┘      └─────────────────┘
```

## Limit Switch Connections

### X, Y, Z Axis Limit Switches

Each axis requires a limit switch at its minimum position for homing operations:

| Axis | Switch Type | ClearCore Pin | Function |
|------|-------------|--------------|----------|
| X | Normally Open | DI7 | X-axis minimum position detection |
| Y | Normally Open | DI8 | Y-axis minimum position detection |
| Z | Normally Open | DI9 | Z-axis minimum position detection |

Connect each limit switch with:
- One terminal to the corresponding DI pin
- The other terminal to GND

### Pan Home Sensor

The Pan axis uses an optical sensor to detect the zero (home) position:

| Component | ClearCore Pin | Function |
|-----------|--------------|----------|
| Optical Sensor | DI2 | Pan zero position detection |

The optical sensor typically requires:
- Power connection (5V)
- Ground connection (GND)
- Signal output to DI2

## Setup Instructions

1. **Mount the ClearCore controller** in a suitable enclosure with proper ventilation.

2. **Connect the ClearPath servos** to the ClearCore M0-M3 connectors following Teknic's guidelines.

3. **Wire the relay:**
   - Connect the relay coil to ClearCore IO0 and GND.
   - Wire the COM terminals to the ClearCore COM1 TX/RX pins.
   - Wire the NC terminals to the rangefinder TX/RX wires.
   - Wire the NO terminals to the Arduino Nano TX/RX pins.
   - Wire the power switching section as shown in the table.

4. **Connect the rangefinder (SEN0366):**
   - Connect the black wire to ClearCore GND.
   - Connect the yellow wire (TX) to the relay NC terminal (TX path).
   - Connect the white wire (RX) to the relay NC terminal (RX path).
   - Connect the red wire to the relay NC terminal (power path).

5. **Set up the Arduino Nano:**
   - Upload the tilt servo control code to the Arduino Nano.
   - Connect pin 0 (RX) to the relay NO terminal (RX path).
   - Connect pin 1 (TX) to the relay NO terminal (TX path).
   - Connect pin 2 (enable) to the relay NO terminal (power path).
   - Connect the servo to pin 9.
   - Connect VIN to a 5V power supply.
   - Connect GND to the common ground.

6. **If using a level shifter:**
   - Connect the LV side to the 3.3V device.
   - Connect the HV side to the 5V device.
   - Ensure common ground between all devices.

7. **Connect the host computer** to ClearCore COM0.

8. **Power up the system** and test communication with the host computer.

## Testing the Setup

1. **Test host communication:**
   - Send a "PING" command to the ClearCore.
   - Verify you receive "OK:PONG" response.

2. **Test rangefinder:**
   - Send a "MEASURE" command.
   - Verify you receive a distance measurement.

3. **Test tilt servo:**
   - Send a "TILT:90" command.
   - Verify the servo moves to the center position.
   - Send a "TILT:45" command.
   - Verify the servo moves to a 45-degree position.

## Troubleshooting

- **No communication with host:** Check COM0 connections and baud rate (115200).
- **No response from rangefinder:** Ensure relay is in the correct position (IO0 LOW) and check wiring.
- **No response from Arduino:** Ensure relay is in the correct position (IO0 HIGH) and check wiring.
- **Servo not moving:** Check servo connections and power supply.
- **Intermittent communication:** Check for loose connections or interference.
- **Signal issues:** Consider adding a level shifter if devices use different voltage levels.
