"""
Controller for the Space Maquette system.

This module provides a high-level interface for controlling the Space Maquette
hardware via the ClearCore controller.
"""

from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Tuple, Union, cast

import yaml

from space_maquette.protocol import ClearCoreProtocol, CommandResponse, CommandStatus

logger = logging.getLogger(__name__)


class AxisState(Enum):
    """Possible states for an axis."""
    UNKNOWN = "unknown"
    HOMING = "homing"
    HOMED = "homed"
    MOVING = "moving"
    STOPPED = "stopped"
    ERROR = "error"


@dataclass
class SystemStatus:
    """Current status of the Space Maquette system."""
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0
    pan: float = 0.0
    tilt: float = 0.0
    estop: bool = False
    moving: bool = False
    homed: bool = False
    x_state: AxisState = AxisState.UNKNOWN
    y_state: AxisState = AxisState.UNKNOWN
    z_state: AxisState = AxisState.UNKNOWN
    pan_state: AxisState = AxisState.UNKNOWN
    tilt_state: AxisState = AxisState.UNKNOWN
    last_update: float = 0.0
    
    @classmethod
    def from_response(cls, response: CommandResponse) -> SystemStatus:
        """Parse a STATUS command response into a SystemStatus object."""
        if response.status != CommandStatus.OK:
            return cls(last_update=time.time())
        
        # Example format: X=100.00,Y=200.00,Z=50.00,PAN=45.00,TILT=90.00,ESTOP=0,MOVING=1,HOMED=1
        status = cls(last_update=time.time())
        parts = response.message.split(',')
        
        for part in parts:
            if '=' not in part:
                continue
                
            key, value = part.split('=', 1)
            key = key.strip().lower()
            value = value.strip()
            
            if key == 'x':
                status.x = float(value)
            elif key == 'y':
                status.y = float(value)
            elif key == 'z':
                status.z = float(value)
            elif key == 'pan':
                status.pan = float(value)
            elif key == 'tilt':
                status.tilt = float(value)
            elif key == 'estop':
                status.estop = value == '1' or value.lower() == 'true'
            elif key == 'moving':
                status.moving = value == '1' or value.lower() == 'true'
            elif key == 'homed':
                status.homed = value == '1' or value.lower() == 'true'
        
        # Infer axis states based on overall status
        for axis in ['x', 'y', 'z', 'pan', 'tilt']:
            if not status.homed:
                setattr(status, f"{axis}_state", AxisState.UNKNOWN)
            elif status.moving:
                setattr(status, f"{axis}_state", AxisState.MOVING)
            else:
                setattr(status, f"{axis}_state", AxisState.HOMED)
        
        return status


class SpaceMaquetteController:
    """
    High-level controller for the Space Maquette system.
    
    This class provides methods for controlling the Space Maquette hardware
    and coordinates interactions between different components.
    """
    
    def __init__(
        self,
        port: str = "",
        baudrate: int = 115200,
        config_file: str = "config.yaml",
        use_checksum: bool = False,
        status_interval: float = 0.5
    ):
        self.config_file = config_file
        self.protocol = ClearCoreProtocol(
            port=port,
            baudrate=baudrate,
            use_checksum=use_checksum
        )
        self.config: Dict = {}
        self.status = SystemStatus()
        self.status_interval = status_interval
        self.running = False
        self.status_thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        
    def load_config(self) -> bool:
        """Load configuration from YAML file."""
        try:
            with open(self.config_file, 'r') as f:
                self.config = yaml.safe_load(f) or {}
            return True
        except Exception as e:
            logger.error(f"Error loading config file: {e}")
            return False
    
    def save_config(self) -> bool:
        """Save configuration to YAML file."""
        try:
            with open(self.config_file, 'w') as f:
                yaml.dump(self.config, f, default_flow_style=False)
            return True
        except Exception as e:
            logger.error(f"Error saving config file: {e}")
            return False
    
    def connect(self) -> bool:
        """Connect to the ClearCore and initialize the system."""
        if not self.protocol.connect():
            return False
        
        # Try loading config if it exists
        try:
            self.load_config()
        except:
            pass  # Ignore config loading errors
        
        return self.protocol.start()
    
    def disconnect(self) -> None:
        """Disconnect from the ClearCore and clean up."""
        self.stop_status_updates()
        self.protocol.stop()
    
    def start_status_updates(self) -> None:
        """Start periodic status updates in a background thread."""
        if self.running:
            return
        
        self.running = True
        self.status_thread = threading.Thread(target=self._status_update_loop)
        self.status_thread.daemon = True
        self.status_thread.start()
    
    def stop_status_updates(self) -> None:
        """Stop the status update thread."""
        self.running = False
        if self.status_thread:
            self.status_thread.join(timeout=2.0)
            self.status_thread = None
    
    def _status_update_loop(self) -> None:
        """Background thread that periodically requests status updates."""
        while self.running:
            try:
                response = self.protocol.get_status()
                if response.status == CommandStatus.OK:
                    with self._lock:
                        self.status = SystemStatus.from_response(response)
            except Exception as e:
                logger.error(f"Error updating status: {e}")
            
            # Sleep until next update interval
            time.sleep(self.status_interval)
    
    def get_status(self) -> SystemStatus:
        """Get the current system status."""
        with self._lock:
            return self.status
    
    def home_axis(self, axis: str) -> bool:
        """
        Home the specified axis or all axes.
        
        Args:
            axis: One of "ALL", "X", "Y", "Z"
            
        Returns:
            True if homing started successfully
        """
        response = self.protocol.home(axis)
        return response.status == CommandStatus.OK
    
    def home_all(self) -> bool:
        """
        Home all axes.
        
        Returns:
            True if homing started successfully
        """
        return self.home_axis("ALL")
    
    def move_to(
        self,
        x: float,
        y: float,
        z: float,
        pan: Optional[float] = None,
        tilt: Optional[float] = None
    ) -> bool:
        """
        Move to the specified position.
        
        Args:
            x, y, z: Position coordinates
            pan, tilt: Optional pan and tilt angles
            
        Returns:
            True if move started successfully
        """
        response = self.protocol.move(x, y, z, pan, tilt)
        return response.status == CommandStatus.OK
    
    def move_relative(
        self,
        dx: float = 0.0,
        dy: float = 0.0,
        dz: float = 0.0,
        dpan: float = 0.0,
        dtilt: float = 0.0
    ) -> bool:
        """
        Move relative to the current position.
        
        Args:
            dx, dy, dz: Relative position changes
            dpan, dtilt: Relative angle changes
            
        Returns:
            True if move started successfully
        """
        with self._lock:
            current = self.status
        
        # Calculate new absolute position
        x = current.x + dx
        y = current.y + dy
        z = current.z + dz
        pan = current.pan + dpan
        tilt = current.tilt + dtilt
        
        return self.move_to(x, y, z, pan, tilt)
    
    def stop(self) -> bool:
        """
        Stop all motion immediately.
        
        Returns:
            True if stop command was successful
        """
        response = self.protocol.stop()
        return response.status == CommandStatus.OK
    
    def emergency_stop(self) -> bool:
        """
        Activate emergency stop.
        
        Returns:
            True if E-STOP was activated successfully
        """
        response = self.protocol.estop()
        return response.status == CommandStatus.OK
    
    def reset_emergency_stop(self) -> bool:
        """
        Reset emergency stop if safe.
        
        Returns:
            True if E-STOP was reset successfully
        """
        response = self.protocol.reset_estop()
        return response.status == CommandStatus.OK
    
    def set_velocity(self, vx: float, vy: float, vz: float) -> bool:
        """
        Set axis velocities.
        
        Args:
            vx, vy, vz: Velocity values for each axis
            
        Returns:
            True if velocity was set successfully
        """
        response = self.protocol.set_velocity(vx, vy, vz)
        return response.status == CommandStatus.OK
    
    def set_pan(self, angle: float) -> bool:
        """
        Set pan angle.
        
        Args:
            angle: Pan angle in degrees
            
        Returns:
            True if pan angle was set successfully
        """
        response = self.protocol.set_pan(angle)
        return response.status == CommandStatus.OK
    
    def set_tilt(self, angle: float) -> bool:
        """
        Set tilt angle.
        
        Args:
            angle: Tilt angle in degrees
            
        Returns:
            True if tilt angle was set successfully
        """
        response = self.protocol.set_tilt(angle)
        return response.status == CommandStatus.OK
    
    def take_measurement(self) -> Union[float, None]:
        """
        Take a single distance measurement with the rangefinder.
        
        Returns:
            Measured distance in meters or None if measurement failed
        """
        response = self.protocol.measure()
        if response.status == CommandStatus.OK:
            try:
                return float(response.message)
            except ValueError:
                logger.error(f"Invalid measurement response: {response.message}")
                return None
        return None
    
    def start_scan(
        self,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        step: float
    ) -> bool:
        """
        Start a scanning operation over the specified area.
        
        Args:
            x1, y1: Start coordinates
            x2, y2: End coordinates
            step: Step size for the scan grid
            
        Returns:
            True if scan started successfully
        """
        response = self.protocol.scan(x1, y1, x2, y2, step)
        return response.status == CommandStatus.OK
    
    def get_config_value(self, key: str, default: str = "") -> str:
        """
        Get a configuration value from the ClearCore.
        
        Args:
            key: Configuration key
            default: Default value if key not found
            
        Returns:
            Configuration value as a string
        """
        response = self.protocol.get_config(key)
        if response.status == CommandStatus.OK:
            return response.message
        return default
    
    def set_config_value(self, key: str, value: str) -> bool:
        """
        Set a configuration value on the ClearCore.
        
        Args:
            key: Configuration key
            value: Value to set
            
        Returns:
            True if value was set successfully
        """
        response = self.protocol.set_config(key, value)
        return response.status == CommandStatus.OK
    
    def save_controller_config(self) -> bool:
        """
        Save current configuration to the ClearCore's SD card.
        
        Returns:
            True if config was saved successfully
        """
        response = self.protocol.save_config()
        return response.status == CommandStatus.OK
    
    # Video game style navigation methods
    
    def move_forward(self, distance: float = 10.0) -> bool:
        """
        Move forward (positive Y) by the specified distance.
        
        Args:
            distance: Distance to move in mm
            
        Returns:
            True if move started successfully
        """
        return self.move_relative(dy=distance)
    
    def move_backward(self, distance: float = 10.0) -> bool:
        """
        Move backward (negative Y) by the specified distance.
        
        Args:
            distance: Distance to move in mm
            
        Returns:
            True if move started successfully
        """
        return self.move_relative(dy=-distance)
    
    def move_left(self, distance: float = 10.0) -> bool:
        """
        Move left (negative X) by the specified distance.
        
        Args:
            distance: Distance to move in mm
            
        Returns:
            True if move started successfully
        """
        return self.move_relative(dx=-distance)
    
    def move_right(self, distance: float = 10.0) -> bool:
        """
        Move right (positive X) by the specified distance.
        
        Args:
            distance: Distance to move in mm
            
        Returns:
            True if move started successfully
        """
        return self.move_relative(dx=distance)
    
    def look_up(self, angle: float = 5.0) -> bool:
        """
        Look up (decrease tilt angle) by the specified amount.
        
        Args:
            angle: Angle to change in degrees
            
        Returns:
            True if tilt change was successful
        """
        return self.move_relative(dtilt=-angle)
    
    def look_down(self, angle: float = 5.0) -> bool:
        """
        Look down (increase tilt angle) by the specified amount.
        
        Args:
            angle: Angle to change in degrees
            
        Returns:
            True if tilt change was successful
        """
        return self.move_relative(dtilt=angle)
    
    def look_left(self, angle: float = 5.0) -> bool:
        """
        Look left (decrease pan angle) by the specified amount.
        
        Args:
            angle: Angle to change in degrees
            
        Returns:
            True if pan change was successful
        """
        return self.move_relative(dpan=-angle)
    
    def look_right(self, angle: float = 5.0) -> bool:
        """
        Look right (increase pan angle) by the specified amount.
        
        Args:
            angle: Angle to change in degrees
            
        Returns:
            True if pan change was successful
        """
        return self.move_relative(dpan=angle)