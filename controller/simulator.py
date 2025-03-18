"""
Simulator for the Space Maquette ClearCore controller.

This module provides a virtual ClearCore device that responds to commands
according to the protocol specification, allowing for testing without
physical hardware.
"""

from __future__ import annotations

import logging
import random
import re
import threading
import time
from dataclasses import dataclass
from enum import Enum
from math import sqrt
from typing import Dict, List, Optional, Tuple, Union, cast

import serial
from serial.tools.list_ports_common import ListPortInfo

logger = logging.getLogger(__name__)


class AxisDirection(Enum):
    """Direction of axis movement for homing."""
    POSITIVE = 1
    NEGATIVE = -1


@dataclass
class SimulatedAxis:
    """Represents a single axis in the simulator."""
    name: str
    position: float = 0.0
    velocity: float = 100.0  # mm/s or deg/s
    min_limit: float = 0.0
    max_limit: float = 1000.0
    homing_direction: AxisDirection = AxisDirection.NEGATIVE
    home_position: float = 0.0
    homing: bool = False
    moving: bool = False
    homed: bool = False


class ClearCoreSimulator:
    """
    Simulates a ClearCore device responding to the Space Maquette protocol.
    
    This class creates a virtual serial port that behaves like a ClearCore,
    responding to commands according to the protocol specification.
    """
    
    def __init__(self, port_name: str = "COM99"):
        """
        Initialize the simulator.
        
        Args:
            port_name: Optional name for the virtual port (not used in simulation)
        """
        self.port_name = port_name
        self.running = False
        self.estop_active = False
        self.last_command = ""
        self.thread: Optional[threading.Thread] = None
        
        # Initialize axes
        self.axes = {
            'x': SimulatedAxis('X', max_limit=2000.0),
            'y': SimulatedAxis('Y', max_limit=2000.0),
            'z': SimulatedAxis('Z', max_limit=1000.0),
            'pan': SimulatedAxis('Pan', max_limit=360.0),
            'tilt': SimulatedAxis('Tilt', min_limit=0.0, max_limit=180.0),
        }
        
        # Last measured distance from rangefinder
        self.last_measurement = 0.0
        
        # Configuration storage
        self.config: Dict[str, str] = {
            'velocity_x': '100',
            'velocity_y': '100',
            'velocity_z': '50',
            'tilt_min': '45',
            'tilt_max': '135',
        }
        
        # Command handlers
        self.command_handlers = {
            'PING': self._handle_ping,
            'RESET': self._handle_reset,
            'STATUS': self._handle_status,
            'DEBUG': self._handle_debug,
            'ESTOP': self._handle_estop,
            'RESET_ESTOP': self._handle_reset_estop,
            'HOME': self._handle_home,
            'MOVE': self._handle_move,
            'STOP': self._handle_stop,
            'VELOCITY': self._handle_velocity,
            'MEASURE': self._handle_measure,
            'SCAN': self._handle_scan,
            'TILT': self._handle_tilt,
            'PAN': self._handle_pan,
            'CONFIG': self._handle_config,
            'GET': self._handle_get,
            'SET': self._handle_set,
            'SAVE': self._handle_save,
        }
    
    def start(self) -> None:
        """Start the simulator in a background thread."""
        if self.running:
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._update_loop)
        self.thread.daemon = True
        self.thread.start()
        logger.info(f"ClearCore simulator started on virtual port {self.port_name}")
    
    def stop(self) -> None:
        """Stop the simulator."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=1.0)
        logger.info("ClearCore simulator stopped")
    
    def _update_loop(self) -> None:
        """Main update loop for the simulator."""
        last_update = time.time()
        
        while self.running:
            # Calculate elapsed time
            now = time.time()
            dt = now - last_update
            last_update = now
            
            # Update axis positions if moving
            self._update_axes(dt)
            
            # Small sleep to prevent CPU spinning
            time.sleep(0.01)
    
    def _update_axes(self, dt: float) -> None:
        """
        Update the positions of all axes based on their movement.
        
        Args:
            dt: Time elapsed since last update in seconds
        """
        for name, axis in self.axes.items():
            if self.estop_active:
                axis.moving = False
                axis.homing = False
                continue
                
            if axis.homing:
                # Simulate homing process
                direction = axis.homing_direction.value
                distance = axis.velocity * dt * direction
                
                # Check if we've reached home position
                if (direction < 0 and axis.position <= axis.home_position) or \
                   (direction > 0 and axis.position >= axis.home_position):
                    axis.position = axis.home_position
                    axis.homing = False
                    axis.homed = True
                    logger.info(f"Axis {axis.name} homed at {axis.position}")
                else:
                    # Move toward home position
                    axis.position += distance
            
            elif axis.moving:
                # Check if we've reached the target (simulated by a random chance)
                if random.random() < 0.05:  # 5% chance of completing move per update
                    axis.moving = False
                    logger.info(f"Axis {axis.name} move completed")
    
    def process_command(self, command_str: str) -> str:
        """
        Process a command string and return the response.
        
        Args:
            command_str: Command string in the format "<CMD>:<PARAMS>;<CRC>\n"
            
        Returns:
            Response string in the format "<STATUS>:<MESSAGE>"
        """
        # Strip whitespace and newlines
        command_str = command_str.strip()
        self.last_command = command_str
        
        # Check for empty command
        if not command_str:
            return "ERROR:EMPTY_COMMAND"
        
        # Extract checksum if present
        checksum_match = re.search(r';([0-9A-Fa-f]+)$', command_str)
        if checksum_match:
            # In a real implementation, we would verify the checksum
            # For simulation purposes, we just remove it
            command_str = command_str[:checksum_match.start()]
        
        # Split command and parameters
        parts = command_str.split(':', 1)
        cmd = parts[0].upper()
        params = parts[1].split(',') if len(parts) > 1 else []
        
        # Handle emergency stop special case
        if cmd == "ESTOP":
            return self._handle_estop(params)
        
        # Check if ESTOP is active
        if self.estop_active and cmd != "STATUS" and cmd != "RESET_ESTOP":
            return "ERROR:ESTOP_ACTIVE"
        
        # Handle command
        handler = self.command_handlers.get(cmd)
        if handler:
            return handler(params)
        else:
            return "ERROR:UNKNOWN_COMMAND"
    
    # Command handlers
    
    def _handle_ping(self, params: List[str]) -> str:
        """Handle PING command."""
        return "OK:PONG"
    
    def _handle_reset(self, params: List[str]) -> str:
        """Handle RESET command."""
        # Reset all axes to initial state but maintain positions
        for axis in self.axes.values():
            axis.moving = False
            axis.homing = False
        
        return "OK:RESETTING"
    
    def _handle_status(self, params: List[str]) -> str:
        """Handle STATUS command."""
        # Format: X=100.00,Y=200.00,Z=50.00,PAN=45.00,TILT=90.00,ESTOP=0,MOVING=1,HOMED=1
        status = []
        
        # Add axis positions
        for name, axis in self.axes.items():
            status.append(f"{name.upper()}={axis.position:.2f}")
        
        # Add system status flags
        status.append(f"ESTOP={1 if self.estop_active else 0}")
        
        # Check if any axis is moving
        any_moving = any(axis.moving or axis.homing for axis in self.axes.values())
        status.append(f"MOVING={1 if any_moving else 0}")
        
        # Check if all axes are homed
        all_homed = all(axis.homed for axis in self.axes.values())
        status.append(f"HOMED={1 if all_homed else 0}")
        
        return f"OK:{','.join(status)}"
    
    def _handle_debug(self, params: List[str]) -> str:
        """Handle DEBUG command."""
        if not params:
            return "ERROR:MISSING_PARAM"
        
        mode = params[0].upper()
        if mode == "ON":
            return "OK:DEBUG_ENABLED"
        elif mode == "OFF":
            return "OK:DEBUG_DISABLED"
        else:
            return "ERROR:INVALID_PARAM"
    
    def _handle_estop(self, params: List[str]) -> str:
        """Handle ESTOP command."""
        self.estop_active = True
        
        # Stop all axes
        for axis in self.axes.values():
            axis.moving = False
            axis.homing = False
        
        return "OK:ESTOP_ACTIVATED"
    
    def _handle_reset_estop(self, params: List[str]) -> str:
        """Handle RESET_ESTOP command."""
        # In a real system, this would check safety conditions
        # For simulation, just allow it
        self.estop_active = False
        return "OK:ESTOP_RESET"
    
    def _handle_home(self, params: List[str]) -> str:
        """Handle HOME command."""
        if not params:
            return "ERROR:MISSING_PARAM"
        
        axis_name = params[0].upper()
        
        if axis_name == "ALL":
            # Start homing all axes
            for axis in self.axes.values():
                axis.homing = True
                axis.moving = False
            return "OK:HOMING_STARTED"
        
        # Find the specified axis
        axis_key = axis_name.lower()
        if axis_key not in self.axes:
            return "ERROR:INVALID_AXIS"
        
        # Start homing the specified axis
        self.axes[axis_key].homing = True
        self.axes[axis_key].moving = False
        return "OK:HOMING_STARTED"
    
    def _handle_move(self, params: List[str]) -> str:
        """Handle MOVE command."""
        if len(params) < 3:
            return "ERROR:MISSING_PARAMS"
        
        try:
            # Parse position parameters
            x = float(params[0])
            y = float(params[1])
            z = float(params[2])
            
            # Optional pan and tilt
            pan = float(params[3]) if len(params) > 3 else self.axes['pan'].position
            tilt = float(params[4]) if len(params) > 4 else self.axes['tilt'].position
            
            # Update positions (in a real system this would start motion)
            # For simulation, we immediately update the position
            self.axes['x'].position = self._clamp(x, self.axes['x'].min_limit, self.axes['x'].max_limit)
            self.axes['y'].position = self._clamp(y, self.axes['y'].min_limit, self.axes['y'].max_limit)
            self.axes['z'].position = self._clamp(z, self.axes['z'].min_limit, self.axes['z'].max_limit)
            self.axes['pan'].position = self._clamp(pan, self.axes['pan'].min_limit, self.axes['pan'].max_limit)
            self.axes['tilt'].position = self._clamp(tilt, self.axes['tilt'].min_limit, self.axes['tilt'].max_limit)
            
            # Set axes as moving
            for axis in self.axes.values():
                axis.moving = True
                axis.homing = False
            
            return "OK:MOVE_STARTED"
        except ValueError:
            return "ERROR:INVALID_PARAM"
    
    def _handle_stop(self, params: List[str]) -> str:
        """Handle STOP command."""
        # Stop all motion
        for axis in self.axes.values():
            axis.moving = False
            axis.homing = False
        
        return "OK:MOTION_STOPPED"
    
    def _handle_velocity(self, params: List[str]) -> str:
        """Handle VELOCITY command."""
        if len(params) < 3:
            return "ERROR:MISSING_PARAMS"
        
        try:
            vx = float(params[0])
            vy = float(params[1])
            vz = float(params[2])
            
            # Set velocities
            self.axes['x'].velocity = vx
            self.axes['y'].velocity = vy
            self.axes['z'].velocity = vz
            
            # Update configuration
            self.config['velocity_x'] = str(vx)
            self.config['velocity_y'] = str(vy)
            self.config['velocity_z'] = str(vz)
            
            return "OK:VELOCITY_SET"
        except ValueError:
            return "ERROR:INVALID_PARAM"
    
    def _handle_measure(self, params: List[str]) -> str:
        """Handle MEASURE command."""
        # Simulate a distance measurement
        # In a real system, this would read from the rangefinder
        
        # Calculate a simulated distance based on current position
        # This is just an example - you would define your own function
        # to simulate realistic measurements
        x = self.axes['x'].position
        y = self.axes['y'].position
        z = self.axes['z'].position
        
        # Simulate a surface at z=0 with some noise
        self.last_measurement = max(0.0, z + random.uniform(-5.0, 5.0))
        
        # Small random chance of measurement failure
        if random.random() < 0.05:  # 5% chance of failure
            return "ERROR:MEASUREMENT_FAILED"
        
        # Small random chance of out of range
        if random.random() < 0.03:  # 3% chance of out of range
            return "ERROR:OUT_OF_RANGE"
        
        return f"OK:{self.last_measurement:.3f}"
    
    def _handle_scan(self, params: List[str]) -> str:
        """Handle SCAN command."""
        if len(params) < 5:
            return "ERROR:MISSING_PARAMS"
        
        try:
            x1 = float(params[0])
            y1 = float(params[1])
            x2 = float(params[2])
            y2 = float(params[3])
            step = float(params[4])
            
            # In a real system, this would start a scanning operation
            # For simulation, just acknowledge the command
            return "OK:SCAN_STARTED"
        except ValueError:
            return "ERROR:INVALID_PARAM"
    
    def _handle_tilt(self, params: List[str]) -> str:
        """Handle TILT command."""
        if not params:
            return "ERROR:MISSING_PARAM"
        
        try:
            angle = float(params[0])
            
            # Check limits
            min_tilt = float(self.config.get('tilt_min', '45'))
            max_tilt = float(self.config.get('tilt_max', '135'))
            
            if angle < min_tilt or angle > max_tilt:
                return "ERROR:TILT_FAILED"
            
            # Set tilt angle
            self.axes['tilt'].position = angle
            self.axes['tilt'].moving = True
            
            return "OK:TILT_SET"
        except ValueError:
            return "ERROR:INVALID_PARAM"
    
    def _handle_pan(self, params: List[str]) -> str:
        """Handle PAN command."""
        if not params:
            return "ERROR:MISSING_PARAM"
        
        try:
            angle = float(params[0])
            
            # Normalize angle to 0-360 range
            angle = angle % 360
            
            # Set pan angle
            self.axes['pan'].position = angle
            self.axes['pan'].moving = True
            
            return "OK:PAN_SET"
        except ValueError:
            return "ERROR:INVALID_PARAM"
    
    def _handle_config(self, params: List[str]) -> str:
        """Handle CONFIG command."""
        if not params:
            return "ERROR:MISSING_CONFIG_COMMAND"
        
        subcommand = params[0].upper()
        
        if subcommand == "LOAD":
            # Simulate loading config from SD
            return "OK:CONFIG_LOADED"
        elif subcommand == "SAVE":
            # Simulate saving config to SD
            return "OK:CONFIG_SAVED"
        elif subcommand == "LIST":
            # Not implemented in the protocol yet
            return "OK:CONFIG_LIST_NOT_IMPLEMENTED"
        else:
            return "ERROR:INVALID_CONFIG_COMMAND"
    
    def _handle_get(self, params: List[str]) -> str:
        """Handle GET command."""
        if not params:
            return "ERROR:MISSING_KEY"
        
        key = params[0]
        
        if key in self.config:
            return f"OK:{self.config[key]}"
        else:
            return "ERROR:KEY_NOT_FOUND"
    
    def _handle_set(self, params: List[str]) -> str:
        """Handle SET command."""
        if len(params) < 2:
            return "ERROR:MISSING_PARAMS"
        
        key = params[0]
        value = params[1]
        
        # Store in config
        self.config[key] = value
        
        # Apply certain configuration values immediately
        if key == "tilt_min" or key == "tilt_max":
            # Update tilt limits
            try:
                self.axes['tilt'].min_limit = float(self.config.get('tilt_min', '45'))
                self.axes['tilt'].max_limit = float(self.config.get('tilt_max', '135'))
            except ValueError:
                pass
        elif key.startswith("velocity_"):
            # Update axis velocity
            axis_name = key.split('_')[1]
            if axis_name in self.axes:
                try:
                    self.axes[axis_name].velocity = float(value)
                except ValueError:
                    pass
        
        return "OK:VALUE_SET"
    
    def _handle_save(self, params: List[str]) -> str:
        """Handle SAVE command."""
        # Simulate saving config to SD
        return "OK:CONFIG_SAVED"
    
    def _clamp(self, value: float, min_val: float, max_val: float) -> float:
        """Clamp a value between min and max."""
        return max(min_val, min(max_val, value))


class SerialSimulator:
    """
    Provides a serial-like interface to the ClearCore simulator.
    
    This class mimics the behavior of a pyserial Serial object but routes
    all communication through the ClearCoreSimulator.
    """
    
    def __init__(self, simulator: ClearCoreSimulator, *args, **kwargs):
        """
        Initialize the serial simulator.
        
        Args:
            simulator: ClearCoreSimulator instance to use
            *args, **kwargs: Ignored (for compatibility with pyserial)
        """
        self.simulator = simulator
        self.is_open = True
        self.timeout = kwargs.get('timeout', 1.0)
        self.in_waiting = 0
        self._read_buffer = b""
        self._write_buffer = b""
    
    def open(self) -> None:
        """Open the serial connection (simulated)."""
        self.is_open = True
    
    def close(self) -> None:
        """Close the serial connection (simulated)."""
        self.is_open = False
    
    def write(self, data: bytes) -> int:
        """
        Write data to the simulator.
        
        Args:
            data: Bytes to write
            
        Returns:
            Number of bytes written
        """
        if not self.is_open:
            raise IOError("Port is closed")
        
        # Add to write buffer
        self._write_buffer += data
        
        # Check for complete command (ending with newline)
        if b'\n' in self._write_buffer:
            # Split at newline
            command, self._write_buffer = self._write_buffer.split(b'\n', 1)
            
            # Process command
            cmd_str = command.decode('utf-8', errors='ignore')
            response = self.simulator.process_command(cmd_str)
            
            # Add response to read buffer
            self._read_buffer += (response + '\n').encode('utf-8')
            self.in_waiting = len(self._read_buffer)
        
        return len(data)
    
    def read(self, size: int = 1) -> bytes:
        """
        Read data from the simulator.
        
        Args:
            size: Number of bytes to read
            
        Returns:
            Bytes read from the simulator
        """
        if not self.is_open:
            raise IOError("Port is closed")
        
        # If no data and timeout is 0, return empty
        if not self._read_buffer and self.timeout == 0:
            return b""
        
        # Read up to size bytes
        data, self._read_buffer = self._read_buffer[:size], self._read_buffer[size:]
        self.in_waiting = len(self._read_buffer)
        return data
    
    def readline(self) -> bytes:
        """
        Read a line from the simulator.
        
        Returns:
            Line read from the simulator
        """
        if not self.is_open:
            raise IOError("Port is closed")
        
        # If no data and timeout is 0, return empty
        if not self._read_buffer and self.timeout == 0:
            return b""
        
        # Look for newline
        if b'\n' in self._read_buffer:
            line, self._read_buffer = self._read_buffer.split(b'\n', 1)
            self.in_waiting = len(self._read_buffer)
            return line + b'\n'
        
        # Return entire buffer if no newline
        data, self._read_buffer = self._read_buffer, b""
        self.in_waiting = 0
        return data
    
    def flush(self) -> None:
        """Flush the write buffer (simulated)."""
        pass


def create_simulator_serial_port(port: str = "COM99", *args, **kwargs) -> Tuple[SerialSimulator, ClearCoreSimulator]:
    """
    Create a simulated serial port connected to a ClearCore simulator.
    
    Args:
        port: Port name (ignored)
        *args, **kwargs: Passed to SerialSimulator
        
    Returns:
        Tuple of (SerialSimulator, ClearCoreSimulator)
    """
    simulator = ClearCoreSimulator()
    simulator.start()
    serial_port = SerialSimulator(simulator, *args, **kwargs)
    return serial_port, simulator


# Patch serial port list function for testing
def patch_comports() -> List[ListPortInfo]:
    """
    Patch the serial.tools.list_ports.comports function to include a simulated port.
    
    Returns:
        List of ListPortInfo objects including the simulated port
    """
    from serial.tools.list_ports_common import ListPortInfo
    
    # Create simulated port info
    port = ListPortInfo("COM99")
    port.device = "COM99"
    port.description = "Simulated ClearCore Controller"
    port.hwid = "SIMULATED-CLEARCORE"
    
    return [port]