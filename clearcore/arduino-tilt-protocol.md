# Space Maquette Arduino Tilt Communication Protocol

## Overview

The Space Maquette ClearCore controller communicates with an external Arduino responsible for controlling the tilt servo. This communication occurs over a shared serial port (Serial1/COM1) that is also used by the rangefinder. A relay pin is used to switch between devices.

## Hardware Configuration

- **Serial Port**: Serial1 (COM1) at 9600 baud
- **Relay Pin**: IO0 (defined as RELAY_PIN in main.cpp)
- **Device Selection**:
  - Relay LOW: Rangefinder is selected
  - Relay HIGH: Tilt Servo (Arduino) is selected

## Communication Protocol

### Device Selection

Before any communication with the Arduino, the ClearCore must switch to the tilt servo device:

```cpp
_serialDevices.switchToDevice(SerialDevices::TILT_SERVO);
```

This sets the relay pin HIGH to connect the serial port to the Arduino.

### Command Format

Commands sent to the Arduino follow this format:
```
<CMD>:<VALUE>\r\n
```

Where:
- `<CMD>` is the command name
- `<VALUE>` is the parameter value
- `\r\n` is the carriage return and newline sequence that terminates the command

### Supported Commands

Currently, only one command is implemented:

| Command | Format | Description | Example |
|---------|--------|-------------|---------|
| `ANGLE` | `ANGLE:<degrees>\r\n` | Set the tilt servo angle in degrees | `ANGLE:45.00\r\n` |

### Response Format

The Arduino responds with a simple acknowledgment:
```
OK\r\n
```

If the command is successful, or no response if the command fails or times out.

### Error Handling

The ClearCore implements a timeout mechanism when waiting for acknowledgment:
- Timeout period: 1000ms (1 second)
- If no acknowledgment is received within the timeout period, the command is considered failed

## Implementation Details

### Initialization

The tilt servo is initialized in the following sequence:
1. SerialDevices is constructed with the serial port and relay pin
2. SerialDevices.init() is called to initialize the serial port and relay pin
3. TiltServo.begin() is called to initialize the tilt servo
4. TiltServo.setLimits() is called to set the minimum and maximum angle limits

### Setting Angle

When setting a tilt angle:
1. The angle is constrained to the min/max limits
2. The serial device is switched to TILT_SERVO mode
3. Any pending data in the serial buffer is cleared
4. The ANGLE command is sent with the constrained angle value
5. The system waits for an "OK" acknowledgment with a 1-second timeout
6. If acknowledged, the current angle is updated; otherwise, the operation fails

### Example Code Flow

```cpp
// Initialize
SerialDevices serialDevices(Serial1, RELAY_PIN);
serialDevices.init();
Serial1.begin(9600);

TiltServo tiltServo(serialDevices);
tiltServo.begin();
tiltServo.setLimits(45, 135);

// Set angle
bool success = tiltServo.setAngle(90.0);
```

## Arduino Implementation Requirements

The Arduino connected to the ClearCore must:
1. Listen for commands on its serial port at 9600 baud
2. Parse commands in the format `<CMD>:<VALUE>\r\n`
3. Recognize the "ANGLE" command and set the servo position accordingly
4. Send "OK" response after successfully processing a command
5. Handle angle values within the specified min/max range

## Debugging

The TiltServo class includes debug logging capabilities that can be enabled:
```cpp
tiltServo.setDebug(true);
```

When enabled, debug messages are sent to the USB Serial port, including:
- Angle constraints
- Device switching failures
- Command sending
- Acknowledgment reception or timeout
