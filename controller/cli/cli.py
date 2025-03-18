"""
Interactive CLI for the Space Maquette controller.

This module provides an interactive shell for controlling the Space Maquette
hardware via a command-line interface.
"""

import logging
import os
import sys
import time
from typing import Dict, Optional, List, Any, Callable

from prompt_toolkit import PromptSession
from prompt_toolkit.auto_suggest import AutoSuggestFromHistory
from prompt_toolkit.completion import Completer, Completion
from prompt_toolkit.formatted_text import HTML
from prompt_toolkit.history import FileHistory
from prompt_toolkit.styles import Style
from rich.console import Console
from rich.table import Table

from space_maquette.controller import SpaceMaquetteController, SystemStatus
from space_maquette.protocol import CommandStatus

# Set up rich console
console = Console()
logger = logging.getLogger(__name__)


class SpaceMaquetteCompleter(Completer):
    """Tab completion for Space Maquette CLI commands."""
    
    def __init__(self):
        # Commands organized by category
        self.commands = {
            "System": [
                "help", "exit", "quit", "status", "ping", "reset", "estop", "reset_estop",
                "connect", "disconnect",
            ],
            "Motion": [
                "home", "home_all", "home_x", "home_y", "home_z", 
                "move", "stop", "velocity", "forward", "backward", "left", "right",
            ],
            "Camera": [
                "pan", "tilt", "look_up", "look_down", "look_left", "look_right",
            ],
            "Rangefinder": [
                "measure", "scan",
            ],
            "Configuration": [
                "get", "set", "save_config", "load_config",
            ],
        }
        
        # Flatten commands for simple completion
        self.all_commands = []
        for category in self.commands.values():
            self.all_commands.extend(category)
    
    def get_completions(self, document, complete_event):
        word_before_cursor = document.get_word_before_cursor()
        
        # Complete commands
        if not document.text.strip() or document.text.strip() == word_before_cursor:
            for command in self.all_commands:
                if command.startswith(word_before_cursor):
                    yield Completion(
                        command,
                        start_position=-len(word_before_cursor),
                        display=command,
                    )


class SpaceMaquetteCLI:
    """
    Interactive CLI for the Space Maquette controller.
    
    This class provides a command-line interface for controlling the
    Space Maquette system, with support for interactive commands and
    tab completion.
    """
    
    def __init__(
        self,
        port: str = "",
        baudrate: int = 115200,
        config_file: str = "config.yaml",
        use_checksum: bool = False,
    ):
        self.port = port
        self.baudrate = baudrate
        self.config_file = config_file
        self.use_checksum = use_checksum
        self.controller = None
        self.console = Console()
        
        # Command history file
        history_dir = os.path.expanduser("~/.space_maquette")
        os.makedirs(history_dir, exist_ok=True)
        history_file = os.path.join(history_dir, "history")
        
        # Command prompt styling
        self.style = Style.from_dict({
            "prompt": "ansigreen bold",
        })
        
        # Create prompt session
        self.session = PromptSession(
            history=FileHistory(history_file),
            auto_suggest=AutoSuggestFromHistory(),
            completer=SpaceMaquetteCompleter(),
            style=self.style,
        )
        
        # Initialize command handlers
        self.commands = {}
        self._init_commands()
    
    def _init_commands(self) -> None:
        """Initialize command handlers."""
        self.commands = {
            # System commands
            "help": self.cmd_help,
            "exit": self.cmd_exit,
            "quit": self.cmd_exit,
            "status": self.cmd_status,
            "ping": self.cmd_ping,
            "reset": self.cmd_reset,
            "estop": self.cmd_estop,
            "reset_estop": self.cmd_reset_estop,
            "connect": self.cmd_connect,
            "disconnect": self.cmd_disconnect,
            
            # Motion commands
            "home": self.cmd_home,
            "home_all": self.cmd_home_all,
            "home_x": lambda: self.cmd_home("X"),
            "home_y": lambda: self.cmd_home("Y"),
            "home_z": lambda: self.cmd_home("Z"),
            "move": self.cmd_move,
            "stop": self.cmd_stop,
            "velocity": self.cmd_velocity,
            "forward": self.cmd_forward,
            "backward": self.cmd_backward,
            "left": self.cmd_left,
            "right": self.cmd_right,
            
            # Camera commands
            "pan": self.cmd_pan,
            "tilt": self.cmd_tilt,
            "look_up": self.cmd_look_up,
            "look_down": self.cmd_look_down,
            "look_left": self.cmd_look_left,
            "look_right": self.cmd_look_right,
            
            # Rangefinder commands
            "measure": self.cmd_measure,
            "scan": self.cmd_scan,
            
            # Configuration commands
            "get": self.cmd_get,
            "set": self.cmd_set,
            "save_config": self.cmd_save_config,
            "load_config": self.cmd_load_config,
        }
    
    def start(self) -> None:
        """Start the CLI and enter the main loop."""
        self.console.print("[bold green]Space Maquette Controller CLI[/bold green]")
        self.console.print("Type [bold]help[/bold] for available commands, [bold]exit[/bold] to quit.")
        
        # Try to connect if port is specified
        if self.port:
            self.cmd_connect(self.port, str(self.baudrate))
        
        # Main command loop
        while True:
            try:
                command = self.session.prompt(
                    HTML("<prompt>maquette&gt;</prompt> "),
                )
                self.process_command(command)
            except KeyboardInterrupt:
                self.console.print("\nUse [bold]exit[/bold] to quit.")
                continue
            except EOFError:
                break
            except Exception as e:
                self.console.print(f"[bold red]Error:[/bold red] {e}")
                if logger.isEnabledFor(logging.DEBUG):
                    logger.exception("Exception in command processing")
        
        # Clean up on exit
        self.cleanup()
    
    def cleanup(self) -> None:
        """Clean up resources before exiting."""
        if self.controller:
            self.console.print("Disconnecting from controller...")
            self.controller.disconnect()
    
    def process_command(self, command_line: str) -> None:
        """
        Process a command line entered by the user.
        
        Args:
            command_line: Command line to process
        """
        # Skip empty commands
        command_line = command_line.strip()
        if not command_line:
            return
        
        # Split command and arguments
        parts = command_line.split()
        command = parts[0].lower()
        args = parts[1:]
        
        # Execute command if it exists
        if command in self.commands:
            try:
                # Pass arguments to the command function
                self.commands[command](*args)
            except TypeError as e:
                self.console.print(f"[bold red]Error:[/bold red] {e}")
                # Show command help
                self.show_command_help(command)
        else:
            self.console.print(f"[bold red]Unknown command:[/bold red] {command}")
            self.console.print("Type [bold]help[/bold] for available commands.")
    
    def ensure_controller(self) -> bool:
        """
        Ensure that a controller is connected.
        
        Returns:
            True if controller is connected, False otherwise
        """
        if not self.controller:
            self.console.print("[bold red]Error:[/bold red] Not connected to controller.")
            self.console.print("Use [bold]connect[/bold] to connect to the controller.")
            return False
        return True
    
    def get_command_help(self, command: str) -> str:
        """
        Get help text for a specific command.
        
        Args:
            command: Command to get help for
            
        Returns:
            Help text for the command
        """
        help_text = {
            "help": "Show help for all commands or a specific command",
            "exit": "Exit the CLI",
            "quit": "Exit the CLI",
            "status": "Show current system status",
            "ping": "Check if the controller is responsive",
            "reset": "Perform a soft reset of the system",
            "estop": "Activate emergency stop",
            "reset_estop": "Reset emergency stop if safe",
            "connect": "Connect to the controller (connect [port] [baudrate])",
            "disconnect": "Disconnect from the controller",
            "home": "Home the specified axis (home <axis>)",
            "home_all": "Home all axes",
            "home_x": "Home the X axis",
            "home_y": "Home the Y axis",
            "home_z": "Home the Z axis",
            "move": "Move to absolute position (move <x> <y> <z> [pan] [tilt])",
            "stop": "Stop all motion immediately",
            "velocity": "Set axis velocities (velocity <vx> <vy> <vz>)",
            "forward": "Move forward (Y+) (forward [distance])",
            "backward": "Move backward (Y-) (backward [distance])",
            "left": "Move left (X-) (left [distance])",
            "right": "Move right (X+) (right [distance])",
            "pan": "Set pan angle (pan <angle>)",
            "tilt": "Set tilt angle (tilt <angle>)",
            "look_up": "Look up (decrease tilt) (look_up [angle])",
            "look_down": "Look down (increase tilt) (look_down [angle])",
            "look_left": "Look left (decrease pan) (look_left [angle])",
            "look_right": "Look right (increase pan) (look_right [angle])",
            "measure": "Take a single distance measurement",
            "scan": "Scan an area (scan <x1> <y1> <x2> <y2> <step>)",
            "get": "Get configuration value (get <key>)",
            "set": "Set configuration value (set <key> <value>)",
            "save_config": "Save configuration to SD card",
            "load_config": "Load configuration from SD card",
        }
        
        return help_text.get(command, "")
    
    def show_command_help(self, command: str) -> None:
        """
        Show help for a specific command.
        
        Args:
            command: Command to show help for
        """
        help_text = self.get_command_help(command)
        
        if help_text:
            self.console.print(f"[bold]{command}:[/bold] {help_text}")
        else:
            self.console.print(f"No help available for command: {command}")
    
    # System command implementations
    
    def cmd_help(self, command: str = "") -> None:
        """Show help for all commands or a specific command."""
        if command:
            self.show_command_help(command)
            return
        
        # Group commands by category
        categories = {
            "System": ["help", "exit", "status", "ping", "reset", "estop", "reset_estop", 
                      "connect", "disconnect"],
            "Motion": ["home", "home_all", "move", "stop", "velocity", "forward", "backward", 
                      "left", "right"],
            "Camera": ["pan", "tilt", "look_up", "look_down", "look_left", "look_right"],
            "Rangefinder": ["measure", "scan"],
            "Configuration": ["get", "set", "save_config", "load_config"],
        }
        
        for category, cmds in categories.items():
            table = Table(title=f"{category} Commands")
            table.add_column("Command", style="green")
            table.add_column("Description", style="white")
            
            for cmd in cmds:
                help_text = self.get_command_help(cmd)
                if help_text:
                    table.add_row(cmd, help_text)
            
            self.console.print(table)
            self.console.print("")
    
    def cmd_exit(self) -> None:
        """Exit the CLI."""
        self.cleanup()
        self.console.print("Goodbye!")
        sys.exit(0)
    
    def cmd_status(self) -> None:
        """Show current system status."""
        if not self.ensure_controller():
            return
        
        status = self.controller.get_status()
        
        table = Table(title="System Status")
        table.add_column("Parameter", style="cyan")
        table.add_column("Value", style="green")
        
        table.add_row("X Position", f"{status.x:.2f} mm")
        table.add_row("Y Position", f"{status.y:.2f} mm")
        table.add_row("Z Position", f"{status.z:.2f} mm")
        table.add_row("Pan Angle", f"{status.pan:.2f}°")
        table.add_row("Tilt Angle", f"{status.tilt:.2f}°")
        table.add_row("E-Stop", "Activated" if status.estop else "Not activated")
        table.add_row("Moving", "Yes" if status.moving else "No")
        table.add_row("Homed", "Yes" if status.homed else "No")
        table.add_row("Last Update", time.strftime("%H:%M:%S", time.localtime(status.last_update)))
        
        self.console.print(table)
    
    def cmd_ping(self) -> None:
        """Check if the controller is responsive."""
        if not self.ensure_controller():
            return
        
        response = self.controller.protocol.ping()
        if response.status == CommandStatus.OK:
            self.console.print("[bold green]Controller is responsive![/bold green]")
        else:
            self.console.print(f"[bold red]Controller is not responding:[/bold red] {response.message}")
    
    def cmd_reset(self) -> None:
        """Perform a soft reset of the system."""
        if not self.ensure_controller():
            return
        
        response = self.controller.protocol.reset()
        if response.status == CommandStatus.OK:
            self.console.print("[bold green]System reset initiated.[/bold green]")
        else:
            self.console.print(f"[bold red]Reset failed:[/bold red] {response.message}")
    
    def cmd_estop(self) -> None:
        """Activate emergency stop."""
        if not self.ensure_controller():
            return
        
        if self.controller.emergency_stop():
            self.console.print("[bold red]EMERGENCY STOP ACTIVATED[/bold red]")
        else:
            self.console.print("[bold red]Failed to activate emergency stop[/bold red]")
    
    def cmd_reset_estop(self) -> None:
        """Reset emergency stop if safe."""
        if not self.ensure_controller():
            return
        
        if self.controller.reset_emergency_stop():
            self.console.print("[bold green]Emergency stop reset successfully[/bold green]")
        else:
            self.console.print("[bold red]Failed to reset emergency stop[/bold red]")
    
    def cmd_connect(self, port: str = "", baudrate: str = "115200") -> None:
        """Connect to the controller."""
        # Clean up any existing controller
        if self.controller:
            self.controller.disconnect()
        
        # Use specified port or saved port
        port = port or self.port
        
        if not port:
            self.console.print("[bold red]Error:[/bold red] Port not specified")
            self.console.print("Usage: connect <port> [baudrate]")
            return
        
        # Convert baudrate to int
        try:
            baudrate_int = int(baudrate)
        except ValueError:
            self.console.print(f"[bold red]Invalid baudrate:[/bold red] {baudrate}")
            return
        
        # Create controller
        from space_maquette.controller import SpaceMaquetteController
        
        self.controller = SpaceMaquetteController(
            port=port,
            baudrate=baudrate_int,
            config_file=self.config_file,
            use_checksum=self.use_checksum
        )
        
        # Connect to controller
        self.console.print(f"Connecting to {port} at {baudrate_int} baud...")
        if self.controller.connect():
            self.console.print("[bold green]Connected successfully![/bold green]")
            self.controller.start_status_updates()
        else:
            self.console.print("[bold red]Failed to connect to controller[/bold red]")
            self.controller = None
    
    def cmd_disconnect(self) -> None:
        """Disconnect from the controller."""
        if not self.ensure_controller():
            return
        
        self.controller.disconnect()
        self.console.print("[bold green]Disconnected from controller[/bold green]")
        self.controller = None
    
    # Motion commands
    
    def cmd_home(self, axis: str = "") -> None:
        """Home the specified axis."""
        if not self.ensure_controller():
            return
        
        if not axis:
            self.console.print("[bold red]Error:[/bold red] Axis not specified")
            self.show_command_help("home")
            return
        
        axis = axis.upper()
        if axis not in ["X", "Y", "Z", "ALL"]:
            self.console.print(f"[bold red]Invalid axis:[/bold red] {axis}")
            return
        
        if self.controller.home_axis(axis):
            self.console.print(f"[bold green]Homing {axis} axis started[/bold green]")
        else:
            self.console.print(f"[bold red]Failed to home {axis} axis[/bold red]")
    
    def cmd_home_all(self) -> None:
        """Home all axes."""
        if not self.ensure_controller():
            return
        
        if self.controller.home_all():
            self.console.print("[bold green]Homing all axes started[/bold green]")
        else:
            self.console.print("[bold red]Failed to home all axes[/bold red]")
    
    def cmd_move(self, x: str = "", y: str = "", z: str = "", pan: str = "", tilt: str = "") -> None:
        """Move to absolute position."""
        if not self.ensure_controller():
            return
        
        if not x or not y or not z:
            self.console.print("[bold red]Error:[/bold red] Position not specified")
            self.show_command_help("move")
            return
        
        try:
            x_val = float(x)
            y_val = float(y)
            z_val = float(z)
            pan_val = float(pan) if pan else None
            tilt_val = float(tilt) if tilt else None
            
            if self.controller.move_to(x_val, y_val, z_val, pan_val, tilt_val):
                self.console.print("[bold green]Move started[/bold green]")
            else:
                self.console.print("[bold red]Failed to start move[/bold red]")
        except ValueError:
            self.console.print("[bold red]Error:[/bold red] Invalid position values")
    
    def cmd_stop(self) -> None:
        """Stop all motion immediately."""
        if not self.ensure_controller():
            return
        
        if self.controller.stop():
            self.console.print("[bold green]Motion stopped[/bold green]")
        else:
            self.console.print("[bold red]Failed to stop motion[/bold red]")
    
    def cmd_velocity(self, vx: str = "", vy: str = "", vz: str = "") -> None:
        """Set axis velocities."""
        if not self.ensure_controller():
            return
        
        if not vx or not vy or not vz:
            self.console.print("[bold red]Error:[/bold red] Velocity not specified")
            self.show_command_help("velocity")
            return
        
        try:
            vx_val = float(vx)
            vy_val = float(vy)
            vz_val = float(vz)
            
            if self.controller.set_velocity(vx_val, vy_val, vz_val):
                self.console.print("[bold green]Velocity set[/bold green]")
            else:
                self.console.print("[bold red]Failed to set velocity[/bold red]")
        except ValueError:
            self.console.print("[bold red]Error:[/bold red] Invalid velocity values")
    
    def cmd_forward(self, distance: str = "10.0") -> None:
        """Move forward (positive Y)."""
        if not self.ensure_controller():
            return
        
        try:
            dist = float(distance)
            if self.controller.move_forward(dist):
                self.console.print(f"[bold green]Moving forward {dist} mm[/bold green]")
            else:
                self.console.print("[bold red]Failed to move forward[/bold red]")
        except ValueError:
            self.console.print("[bold red]Error:[/bold red] Invalid distance value")
    
    def cmd_backward(self, distance: str = "10.0") -> None:
        """Move backward (negative Y)."""
        if not self.ensure_controller():
            return
        
        try:
            dist = float(distance)
            if self.controller.move_backward(dist):
                self.console.print(f"[bold green]Moving backward {dist} mm[/bold green]")
            else:
                self.console.print("[bold red]Failed to move backward[/bold red]")
        except ValueError:
            self.console.print("[bold red]Error:[/bold red] Invalid distance value")
    
    def cmd_left(self, distance: str = "10.0") -> None:
        """Move left (negative X)."""
        if not self.ensure_controller():
            return
        
        try:
            dist = float(distance)
            if self.controller.move_left(dist):
                self.console.print(f"[bold green]Moving left {dist} mm[/bold green]")
            else:
                self.console.print("[bold red]Failed to move left[/bold red]")
        except ValueError:
            self.console.print("[bold red]Error:[/bold red] Invalid distance value")
    
    def cmd_right(self, distance: str = "10.0") -> None:
        """Move right (positive X)."""
        if not self.ensure_controller():
            return
        
        try:
            dist = float(distance)
            if self.controller.move_right(dist):
                self.console.print(f"[bold green]Moving right {dist} mm[/bold green]")
            else:
                self.console.print("[bold red]Failed to move right[/bold red]")
        except ValueError:
            self.console.print("[bold red]Error:[/bold red] Invalid distance value")
    
    # Camera commands
    
    def cmd_pan(self, angle: str = "") -> None:
        """Set pan angle."""
        if not self.ensure_controller():
            return
        
        if not angle:
            self.console.print("[bold red]Error:[/bold red] Angle not specified")
            self.show_command_help("pan")
            return
        
        try:
            angle_val = float(angle)
            if self.controller.set_pan(angle_val):
                self.console.print(f"[bold green]Pan angle set to {angle_val}°[/bold green]")
            else:
                self.console.print("[bold red]Failed to set pan angle[/bold red]")
        except ValueError:
            self.console.print("[bold red]Error:[/bold red] Invalid angle value")
    
    def cmd_tilt(self, angle: str = "") -> None:
        """Set tilt angle."""
        if not self.ensure_controller():
            return
        
        if not angle:
            self.console.print("[bold red]Error:[/bold red] Angle not specified")
            self.show_command_help("tilt")
            return
        
        try:
            angle_val = float(angle)
            if self.controller.set_tilt(angle_val):
                self.console.print(f"[bold green]Tilt angle set to {angle_val}°[/bold green]")
            else:
                self.console.print("[bold red]Failed to set tilt angle[/bold red]")
        except ValueError:
            self.console.print("[bold red]Error:[/bold red] Invalid angle value")
    
    def cmd_look_up(self, angle: str = "5.0") -> None:
        """Look up (decrease tilt angle)."""
        if not self.ensure_controller():
            return
        
        try:
            angle_val = float(angle)
            if self.controller.look_up(angle_val):
                self.console.print(f"[bold green]Looking up {angle_val}°[/bold green]")
            else:
                self.console.print("[bold red]Failed to look up[/bold red]")
        except ValueError:
            self.console.print("[bold red]Error:[/bold red] Invalid angle value")
    
    def cmd_look_down(self, angle: str = "5.0") -> None:
        """Look down (increase tilt angle)."""
        if not self.ensure_controller():
            return
        
        try:
            angle_val = float(angle)
            if self.controller.look_down(angle_val):
                self.console.print(f"[bold green]Looking down {angle_val}°[/bold green]")
            else:
                self.console.print("[bold red]Failed to look down[/bold red]")
        except ValueError:
            self.console.print("[bold red]Error:[/bold red] Invalid angle value")
    
    def cmd_look_left(self, angle: str = "5.0") -> None:
        """Look left (decrease pan angle)."""
        if not self.ensure_controller():
            return
        
        try:
            angle_val = float(angle)
            if self.controller.look_left(angle_val):
                self.console.print(f"[bold green]Looking left {angle_val}°[/bold green]")
            else:
                self.console.print("[bold red]Failed to look left[/bold red]")
        except ValueError:
            self.console.print("[bold red]Error:[/bold red] Invalid angle value")
    
    def cmd_look_right(self, angle: str = "5.0") -> None:
        """Look right (increase pan angle)."""
        if not self.ensure_controller():
            return
        
        try:
            angle_val = float(angle)
            if self.controller.look_right(angle_val):
                self.console.print(f"[bold green]Looking right {angle_val}°[/bold green]")
            else:
                self.console.print("[bold red]Failed to look right[/bold red]")
        except ValueError:
            self.console.print("[bold red]Error:[/bold red] Invalid angle value")
    
    # Rangefinder commands
    
    def cmd_measure(self) -> None:
        """Take a single distance measurement."""
        if not self.ensure_controller():
            return
        
        result = self.controller.take_measurement()
        if result is not None:
            self.console.print(f"[bold green]Distance: {result:.3f} m[/bold green]")
        else:
            self.console.print("[bold red]Failed to take measurement[/bold red]")
    
    def cmd_scan(self, x1: str = "", y1: str = "", x2: str = "", y2: str = "", step: str = "") -> None:
        """Scan an area."""
        if not self.ensure_controller():
            return
        
        if not x1 or not y1 or not x2 or not y2 or not step:
            self.console.print("[bold red]Error:[/bold red] Scan parameters not specified")
            self.show_command_help("scan")
            return
        
        try:
            x1_val = float(x1)
            y1_val = float(y1)
            x2_val = float(x2)
            y2_val = float(y2)
            step_val = float(step)
            
            if self.controller.start_scan(x1_val, y1_val, x2_val, y2_val, step_val):
                self.console.print("[bold green]Scan started[/bold green]")
            else:
                self.console.print("[bold red]Failed to start scan[/bold red]")
        except ValueError:
            self.console.print("[bold red]Error:[/bold red] Invalid scan parameters")
    
    # Configuration commands
    
    def cmd_get(self, key: str = "") -> None:
        """Get configuration value."""
        if not self.ensure_controller():
            return
        
        if not key:
            self.console.print("[bold red]Error:[/bold red] Key not specified")
            self.show_command_help("get")
            return
        
        value = self.controller.get_config_value(key)
        if value:
            self.console.print(f"[bold]{key}[/bold] = {value}")
        else:
            self.console.print(f"[bold red]Key not found:[/bold red] {key}")
    
    def cmd_set(self, key: str = "", value: str = "") -> None:
        """Set configuration value."""
        if not self.ensure_controller():
            return
        
        if not