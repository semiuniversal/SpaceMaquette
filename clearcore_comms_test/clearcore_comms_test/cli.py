"""
CLI interface for testing Ethernet communication with the ClearCore controller.
"""
import sys
import time
import logging
import json
from typing import Optional, Dict, Any, List

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.syntax import Syntax

from clearcore_comms_test.client.ethernet_client import ClearCoreClient
from clearcore_comms_test.client.command_handler import ClearCoreCommandHandler

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create console for rich output
console = Console()

# Global client and handler
client = None
handler = None

def print_response(success: bool, response: Any) -> None:
    """
    Print command response with formatting.
    
    Args:
        success: Whether the command was successful
        response: Response data
    """
    if success:
        if isinstance(response, dict):
            # Format dictionary response
            table = Table(title="Response")
            table.add_column("Key", style="cyan")
            table.add_column("Value", style="green")
            
            for key, value in response.items():
                table.add_row(str(key), str(value))
            
            console.print(table)
        else:
            # Format string or other response
            console.print(Panel(f"[green]{response}[/green]", title="Response", border_style="green"))
    else:
        # Format error response
        if isinstance(response, dict) and "error" in response:
            error_msg = response["error"]
        else:
            error_msg = str(response)
        
        console.print(Panel(f"[red]{error_msg}[/red]", title="Error", border_style="red"))

def ensure_connected(func):
    """Decorator to ensure client is connected before executing command."""
    def wrapper(*args, **kwargs):
        global client, handler
        
        if client is None or not client.is_connected():
            console.print("[yellow]Not connected to ClearCore. Use 'connect' command first.[/yellow]")
            return
        
        return func(*args, **kwargs)
    
    return wrapper

@click.group()
@click.option('--debug/--no-debug', default=False, help='Enable debug logging')
def cli(debug):
    """CLI tool for testing Ethernet communication with the ClearCore controller."""
    if debug:
        logging.getLogger().setLevel(logging.DEBUG)
        console.print("[yellow]Debug logging enabled[/yellow]")

@cli.command()
@click.argument('host')
@click.option('--port', '-p', default=8080, help='TCP port (default: 8080)')
@click.option('--timeout', '-t', default=5.0, help='Connection timeout in seconds (default: 5.0)')
def connect(host, port, timeout):
    """Connect to the ClearCore controller at the specified host and port."""
    global client, handler
    
    console.print(f"Connecting to ClearCore at {host}:{port}...")
    
    client = ClearCoreClient(host, port, timeout)
    success = client.connect()
    
    if success:
        handler = ClearCoreCommandHandler(client)
        console.print(f"[green]Connected to ClearCore at {host}:{port}[/green]")
    else:
        console.print(f"[red]Failed to connect to ClearCore at {host}:{port}[/red]")

@cli.command()
def disconnect():
    """Disconnect from the ClearCore controller."""
    global client, handler
    
    if client:
        client.disconnect()
        console.print("[green]Disconnected from ClearCore[/green]")
        client = None
        handler = None
    else:
        console.print("[yellow]Not connected to ClearCore[/yellow]")

# System Commands

@cli.command()
@ensure_connected
def ping():
    """Send a ping command to check if the system is responsive."""
    success, response = handler.ping()
    print_response(success, response)

@cli.command()
@ensure_connected
def reset():
    """Perform a soft reset of the system."""
    success, response = handler.reset()
    print_response(success, response)

@cli.command()
@ensure_connected
def status():
    """Get current system status."""
    success, response = handler.get_status()
    print_response(success, response)

@cli.command()
@click.argument('mode', type=click.Choice(['on', 'off'], case_sensitive=False))
@ensure_connected
def debug(mode):
    """Enable or disable debug mode."""
    enabled = mode.lower() == 'on'
    success, response = handler.set_debug(enabled)
    print_response(success, response)

@cli.command()
@ensure_connected
def estop():
    """Activate emergency stop."""
    success, response = handler.activate_estop()
    print_response(success, response)

@cli.command()
@ensure_connected
def reset_estop():
    """Reset emergency stop if safe."""
    success, response = handler.reset_estop()
    print_response(success, response)

# Motion Commands

@cli.command()
@click.argument('axis', type=click.Choice(['all', 'x', 'y', 'z'], case_sensitive=False))
@ensure_connected
def home(axis):
    """Home specified axis or all axes."""
    success, response = handler.home(axis.upper())
    print_response(success, response)

@cli.command()
@click.argument('x', type=float)
@click.argument('y', type=float)
@click.argument('z', type=float)
@click.option('--pan', '-p', type=float, help='Pan angle')
@click.option('--tilt', '-t', type=float, help='Tilt angle')
@ensure_connected
def move(x, y, z, pan, tilt):
    """Move to absolute position."""
    success, response = handler.move(x, y, z, pan, tilt)
    print_response(success, response)

@cli.command()
@ensure_connected
def stop():
    """Stop all motion immediately."""
    success, response = handler.stop()
    print_response(success, response)

@cli.command()
@click.argument('vx', type=float)
@click.argument('vy', type=float)
@click.argument('vz', type=float)
@ensure_connected
def velocity(vx, vy, vz):
    """Set axis velocities."""
    success, response = handler.set_velocity(vx, vy, vz)
    print_response(success, response)

# Rangefinder Commands

@cli.command()
@ensure_connected
def measure():
    """Take a single distance measurement."""
    success, response = handler.measure()
    print_response(success, response)

@cli.command()
@click.argument('x1', type=float)
@click.argument('y1', type=float)
@click.argument('x2', type=float)
@click.argument('y2', type=float)
@click.argument('step', type=float)
@ensure_connected
def scan(x1, y1, x2, y2, step):
    """Perform a scan over the specified area."""
    success, response = handler.scan(x1, y1, x2, y2, step)
    print_response(success, response)

# Servo Commands

@cli.command()
@click.argument('angle', type=float)
@ensure_connected
def tilt(angle):
    """Set tilt servo angle."""
    success, response = handler.set_tilt(angle)
    print_response(success, response)

@cli.command()
@click.argument('angle', type=float)
@ensure_connected
def pan(angle):
    """Set pan axis angle."""
    success, response = handler.set_pan(angle)
    print_response(success, response)

# Configuration Commands

@cli.command()
@ensure_connected
def load_config():
    """Load configuration from SD card."""
    success, response = handler.load_config()
    print_response(success, response)

@cli.command()
@ensure_connected
def save_config():
    """Save configuration to SD card."""
    success, response = handler.save_config()
    print_response(success, response)

@cli.command()
@ensure_connected
def list_config():
    """List all configuration items."""
    success, response = handler.list_config()
    print_response(success, response)

@cli.command()
@click.argument('key')
@ensure_connected
def get_config(key):
    """Get configuration value."""
    success, response = handler.get_config(key)
    print_response(success, response)

@cli.command()
@click.argument('key')
@click.argument('value')
@ensure_connected
def set_config(key, value):
    """Set configuration value."""
    success, response = handler.set_config(key, value)
    print_response(success, response)

# Raw command

@cli.command()
@click.argument('command')
@click.argument('params', nargs=-1)
@click.option('--checksum/--no-checksum', default=False, help='Use checksum')
@ensure_connected
def raw(command, params, checksum):
    """Send a raw command to the ClearCore controller."""
    param_list = list(params) if params else None
    success, response = client.send_command(command, param_list, checksum)
    print_response(success, response)

# Interactive mode

@cli.command()
@click.option('--host', '-h', required=True, help='ClearCore host address')
@click.option('--port', '-p', default=8080, help='TCP port (default: 8080)')
def interactive(host, port):
    """Start interactive mode for sending commands."""
    global client, handler
    
    console.print(f"Connecting to ClearCore at {host}:{port}...")
    
    client = ClearCoreClient(host, port)
    success = client.connect()
    
    if success:
        handler = ClearCoreCommandHandler(client)
        console.print(f"[green]Connected to ClearCore at {host}:{port}[/green]")
        console.print("Enter commands in format: <COMMAND> [PARAM1 PARAM2 ...] or 'exit' to quit")
        
        while True:
            try:
                # Get user input
                cmd_line = input("> ").strip()
                
                # Check for exit command
                if cmd_line.lower() in ['exit', 'quit', 'q']:
                    break
                
                # Parse command and parameters
                parts = cmd_line.split()
                if not parts:
                    continue
                
                command = parts[0].upper()
                params = parts[1:] if len(parts) > 1 else None
                
                # Convert numeric parameters
                if params:
                    converted_params = []
                    for p in params:
                        try:
                            # Try to convert to float if it looks like a number
                            if '.' in p:
                                converted_params.append(float(p))
                            else:
                                converted_params.append(int(p))
                        except ValueError:
                            # Keep as string if not a number
                            converted_params.append(p)
                    params = converted_params
                
                # Send command
                success, response = client.send_command(command, params)
                print_response(success, response)
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                console.print(f"[red]Error: {str(e)}[/red]")
        
        # Disconnect when done
        client.disconnect()
        console.print("[green]Disconnected from ClearCore[/green]")
    else:
        console.print(f"[red]Failed to connect to ClearCore at {host}:{port}[/red]")

if __name__ == '__main__':
    cli()
