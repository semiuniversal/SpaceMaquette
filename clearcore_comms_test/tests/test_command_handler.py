"""
Tests for the command handler module.
"""
import pytest
from unittest.mock import MagicMock, patch

from clearcore_comms_test.client.command_handler import ClearCoreCommandHandler
from clearcore_comms_test.client.ethernet_client import ClearCoreClient

class TestClearCoreCommandHandler:
    """Test cases for the ClearCoreCommandHandler class."""
    
    @pytest.fixture
    def mock_client(self):
        """Create a mock client for testing."""
        client = MagicMock(spec=ClearCoreClient)
        return client
    
    @pytest.fixture
    def handler(self, mock_client):
        """Create a command handler with mock client for testing."""
        return ClearCoreCommandHandler(mock_client)
    
    def test_ping(self, handler, mock_client):
        """Test ping command."""
        mock_client.send_command.return_value = (True, "OK:PONG")
        success, response = handler.ping()
        
        assert success is True
        assert response == "OK:PONG"
        mock_client.send_command.assert_called_once_with("PING")
    
    def test_reset(self, handler, mock_client):
        """Test reset command."""
        mock_client.send_command.return_value = (True, "OK:RESETTING")
        success, response = handler.reset()
        
        assert success is True
        assert response == "OK:RESETTING"
        mock_client.send_command.assert_called_once_with("RESET")
    
    def test_get_status(self, handler, mock_client):
        """Test status command."""
        mock_client.send_command.return_value = (True, "OK:X=100.5,Y=200.3,Z=50.0,PAN=45.0,TILT=90.0,ESTOP=0,MOVING=1,HOMED=1")
        success, status = handler.get_status()
        
        assert success is True
        assert isinstance(status, dict)
        assert status["x"] == 100.5
        assert status["y"] == 200.3
        assert status["z"] == 50.0
        assert status["pan"] == 45.0
        assert status["tilt"] == 90.0
        assert status["estop"] is False
        assert status["moving"] is True
        assert status["homed"] is True
        mock_client.send_command.assert_called_once_with("STATUS")
    
    def test_get_status_error(self, handler, mock_client):
        """Test status command with error response."""
        mock_client.send_command.return_value = (False, "ERROR:ESTOP_ACTIVE")
        success, status = handler.get_status()
        
        assert success is False
        assert isinstance(status, dict)
        assert "error" in status
        mock_client.send_command.assert_called_once_with("STATUS")
    
    def test_set_debug(self, handler, mock_client):
        """Test debug command."""
        mock_client.send_command.return_value = (True, "OK:DEBUG_ENABLED")
        success, response = handler.set_debug(True)
        
        assert success is True
        assert response == "OK:DEBUG_ENABLED"
        mock_client.send_command.assert_called_once_with("DEBUG", ["ON"])
    
    def test_home(self, handler, mock_client):
        """Test home command."""
        mock_client.send_command.return_value = (True, "OK:HOMING_STARTED")
        success, response = handler.home("X")
        
        assert success is True
        assert response == "OK:HOMING_STARTED"
        mock_client.send_command.assert_called_once_with("HOME", ["X"])
    
    def test_move(self, handler, mock_client):
        """Test move command."""
        mock_client.send_command.return_value = (True, "OK:MOVE_STARTED")
        success, response = handler.move(100.5, 200.3, 50.0, 45.0, 90.0)
        
        assert success is True
        assert response == "OK:MOVE_STARTED"
        mock_client.send_command.assert_called_once_with("MOVE", [100.5, 200.3, 50.0, 45.0, 90.0])
    
    def test_measure(self, handler, mock_client):
        """Test measure command."""
        mock_client.send_command.return_value = (True, "OK:123.45")
        success, distance = handler.measure()
        
        assert success is True
        assert distance == 123.45
        mock_client.send_command.assert_called_once_with("MEASURE")
    
    def test_measure_error(self, handler, mock_client):
        """Test measure command with error response."""
        mock_client.send_command.return_value = (False, "ERROR:OUT_OF_RANGE")
        success, response = handler.measure()
        
        assert success is False
        assert response == "ERROR:OUT_OF_RANGE"
        mock_client.send_command.assert_called_once_with("MEASURE")
    
    def test_scan(self, handler, mock_client):
        """Test scan command."""
        mock_client.send_command.return_value = (True, "OK:SCAN_STARTED")
        success, response = handler.scan(0, 0, 100, 100, 10)
        
        assert success is True
        assert response == "OK:SCAN_STARTED"
        mock_client.send_command.assert_called_once_with("SCAN", [0, 0, 100, 100, 10])
    
    def test_set_tilt(self, handler, mock_client):
        """Test tilt command."""
        mock_client.send_command.return_value = (True, "OK:TILT_SET")
        success, response = handler.set_tilt(90.0)
        
        assert success is True
        assert response == "OK:TILT_SET"
        mock_client.send_command.assert_called_once_with("TILT", [90.0])
    
    def test_set_pan(self, handler, mock_client):
        """Test pan command."""
        mock_client.send_command.return_value = (True, "OK:PAN_SET")
        success, response = handler.set_pan(45.0)
        
        assert success is True
        assert response == "OK:PAN_SET"
        mock_client.send_command.assert_called_once_with("PAN", [45.0])
    
    def test_get_config(self, handler, mock_client):
        """Test get_config command."""
        mock_client.send_command.return_value = (True, "OK:100")
        success, response = handler.get_config("velocity_x")
        
        assert success is True
        assert response == "OK:100"
        mock_client.send_command.assert_called_once_with("GET", ["velocity_x"])
    
    def test_set_config(self, handler, mock_client):
        """Test set_config command."""
        mock_client.send_command.return_value = (True, "OK:VALUE_SET")
        success, response = handler.set_config("velocity_x", "100")
        
        assert success is True
        assert response == "OK:VALUE_SET"
        mock_client.send_command.assert_called_once_with("SET", ["velocity_x", "100"])
