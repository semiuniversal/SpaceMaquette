"""
Tests for the Ethernet client module.
"""
import socket
import pytest
from unittest.mock import MagicMock, patch

from clearcore_comms_test.client.ethernet_client import ClearCoreClient

class TestClearCoreClient:
    """Test cases for the ClearCoreClient class."""
    
    def test_init(self):
        """Test client initialization."""
        client = ClearCoreClient("192.168.1.100", 8080, 5.0)
        assert client.host == "192.168.1.100"
        assert client.port == 8080
        assert client.timeout == 5.0
        assert client.socket is None
        assert client.connected is False
    
    @patch('socket.socket')
    def test_connect_success(self, mock_socket):
        """Test successful connection."""
        # Setup mock
        mock_socket_instance = MagicMock()
        mock_socket.return_value = mock_socket_instance
        
        # Create client and connect
        client = ClearCoreClient("192.168.1.100", 8080)
        result = client.connect()
        
        # Verify
        assert result is True
        assert client.connected is True
        mock_socket_instance.settimeout.assert_called_once_with(client.timeout)
        mock_socket_instance.connect.assert_called_once_with(("192.168.1.100", 8080))
    
    @patch('socket.socket')
    def test_connect_failure(self, mock_socket):
        """Test connection failure."""
        # Setup mock to raise exception
        mock_socket_instance = MagicMock()
        mock_socket.return_value = mock_socket_instance
        mock_socket_instance.connect.side_effect = ConnectionRefusedError("Connection refused")
        
        # Create client and try to connect
        client = ClearCoreClient("192.168.1.100", 8080)
        result = client.connect()
        
        # Verify
        assert result is False
        assert client.connected is False
    
    def test_disconnect(self):
        """Test disconnection."""
        client = ClearCoreClient("192.168.1.100", 8080)
        client.socket = MagicMock()
        client.connected = True
        
        client.disconnect()
        
        assert client.socket is None
        assert client.connected is False
    
    def test_is_connected(self):
        """Test connection status check."""
        client = ClearCoreClient("192.168.1.100", 8080)
        
        # Not connected
        assert client.is_connected() is False
        
        # Connected
        client.socket = MagicMock()
        client.connected = True
        assert client.is_connected() is True
    
    @patch('socket.socket')
    def test_send_command_not_connected(self, mock_socket):
        """Test sending command when not connected."""
        client = ClearCoreClient("192.168.1.100", 8080)
        success, response = client.send_command("STATUS")
        
        assert success is False
        assert response == "ERROR:NOT_CONNECTED"
    
    @patch('socket.socket')
    def test_send_command_with_params(self, mock_socket):
        """Test sending command with parameters."""
        # Setup mock
        mock_socket_instance = MagicMock()
        mock_socket.return_value = mock_socket_instance
        
        # Setup mock to return a response
        mock_socket_instance.recv.return_value = b"OK:MOVE_STARTED\n"
        
        # Create client and connect
        client = ClearCoreClient("192.168.1.100", 8080)
        client.socket = mock_socket_instance
        client.connected = True
        
        # Send command with parameters
        success, response = client.send_command("MOVE", [100.5, 200.3, 50.0])
        
        # Verify
        assert success is True
        assert response == "OK:MOVE_STARTED"
        mock_socket_instance.sendall.assert_called_once_with(b"MOVE:100.5,200.3,50.0\n")
    
    @patch('socket.socket')
    def test_send_command_with_checksum(self, mock_socket):
        """Test sending command with checksum."""
        # Setup mock
        mock_socket_instance = MagicMock()
        mock_socket.return_value = mock_socket_instance
        
        # Setup mock to return a response
        mock_socket_instance.recv.return_value = b"OK:PONG\n"
        
        # Create client and connect
        client = ClearCoreClient("192.168.1.100", 8080)
        client.socket = mock_socket_instance
        client.connected = True
        
        # Mock the CRC calculation to return a known value
        client._calculate_crc16 = MagicMock(return_value=0xA5)
        
        # Send command with checksum
        success, response = client.send_command("PING", use_checksum=True)
        
        # Verify
        assert success is True
        assert response == "OK:PONG"
        mock_socket_instance.sendall.assert_called_once_with(b"PING;A5\n")
    
    def test_calculate_crc16(self):
        """Test CRC-16 calculation."""
        client = ClearCoreClient("192.168.1.100", 8080)
        
        # Test with known values
        assert client._calculate_crc16("PING") == 0x8A7D
        assert client._calculate_crc16("MOVE:100.5,200.3,50.0") == 0x5F1B
