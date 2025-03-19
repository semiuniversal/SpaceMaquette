"""
Ethernet client for communicating with the ClearCore controller.
"""
import socket
import time
import logging
from typing import Optional, Tuple, List, Union

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ClearCoreClient:
    """Client for communicating with the ClearCore controller over Ethernet."""
    
    def __init__(self, host: str, port: int = 8080, timeout: float = 5.0):
        """
        Initialize the ClearCore client.
        
        Args:
            host: IP address of the ClearCore controller
            port: TCP port of the ClearCore controller
            timeout: Socket timeout in seconds
        """
        self.host = host
        self.port = port
        self.timeout = timeout
        self.socket = None
        self.connected = False
        self._buffer = b""
    
    def connect(self) -> bool:
        """
        Connect to the ClearCore controller.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(self.timeout)
            self.socket.connect((self.host, self.port))
            self.connected = True
            logger.info(f"Connected to ClearCore at {self.host}:{self.port}")
            return True
        except (socket.timeout, ConnectionRefusedError, OSError) as e:
            logger.error(f"Failed to connect to ClearCore: {e}")
            self.connected = False
            return False
    
    def disconnect(self) -> None:
        """Disconnect from the ClearCore controller."""
        if self.socket:
            self.socket.close()
            self.socket = None
        self.connected = False
        logger.info("Disconnected from ClearCore")
    
    def is_connected(self) -> bool:
        """
        Check if connected to the ClearCore controller.
        
        Returns:
            True if connected, False otherwise
        """
        return self.connected and self.socket is not None
    
    def send_command(self, command: str, params: Optional[List[Union[str, float, int]]] = None, 
                    use_checksum: bool = False) -> Tuple[bool, str]:
        """
        Send a command to the ClearCore controller.
        
        Args:
            command: Command name (e.g., "MOVE", "HOME", "STATUS")
            params: List of parameters (optional)
            use_checksum: Whether to calculate and append a CRC-16 checksum
            
        Returns:
            Tuple of (success, response)
        """
        if not self.is_connected():
            logger.error("Not connected to ClearCore")
            return False, "ERROR:NOT_CONNECTED"
        
        # Format command
        cmd_str = command
        if params:
            param_str = ",".join(str(p) for p in params)
            cmd_str = f"{command}:{param_str}"
        else:
            cmd_str = command
        
        # Add checksum if requested
        if use_checksum:
            checksum = self._calculate_crc16(cmd_str)
            cmd_str = f"{cmd_str};{checksum:X}"
        
        # Add newline and convert to bytes
        cmd_bytes = f"{cmd_str}\n".encode('utf-8')
        
        try:
            # Send command
            self.socket.sendall(cmd_bytes)
            logger.debug(f"Sent: {cmd_str}")
            
            # Receive response
            response = self._receive_response()
            logger.debug(f"Received: {response}")
            
            # Parse response
            if ":" in response:
                status, message = response.split(":", 1)
                return status == "OK", response
            else:
                return False, response
        except (socket.timeout, ConnectionResetError, BrokenPipeError) as e:
            logger.error(f"Communication error: {e}")
            self.connected = False
            return False, f"ERROR:{str(e)}"
    
    def _receive_response(self) -> str:
        """Receive a response from the ClearCore controller."""
        start_time = time.time()
        
        while time.time() - start_time < self.timeout:
            try:
                # Check if we already have a complete response in the buffer
                if b'\n' in self._buffer:
                    line, self._buffer = self._buffer.split(b'\n', 1)
                    # Filter out non-printable characters
                    printable_line = ''.join(chr(c) for c in line if c >= 32 and c < 127)
                    return printable_line.strip()
                
                # Receive more data
                data = self.socket.recv(1024)
                if not data:
                    # Connection closed
                    self.connected = False
                    return "ERROR:CONNECTION_CLOSED"
                
                # Debug: Print raw received bytes
                print(f"Received raw bytes: {data.hex()}")
                
                self._buffer += data
            except socket.timeout:
                # Timeout waiting for data
                return "ERROR:TIMEOUT"
    
    def _calculate_crc16(self, data: str) -> int:
        """
        Calculate CRC-16 checksum for the given data.
        
        Args:
            data: String data to calculate checksum for
            
        Returns:
            CRC-16 checksum value
        """
        crc = 0xFFFF
        for char in data:
            crc ^= ord(char)
            for _ in range(8):
                if crc & 0x0001:
                    crc = (crc >> 1) ^ 0xA001
                else:
                    crc = crc >> 1
        return crc
    
    def __enter__(self):
        """Context manager entry."""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.disconnect()
