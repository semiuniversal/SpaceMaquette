"""
Tests for the CLI interface.
"""
import pytest
from unittest.mock import MagicMock, patch
from click.testing import CliRunner

from clearcore_comms_test.cli import cli

class TestCli:
    """Test cases for the CLI interface."""
    
    @pytest.fixture
    def runner(self):
        """Create a CLI runner for testing."""
        return CliRunner()
    
    def test_cli_help(self, runner):
        """Test CLI help command."""
        result = runner.invoke(cli, ["--help"])
        assert result.exit_code == 0
        assert "CLI tool for testing Ethernet communication" in result.output
    
    @patch('clearcore_comms_test.client.ethernet_client.ClearCoreClient')
    def test_connect_success(self, mock_client_class, runner):
        """Test connect command with successful connection."""
        # Setup mock
        mock_client_instance = MagicMock()
        mock_client_class.return_value = mock_client_instance
        mock_client_instance.connect.return_value = True
        
        # Run command
        result = runner.invoke(cli, ["connect", "192.168.1.100"])
        
        # Verify
        assert result.exit_code == 0
        assert "Connected to ClearCore" in result.output
        mock_client_instance.connect.assert_called_once()
    
    @patch('clearcore_comms_test.client.ethernet_client.ClearCoreClient')
    def test_connect_failure(self, mock_client_class, runner):
        """Test connect command with failed connection."""
        # Setup mock
        mock_client_instance = MagicMock()
        mock_client_class.return_value = mock_client_instance
        mock_client_instance.connect.return_value = False
        
        # Run command
        result = runner.invoke(cli, ["connect", "192.168.1.100"])
        
        # Verify
        assert result.exit_code == 0
        assert "Failed to connect" in result.output
        mock_client_instance.connect.assert_called_once()
    
    @patch('clearcore_comms_test.cli.client')
    @patch('clearcore_comms_test.cli.handler')
    def test_ping(self, mock_handler, mock_client, runner):
        """Test ping command."""
        # Setup mocks
        mock_client.is_connected.return_value = True
        mock_handler.ping.return_value = (True, "OK:PONG")
        
        # Run command
        result = runner.invoke(cli, ["ping"])
        
        # Verify
        assert result.exit_code == 0
        assert "OK:PONG" in result.output
        mock_handler.ping.assert_called_once()
    
    @patch('clearcore_comms_test.cli.client')
    def test_command_not_connected(self, mock_client, runner):
        """Test command when not connected."""
        # Setup mock
        mock_client.is_connected.return_value = False
        
        # Run command
        result = runner.invoke(cli, ["ping"])
        
        # Verify
        assert result.exit_code == 0
        assert "Not connected to ClearCore" in result.output
    
    @patch('clearcore_comms_test.cli.client')
    @patch('clearcore_comms_test.cli.handler')
    def test_status(self, mock_handler, mock_client, runner):
        """Test status command."""
        # Setup mocks
        mock_client.is_connected.return_value = True
        mock_handler.get_status.return_value = (True, {
            "x": 100.5,
            "y": 200.3,
            "z": 50.0,
            "pan": 45.0,
            "tilt": 90.0,
            "estop": False,
            "moving": True,
            "homed": True
        })
        
        # Run command
        result = runner.invoke(cli, ["status"])
        
        # Verify
        assert result.exit_code == 0
        assert "x" in result.output
        assert "100.5" in result.output
        mock_handler.get_status.assert_called_once()
    
    @patch('clearcore_comms_test.cli.client')
    @patch('clearcore_comms_test.cli.handler')
    def test_move(self, mock_handler, mock_client, runner):
        """Test move command."""
        # Setup mocks
        mock_client.is_connected.return_value = True
        mock_handler.move.return_value = (True, "OK:MOVE_STARTED")
        
        # Run command
        result = runner.invoke(cli, ["move", "100.5", "200.3", "50.0", "--pan", "45.0", "--tilt", "90.0"])
        
        # Verify
        assert result.exit_code == 0
        assert "OK:MOVE_STARTED" in result.output
        mock_handler.move.assert_called_once_with(100.5, 200.3, 50.0, 45.0, 90.0)
    
    @patch('clearcore_comms_test.cli.client')
    def test_raw_command(self, mock_client, runner):
        """Test raw command."""
        # Setup mock
        mock_client.is_connected.return_value = True
        mock_client.send_command.return_value = (True, "OK:CUSTOM_COMMAND")
        
        # Run command
        result = runner.invoke(cli, ["raw", "CUSTOM", "param1", "param2"])
        
        # Verify
        assert result.exit_code == 0
        assert "OK:CUSTOM_COMMAND" in result.output
        mock_client.send_command.assert_called_once_with("CUSTOM", ["param1", "param2"], False)
