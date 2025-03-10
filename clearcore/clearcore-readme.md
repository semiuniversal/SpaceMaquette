# ClearCore Development with PlatformIO

This repository contains code for the Teknic ClearCore controller. The ClearCore functions as a subcomponent in our larger project, handling motion control and I/O operations.

## Prerequisites

- **Hardware**:
  - [Teknic ClearCore Controller](https://www.teknic.com/products/io-motion-controller/)
  - [ATATMEL-ICE-BASIC](https://teknic.com/ATATMEL-ICE-BASIC/) - get the entire kit including TC2030-CTX-LEMTA JTAG cable. This comes with a USB cable for the ICE and another cable for standard pin headers (we won't use that). 
  - Useful but not required: Print out this [handy tool](https://grabcad.com/library/tag-connect-tc2030-pliers-1) on your 3d printer. The TC2030 cable is very hard to insert into the ClearCore board. This will help compress the clips. Thanks for the great idea [Craig Hollabaugh](https://www.youtube.com/@CraigHollabaugh). 
  - USB B to A cable (for communication with the ClearCore)
  - Appropriate connections to your motors/sensors/actuators

- **Software**:
  - [Visual Studio Code](https://code.visualstudio.com/)
  - [PlatformIO Extension for VS Code](https://platformio.org/install/ide?install=vscode)

## Setup Instructions

### 1. Install Required Software

1. Download and install Visual Studio Code from the [official website](https://code.visualstudio.com/).
2. Open VS Code and install the PlatformIO extension:
   - Click on the Extensions icon in the sidebar (or press `Ctrl+Shift+X`)
   - Search for "PlatformIO"
   - Click "Install" on the "PlatformIO IDE" extension

### 2. Create a New ClearCore Project

1. Open VS Code with PlatformIO installed
2. Click the PlatformIO icon in the sidebar
3. Click "New Project" or select "PlatformIO: New Project" from the command palette (`Ctrl+Shift+P`)
4. Enter a project name
5. For "Board", you won't find ClearCore in the default list. Just select any SAMD board temporarily.
6. Select "Arduino" as the framework
7. Click "Finish"

### 3. Configure for ClearCore

1. Open the `platformio.ini` file in your project
2. Replace its contents with the following:

```ini
[env:clearcore]
platform = https://github.com/patrickwasp/platform-atmelsam
board = clearcore
framework = arduino

; Debugging configuration for Atmel-ICE
debug_tool = atmel-ice
debug_init_break = tbreak setup
upload_protocol = atmel-ice
```

3. Save the file
4. VS Code may prompt to install the required packages. Click "Yes" if prompted.
5. Alternatively, run "PlatformIO: Update Project Configuration" from the command palette

### 4. Connect Hardware

1. Remove the Clearcore front casing. 
2. Insert the TC2030 cable into the JTAG connector holes (using the handy tool above if you made one). 
3. Connect the TC2030 to the SAM port of the Atmel ICE. DO NOT use the AVR port. 
4. Connect the Atmel-ICE debugger to your computer via USB. This should automatically install drivers on Windows - please see Atmel's instructions for other platforms. 
 5. Connect the ClearCore to your computer via USB for serial communication.
 6. Connect the ClearCore to a rated 24 VDC power supply. 

### 5. Create a Basic Test Program

Create a simple test program in `src/main.cpp`:

```cpp
#include <Arduino.h>
#include "ClearCore.h"

// Global count variable
unsigned long count = 0;

void setup() {
    // Initialize serial communication
    Serial.begin(115200);

    // Wait for serial port to connect (for native USB)
    while (!Serial) {
        delay(10);
    }

    Serial.println("ClearCore initialization successful!");

    // Set up LED pin
    ConnectorLed.Mode(Connector::OUTPUT_DIGITAL);
}

void loop() {
    // Blink the on-board LED
    ConnectorLed.State(true);
    delay(500);
    ConnectorLed.State(false);
    delay(500);

    // Print the running message along with the count
    if (count == 0) {
        Serial.println("ClearCore is running.");
    } else {
        Serial.print("ClearCore is running... I've told you this ");
        Serial.print(count);
        Serial.println(" times already!");
    }
    // Increment count each loop iteration
    count++;
}
```

### 6. Building and Uploading

1. To build the project:
   - Click the "Build" button (checkmark icon) in the PlatformIO toolbar at the bottom of VS Code
   - Or run "PlatformIO: Build" from the PlatformIO (ant head) command palette
   - Or use the keyboard shortcut `Ctrl+Alt+B`

2. To upload to the ClearCore:
   - Click the "Upload" button (right arrow icon) in the PlatformIO toolbar
   - Or run "PlatformIO: Upload" from the command palette
   - Or use the keyboard shortcut `Ctrl+Alt+U`

3. The program should upload via the Atmel-ICE and start running on your ClearCore
4. The serial monitor should open automatically, showing the "ClearCore is running." message. It will become annoying quickly and make you desperately want to replace it with something better. 

### 7. Debugging

1. Set breakpoints by clicking in the gutter (to the left of line numbers) in your code
2. Start a debugging session:
   - Go to the "Run and Debug" view (bug icon in the sidebar)
   - Select "PIO Debug" from the dropdown at the top
   - Click the green play button
   - Or use the keyboard shortcut `F5`
   - Or run "PlatformIO: Start Debugging" from the command palette

3. Use the debugging controls to step through your code, inspect variables, etc.

## Using ClearCore-Specific Features

The ClearCore provides several specialized connectors and features:

- Digital I/O: `ConnectorIO0`, `ConnectorIO1`, etc.
- Motor control: `ConnectorM0`, `ConnectorM1`, etc.
- Analog inputs: Various connectors with analog capabilities
- EtherNet/IP support
- 2 versatile serial ports that can be configured as RS232 or RS485, or direct UART modes for TTL devices. These ports supply power as well, please carefully read the Teknic hardware guide.

For detailed information on using these features, refer to the [Teknic ClearCore Documentation](https://teknic.com/files/downloads/ClearCore_User_Manual.pdf).

## Troubleshooting

- **Upload Fails**: Ensure the Atmel-ICE is properly connected and recognized by your computer
- **Debug Session Won't Start**: Check that the debug configuration in platformio.ini is correct
- **Missing Headers**: The patrickwasp fork should include all necessary headers; if not, check for updates to the fork
- **Other Issues**: Refer to the [PlatformIO Community](https://community.platformio.org/) or [Teknic Support](https://teknic.com/support/)

## Additional Resources

- [Teknic ClearCore Documentation](https://teknic.com/files/downloads/ClearCore_User_Manual.pdf)
- [ClearCore GitHub Repository](https://github.com/Teknic-Inc/ClearCore-library)
- [PlatformIO Documentation](https://docs.platformio.org/)
