"""
Command handler for the ClearCore controller.
Provides high-level methods for sending commands to the ClearCore.
"""
from typing import List, Optional, Tuple, Union, Dict, Any
from .ethernet_client import ClearCoreClient

class ClearCoreCommandHandler:
    """High-level command handler for the ClearCore controller."""
    
    def __init__(self, client: ClearCoreClient):
        """
        Initialize the command handler.
        
        Args:
            client: ClearCoreClient instance
        """
        self.client = client
    
    # System Commands
    
    def ping(self) -> Tuple[bool, str]:
        """
        Send a ping command to check if the system is responsive.
        
        Returns:
            Tuple of (success, response)
        """
        return self.client.send_command("PING")
    
    def reset(self) -> Tuple[bool, str]:
        """
        Perform a soft reset of the system.
        
        Returns:
            Tuple of (success, response)
        """
        return self.client.send_command("RESET")
    
    def get_status(self) -> Tuple[bool, Dict[str, Any]]:
        """
        Get current system status.
        
        Returns:
            Tuple of (success, status_dict)
        """
        success, response = self.client.send_command("STATUS")
        if success:
            # Parse status response
            # Format: OK:X=<x>,Y=<y>,Z=<z>,PAN=<pan>,TILT=<tilt>,ESTOP=<0/1>,MOVING=<0/1>,HOMED=<0/1>
            try:
                _, status_str = response.split(":", 1)
                status_parts = status_str.split(",")
                status_dict = {}
                
                for part in status_parts:
                    key, value = part.split("=", 1)
                    # Convert numeric values
                    if key in ["X", "Y", "Z", "PAN", "TILT"]:
                        status_dict[key.lower()] = float(value)
                    elif key in ["ESTOP", "MOVING", "HOMED"]:
                        status_dict[key.lower()] = value == "1"
                    else:
                        status_dict[key.lower()] = value
                
                return True, status_dict
            except (ValueError, IndexError):
                return False, {"error": "Failed to parse status response"}
        else:
            return False, {"error": response}
    
    def set_debug(self, enabled: bool) -> Tuple[bool, str]:
        """
        Enable or disable debug mode.
        
        Args:
            enabled: True to enable debug mode, False to disable
            
        Returns:
            Tuple of (success, response)
        """
        mode = "ON" if enabled else "OFF"
        return self.client.send_command("DEBUG", [mode])
    
    def activate_estop(self) -> Tuple[bool, str]:
        """
        Activate emergency stop.
        
        Returns:
            Tuple of (success, response)
        """
        return self.client.send_command("ESTOP")
    
    def reset_estop(self) -> Tuple[bool, str]:
        """
        Reset emergency stop if safe.
        
        Returns:
            Tuple of (success, response)
        """
        return self.client.send_command("RESET_ESTOP")
    
    # Motion Commands
    
    def home(self, axis: str = "ALL") -> Tuple[bool, str]:
        """
        Home specified axis or all axes.
        
        Args:
            axis: Axis to home ("ALL", "X", "Y", or "Z")
            
        Returns:
            Tuple of (success, response)
        """
        if axis not in ["ALL", "X", "Y", "Z"]:
            return False, "ERROR:INVALID_AXIS"
        
        return self.client.send_command("HOME", [axis])
    
    def move(self, x: float, y: float, z: float, 
             pan: Optional[float] = None, tilt: Optional[float] = None) -> Tuple[bool, str]:
        """
        Move to absolute position.
        
        Args:
            x: X position
            y: Y position
            z: Z position
            pan: Pan angle (optional)
            tilt: Tilt angle (optional)
            
        Returns:
            Tuple of (success, response)
        """
        params = [x, y, z]
        if pan is not None:
            params.append(pan)
            if tilt is not None:
                params.append(tilt)
        
        return self.client.send_command("MOVE", params)
    
    def stop(self) -> Tuple[bool, str]:
        """
        Stop all motion immediately.
        
        Returns:
            Tuple of (success, response)
        """
        return self.client.send_command("STOP")
    
    def set_velocity(self, vx: float, vy: float, vz: float) -> Tuple[bool, str]:
        """
        Set axis velocities.
        
        Args:
            vx: X axis velocity
            vy: Y axis velocity
            vz: Z axis velocity
            
        Returns:
            Tuple of (success, response)
        """
        return self.client.send_command("VELOCITY", [vx, vy, vz])
    
    # Rangefinder Commands
    
    def measure(self) -> Tuple[bool, Union[float, str]]:
        """
        Take a single distance measurement.
        
        Returns:
            Tuple of (success, distance or error message)
        """
        success, response = self.client.send_command("MEASURE")
        if success:
            try:
                _, distance_str = response.split(":", 1)
                return True, float(distance_str)
            except (ValueError, IndexError):
                return False, "Failed to parse measurement response"
        else:
            return False, response
    
    def scan(self, x1: float, y1: float, x2: float, y2: float, step: float) -> Tuple[bool, str]:
        """
        Perform a scan over the specified area.
        
        Args:
            x1: Start X position
            y1: Start Y position
            x2: End X position
            y2: End Y position
            step: Step size
            
        Returns:
            Tuple of (success, response)
        """
        return self.client.send_command("SCAN", [x1, y1, x2, y2, step])
    
    # Servo Commands
    
    def set_tilt(self, angle: float) -> Tuple[bool, str]:
        """
        Set tilt servo angle.
        
        Args:
            angle: Tilt angle
            
        Returns:
            Tuple of (success, response)
        """
        return self.client.send_command("TILT", [angle])
    
    def set_pan(self, angle: float) -> Tuple[bool, str]:
        """
        Set pan axis angle.
        
        Args:
            angle: Pan angle
            
        Returns:
            Tuple of (success, response)
        """
        return self.client.send_command("PAN", [angle])
    
    # Configuration Commands
    
    def load_config(self) -> Tuple[bool, str]:
        """
        Load configuration from SD card.
        
        Returns:
            Tuple of (success, response)
        """
        return self.client.send_command("CONFIG", ["LOAD"])
    
    def save_config(self) -> Tuple[bool, str]:
        """
        Save configuration to SD card.
        
        Returns:
            Tuple of (success, response)
        """
        return self.client.send_command("CONFIG", ["SAVE"])
    
    def list_config(self) -> Tuple[bool, str]:
        """
        List all configuration items.
        
        Returns:
            Tuple of (success, response)
        """
        return self.client.send_command("CONFIG", ["LIST"])
    
    def get_config(self, key: str) -> Tuple[bool, str]:
        """
        Get configuration value.
        
        Args:
            key: Configuration key
            
        Returns:
            Tuple of (success, value or error message)
        """
        return self.client.send_command("GET", [key])
    
    def set_config(self, key: str, value: str) -> Tuple[bool, str]:
        """
        Set configuration value.
        
        Args:
            key: Configuration key
            value: Configuration value
            
        Returns:
            Tuple of (success, response)
        """
        return self.client.send_command("SET", [key, value])
