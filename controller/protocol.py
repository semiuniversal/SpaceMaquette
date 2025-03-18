"""
Protocol implementation for the Space Maquette ClearCore communication.

This module handles the low-level communication protocol as defined in
host-clearcore-protocol.md, including command formatting, sending/receiving,
and response parsing.
"""

from __future__ import annotations

import asyncio
import binascii
import logging
import queue
import threading
import time
from dataclasses import dataclass
from enum import Enum, auto
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

import serial
import serial.tools.list_ports

logger = logging.getLogger(__name__)


class CommandCategory(Enum):
    """Categories of commands supported by the protocol."""
    SYSTEM = auto()
    MOTION = auto()
    RANGEFINDER = auto()
    SERVO = auto()
    CONFIG = auto()


class CommandStatus(Enum):
    """Status of a command response."""
    OK = "OK"
    ERROR = "ERROR"
    PENDING = "PENDING"
    TIMEOUT = "TIMEOUT"


@dataclass
class CommandResponse:
    """Represents a response from the ClearCore."""
    status: CommandStatus
    message: str
    raw: str = ""
    timestamp: float = 0.0

    @classmethod
    def from_string(cls, response_str: str) -> CommandResponse:
        """Parse a response string into a CommandResponse object."""
        try:
            parts = response_str.strip().split(":", 1)
            if len(parts) == 2:
                status_str, message = parts
                status = CommandStatus.OK if status_str == "OK" else CommandStatus.ERROR
                return cls(status=status, message=message, raw=response_str, 
                          timestamp=time.time())
            else:
                return cls(
                    status=CommandStatus.ERROR,
                    message=f"Invalid response format: {response_str}",
                    raw=response_str,
                    timestamp=time.time(),
                )
        except Exception as e:
            return cls(
                status=CommandStatus.ERROR,
                message=f"Error parsing response: {e}",
                raw=response_str,
                timestamp=time.time(),
            )


@dataclass
class Command:
    """Represents a command to send to the ClearCore."""
    name: str
    params: Optional[List[Any]] = None
    category: CommandCategory = CommandCategory.SYSTEM
    use_checksum: bool = False
    timeout: float = 1.0
    
    def format(self) -> str:
        """Format the command according to the protocol."""
        if self.params:
            # Convert all parameters to strings
            param_strs = [str(p) for p in self.params]
            cmd_str = f"{self.name}:{','.join(param_strs)}"
        else:
            cmd_str = self.name
            
        if self.use_checksum:
            checksum = self._calculate_checksum(cmd_str)
            cmd_str = f"{cmd_str};{checksum}"
            
        return cmd_str
    
    def _calculate_checksum(self, data: str) -> str:
        """Calculate CRC-16 checksum for the command."""
        # CRC-16 MODBUS calculation
        crc = 0xFFFF
        for char in data:
            crc ^= ord(char)
            for _ in range(8):
                if crc & 0x0001:
                    crc = (crc >> 1) ^ 0xA001
                else:
                    crc = crc >> 1
        return format(crc, '02X')


class ClearCoreProtocol:
    """
    Implementation of the Space Maquette ClearCore communication protocol.
    
    This class handles the low-level details of sending commands and receiving
    responses according to the protocol definition.
    """
    
    def __init__(
        self, 
        port: str = "", 
        baudrate: int = 115200, 
        timeout: float = 1.0,
        use_checksum: bool = False
    ):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.use_checksum = use_checksum
        self.serial = None
        self.running = False
        self.command_queue: queue.Queue = queue.Queue()
        self.response_queue: queue.Queue = queue.Queue()
        self.comm_thread: Optional[threading.Thread] = None
        self._response_handlers: Dict[str, Callable[[CommandResponse], None]] = {}
        self._lock = threading.Lock()
        
    def connect(self) -> bool:
        """Connect to the ClearCore device."""
        try:
            if not self.port:
                self.port = self._find_port()
                if not self.port:
                    logger.error("No suitable serial port found")
                    return False
            
            logger.info(f"Connecting to {self.port} at {self.baudrate} baud")
            self.serial = serial.Serial(
                self.port,
                self.baudrate,
                timeout=self.timeout
            )
            return True
        except Exception as e:
            logger.error(f"Error connecting to serial port: {e}")
            return False
    
    def _find_port(self) -> str:
        """
        Attempt to automatically find the ClearCore device port.
        
        This is a simplistic implementation that might need to be adjusted
        based on actual device identifiers.
        """
        ports = list(serial.tools.list_ports.comports())
        for port in ports:
            # Look for likely ClearCore devices
            # This is a placeholder - you may need to adjust this based on 
            # how the ClearCore identifies itself
            if "ClearCore" in port.description or "Teknic" in port.description:
                return port.device
        
        # If no obvious match, return the first available port if any
        if ports:
            logger.warning(f"No ClearCore device found. Using {ports[0].device}")
            return ports[0].device
        
        return ""
    
    def start(self) -> bool:
        """Start the communication thread."""
        if self.running:
            return True
        
        if not self.serial and not self.connect():
            return False
        
        self.running = True
        self.comm_thread = threading.Thread(target=self._communication_loop)
        self.comm_thread.daemon = True
        self.comm_thread.start()
        logger.info("Communication thread started")
        return True
    
    def stop(self) -> None:
        """Stop the communication thread and close the connection."""
        self.running = False
        if self.comm_thread:
            self.comm_thread.join(timeout=2.0)
        
        if self.serial:
            self.serial.close()
            self.serial = None
        logger.info("Communication stopped")
    
    def _communication_loop(self) -> None:
        """Main communication loop that sends commands and receives responses."""
        while self.running:
            try:
                # Handle sending commands
                self._send_pending_commands()
                
                # Handle receiving responses
                self._receive_responses()
                
                # Small sleep to prevent CPU spinning
                time.sleep(0.001)
            except Exception as e:
                logger.error(f"Error in communication loop: {e}")
                time.sleep(0.1)  # Longer sleep on error
    
    def _send_pending_commands(self) -> None:
        """Send any pending commands in the queue."""
        try:
            # Non-blocking get with timeout to prevent high CPU usage
            cmd = self.command_queue.get_nowait()
            if self.serial and self.serial.is_open:
                cmd_str = cmd.format()
                logger.debug(f"Sending command: {cmd_str}")
                self.serial.write(f"{cmd_str}\n".encode())
                self.serial.flush()
            self.command_queue.task_done()
        except queue.Empty:
            pass  # No commands to send
        except Exception as e:
            logger.error(f"Error sending command: {e}")
    
    def _receive_responses(self) -> None:
        """Check for and process any incoming responses."""
        if not self.serial or not self.serial.is_open:
            return
        
        try:
            if self.serial.in_waiting:
                response = self.serial.readline().decode().strip()
                if response:
                    logger.debug(f"Received response: {response}")
                    cmd_response = CommandResponse.from_string(response)
                    self.response_queue.put(cmd_response)
                    
                    # Handle any registered callbacks for this response
                    self._process_response_handlers(cmd_response)
        except Exception as e:
            logger.error(f"Error receiving response: {e}")
    
    def _process_response_handlers(self, response: CommandResponse) -> None:
        """Process any registered handlers for this response."""
        with self._lock:
            handlers_to_remove = []
            for cmd_name, handler in self._response_handlers.items():
                try:
                    handler(response)
                    handlers_to_remove.append(cmd_name)
                except Exception as e:
                    logger.error(f"Error in response handler: {e}")
            
            # Remove one-time handlers that have been processed
            for cmd_name in handlers_to_remove:
                self._response_handlers.pop(cmd_name, None)
    
    def send_command(
        self, 
        cmd: Union[Command, str], 
        params: Optional[List[Any]] = None,
        callback: Optional[Callable[[CommandResponse], None]] = None
    ) -> None:
        """
        Send a command asynchronously.
        
        Args:
            cmd: Either a Command object or a string command name
            params: Parameters if cmd is a string (ignored if cmd is a Command)
            callback: Optional callback function called when a response is received
        """
        if isinstance(cmd, str):
            command = Command(
                name=cmd,
                params=params,
                use_checksum=self.use_checksum
            )
        else:
            command = cmd
        
        # Register callback if provided
        if callback:
            with self._lock:
                self._response_handlers[command.name] = callback
        
        # Queue the command for sending
        self.command_queue.put(command)
    
    def send_command_sync(
        self, 
        cmd: Union[Command, str], 
        params: Optional[List[Any]] = None,
        timeout: float = 1.0
    ) -> CommandResponse:
        """
        Send a command and wait for the response.
        
        This method blocks until a response is received or the timeout expires.
        
        Args:
            cmd: Either a Command object or a string command name
            params: Parameters if cmd is a string (ignored if cmd is a Command)
            timeout: How long to wait for a response
            
        Returns:
            CommandResponse object with the status and message
        """
        response_event = threading.Event()
        response_container = [None]  # Using a list as a mutable container
        
        def response_callback(resp: CommandResponse) -> None:
            response_container[0] = resp
            response_event.set()
        
        # Send the command with the callback
        self.send_command(cmd, params, response_callback)
        
        # Wait for the response
        if response_event.wait(timeout):
            return response_container[0]
        else:
            return CommandResponse(
                status=CommandStatus.TIMEOUT,
                message=f"Timeout waiting for response to {cmd}",
                timestamp=time.time()
            )

    # Convenience methods for specific commands
    
    def ping(self) -> CommandResponse:
        """Send a PING command to check if the system is responsive."""
        return self.send_command_sync("PING")
    
    def get_status(self) -> CommandResponse:
        """Get the current system status."""
        return self.send_command_sync("STATUS")
    
    def reset(self) -> CommandResponse:
        """Perform a soft reset of the system."""
        return self.send_command_sync("RESET")
    
    def estop(self) -> CommandResponse:
        """Activate emergency stop."""
        return self.send_command_sync("ESTOP")
    
    def reset_estop(self) -> CommandResponse:
        """Reset emergency stop if safe."""
        return self.send_command_sync("RESET_ESTOP")
    
    def home(self, axis: str) -> CommandResponse:
        """
        Home the specified axis.
        
        Args:
            axis: One of "ALL", "X", "Y", "Z"
        """
        return self.send_command_sync("HOME", [axis])
    
    def move(
        self, 
        x: float, 
        y: float, 
        z: float, 
        pan: Optional[float] = None, 
        tilt: Optional[float] = None
    ) -> CommandResponse:
        """
        Move to absolute position.
        
        Args:
            x, y, z: Position coordinates
            pan, tilt: Optional pan and tilt values
        """
        params = [x, y, z]
        if pan is not None:
            params.append(pan)
            if tilt is not None:
                params.append(tilt)
        
        return self.send_command_sync("MOVE", params)
    
    def stop(self) -> CommandResponse:
        """Stop all motion immediately."""
        return self.send_command_sync("STOP")
    
    def set_velocity(
        self, vx: float, vy: float, vz: float
    ) -> CommandResponse:
        """
        Set axis velocities.
        
        Args:
            vx, vy, vz: Velocity values for each axis
        """
        return self.send_command_sync("VELOCITY", [vx, vy, vz])
    
    def measure(self) -> CommandResponse:
        """Take a single distance measurement."""
        return self.send_command_sync("MEASURE")
    
    def scan(
        self, x1: float, y1: float, x2: float, y2: float, step: float
    ) -> CommandResponse:
        """
        Perform a scan over the specified area.
        
        Args:
            x1, y1: Start coordinates
            x2, y2: End coordinates
            step: Step size for the scan grid
        """
        return self.send_command_sync("SCAN", [x1, y1, x2, y2, step])
    
    def set_tilt(self, angle: float) -> CommandResponse:
        """
        Set tilt servo angle.
        
        Args:
            angle: Tilt angle in degrees
        """
        return self.send_command_sync("TILT", [angle])
    
    def set_pan(self, angle: float) -> CommandResponse:
        """
        Set pan axis angle.
        
        Args:
            angle: Pan angle in degrees
        """
        return self.send_command_sync("PAN", [angle])
    
    def get_config(self, key: str) -> CommandResponse:
        """
        Get configuration value.
        
        Args:
            key: Configuration key to retrieve
        """
        return self.send_command_sync("GET", [key])
    
    def set_config(self, key: str, value: str) -> CommandResponse:
        """
        Set configuration value.
        
        Args:
            key: Configuration key to set
            value: Value to set
        """
        return self.send_command_sync("SET", [key, value])
    
    def save_config(self) -> CommandResponse:
        """Save configuration to SD card."""
        return self.send_command_sync("SAVE")