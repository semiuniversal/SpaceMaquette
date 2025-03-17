# Space Maquette Host Communication Protocol

## Overview

The Space Maquette firmware communicates with the host computer via a serial interface (Serial0/COM0) at 115200 baud. The protocol uses a text-based command format with optional checksum verification.

## Command Format

Commands from the host follow this general format:
```
<CMD>:<PARAMS>;<CRC>\n
```

Where:
- `<CMD>` is the command name (e.g., "MOVE", "HOME", "STATUS")
- `<PARAMS>` are comma-separated parameters (optional)
- `<CRC>` is a hexadecimal CRC-16 checksum (optional)
- `\n` is the newline character that terminates the command

Example:
```
MOVE:100.5,200.3,50.0;A5
```

## Response Format

Responses from the ClearCore follow this format:
```
<STATUS>:<MESSAGE>
```

Where:
- `<STATUS>` is either "OK" for successful commands or "ERROR" for failed commands
- `<MESSAGE>` contains the response data or error message

Examples:
```
OK:MOVE_STARTED
ERROR:MISSING_PARAMS
```

## Checksum Calculation

The firmware uses a CRC-16 algorithm for checksum verification:
1. The checksum is calculated on all characters before the semicolon
2. The calculated value is compared with the hexadecimal value after the semicolon
3. If no checksum is provided, the command is assumed valid

## Command Categories

The protocol supports the following command categories:

### System Commands

| Command | Parameters | Description | Response |
|---------|------------|-------------|----------|
| `PING` | None | Check if the system is responsive | `OK:PONG` |
| `RESET` | None | Perform a soft reset of the system | `OK:RESETTING` |
| `STATUS` | None | Get current system status | `OK:X=<x>,Y=<y>,Z=<z>,PAN=<pan>,TILT=<tilt>,ESTOP=<0/1>,MOVING=<0/1>,HOMED=<0/1>` |
| `DEBUG` | `ON`/`OFF` | Enable or disable debug mode | `OK:DEBUG_ENABLED` or `OK:DEBUG_DISABLED` |
| `ESTOP` | None | Activate emergency stop | `OK:ESTOP_ACTIVATED` |
| `RESET_ESTOP` | None | Reset emergency stop if safe | `OK:ESTOP_RESET` or `ERROR:ESTOP_STILL_ACTIVE` |

### Motion Commands

| Command | Parameters | Description | Response |
|---------|------------|-------------|----------|
| `HOME` | `ALL`/`X`/`Y`/`Z` | Home specified axis or all axes | `OK:HOMING_STARTED` or `ERROR:HOMING_FAILED` |
| `MOVE` | `x,y,z[,pan,tilt]` | Move to absolute position | `OK:MOVE_STARTED` or `ERROR:MOVE_FAILED` |
| `STOP` | None | Stop all motion immediately | `OK:MOTION_STOPPED` |
| `VELOCITY` | `vx,vy,vz` | Set axis velocities | `OK:VELOCITY_SET` |

### Rangefinder Commands

| Command | Parameters | Description | Response |
|---------|------------|-------------|----------|
| `MEASURE` | None | Take a single distance measurement | `OK:<distance>` or `ERROR:MEASUREMENT_FAILED` or `ERROR:OUT_OF_RANGE` |
| `SCAN` | `x1,y1,x2,y2,step` | Perform a scan over the specified area | `OK:SCAN_STARTED` |

### Servo Commands

| Command | Parameters | Description | Response |
|---------|------------|-------------|----------|
| `TILT` | `angle` | Set tilt servo angle | `OK:TILT_SET` or `ERROR:TILT_FAILED` |
| `PAN` | `angle` | Set pan axis angle | `OK:PAN_SET` or `ERROR:PAN_FAILED` |

### Configuration Commands

| Command | Parameters | Description | Response |
|---------|------------|-------------|----------|
| `CONFIG` | `LOAD` | Load configuration from SD card | `OK:CONFIG_LOADED` or `ERROR:CONFIG_LOAD_FAILED` |
| `CONFIG` | `SAVE` | Save configuration to SD card | `OK:CONFIG_SAVED` or `ERROR:CONFIG_SAVE_FAILED` |
| `CONFIG` | `LIST` | List all configuration items | `OK:CONFIG_LIST_NOT_IMPLEMENTED` (not implemented yet) |
| `GET` | `key` | Get configuration value | `OK:<value>` or `ERROR:KEY_NOT_FOUND` |
| `SET` | `key,value` | Set configuration value | `OK:VALUE_SET` |
| `SAVE` | None | Save configuration to SD card | `OK:CONFIG_SAVED` or `ERROR:CONFIG_SAVE_FAILED` |

## Error Handling

The system returns error responses in the following cases:

| Error Response | Description |
|----------------|-------------|
| `ERROR:UNKNOWN_COMMAND` | Command not recognized |
| `ERROR:MISSING_PARAM` | Required parameter is missing |
| `ERROR:MISSING_PARAMS` | Multiple required parameters are missing |
| `ERROR:INVALID_PARAM` | Parameter has invalid value |
| `ERROR:INVALID_AXIS` | Specified axis is invalid |
| `ERROR:CHECKSUM_MISMATCH` | Provided checksum doesn't match calculated value |
| `ERROR:ESTOP_ACTIVE` | Command rejected because emergency stop is active |
| `ERROR:HOMING_FAILED` | Homing operation failed |
| `ERROR:MOVE_FAILED` | Movement operation failed |
| `ERROR:MEASUREMENT_FAILED` | Distance measurement failed |
| `ERROR:OUT_OF_RANGE` | Measurement is out of sensor range |
| `ERROR:TILT_FAILED` | Setting tilt angle failed |
| `ERROR:PAN_FAILED` | Setting pan angle failed |
| `ERROR:KEY_NOT_FOUND` | Configuration key not found |
| `ERROR:CONFIG_LOAD_FAILED` | Failed to load configuration |
| `ERROR:CONFIG_SAVE_FAILED` | Failed to save configuration |
| `ERROR:INVALID_CONFIG_COMMAND` | Invalid configuration sub-command |
| `ERROR:MISSING_CONFIG_COMMAND` | Missing configuration sub-command |

## Implementation Notes

1. The command parser buffers incoming characters until a newline is received
2. Maximum command buffer size is 64 bytes
3. Maximum parameter buffer size is 256 bytes
4. Up to 10 parameters can be parsed per command
5. When emergency stop is active, only STATUS and RESET_ESTOP commands are allowed
6. Some configuration values (like tilt limits and velocities) are applied immediately when set
