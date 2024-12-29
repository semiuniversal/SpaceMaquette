# Maquette Space

## Overall System Capabilities for Miniature Art and Landscape VR Capture System

### Overview

The system (code named Maquette Space) captures detailed panoramas and live video of miniature artworks and landscapes within a 2-meter square by 1-meter high volume. It employs a Cartesian positioning system with pan and tilt capabilities. The camera simulates scaled eye-level views without zoom. Users will explore the environment through a web interface, transitioning between densely spaced panoramas or live video seamlessly.

---

### Core Functionalities

#### Panorama Capture and Viewing

1. Grid Specifications:
   - Panoramas are captured at a 1 cm grid spacing in the XY plane.
   - One panorama per grid point at simulated eye level in Z, eliminating the Z dimension.

2. Low-Resolution Loading While Moving:
   - Users initially view low-res panoramas (~512 x 256 or 1K x 512).
   - Higher-resolution panoramas (~2K or 4K) load when the user stops moving.
   - Goal: Load at least 10 low-res panoramas per second.

3. Optimized Navigation:
   - User's heading, pan, and tilt are maintained across panorama transitions.
   - Crossfade transitions will be added between low-res panoramas shown while moving and the high-res versions displayed when at rest.

4. Dynamic Z Adjustment:
   - Users automatically adjust in the Z direction based on the height map as they move.
   - Certain areas will require users to find navigable paths up inclines. Precomputed paths may assist in navigation.

5. Real-Time WASD Controls:
   - Users control the camera's X and Y movement using WASD keys, as in a video game.
   - Pan and tilt are controlled via mouse movements, with pan governing the heading.

6. Collision Avoidance:
   - A low-resolution 3D model or height map of the subject is generated to prevent collisions with delicate physical objects.

7. Live Video Functionality:
   - During active "shows," the system streams live video from the probe-mounted camera.
   - Users navigate the live video feed using the same interface as the panoramas.

---

### Model Environment and Backdrop

1. Backdrop Design:
   - Fully enclosed square "infinity wall" cyclorama with 1-foot radius rounded corners.
   - Constructed from custom 3D-printed plastic corner mounts and 1mm Sintra panels, adhered with 3M VHB Heavy Duty Mounting Tape 5952.
   - Coated in chroma-key green paint.

2. Model Installation:
   - Centered square build plate, slightly raised and replaceable for installing models.

3. Access:
   - The chamber is accessible through the bottom, with approximately 1 meter of clearance beneath the active area for installation and maintenance.

---

### Parallel Subsystems

#### Real-Time 3D Viewing Subsystem
   - This subsystem will handle rendering and synchronization of the virtual backdrop model shown via chroma key.
   - Capabilities:
     - Load, save, and manage custom models tailored to specific content.
     - Ensure real-time synchronization between the camera’s motion and the 3D virtual environment.
   - Potential Tools:
     - Unity: Interactive, API-driven, and capable of real-time rendering.
     - Three.js: Lightweight and browser-based for simpler implementations.

#### Real-Time Video Processing Subsystem
   - Handles effect compositing for chroma key replacement.
   - Feeds both the panorama creation engine and a real-time video stream.
   - Preferred implementation as a software-based solution to avoid recapturing HDMI video.


## Software Considerations for Miniature Art and Landscape VR Capture System

### Technical Specifications

#### File and Compression Standards

1. Panorama Resolutions:
   - Low-res: ~512 x 256 (~50 KB each).
   - High-res: ~4K (~300 KB each using WEBP or AVIF).

2. Storage:
   - Total panoramas: 40,000 (for 200 x 200 XY grid).
   - Estimated total storage: ~16 GB (low-res) + ~120 GB (high-res).

3. Frontend Technologies:
   - Pannellum/Marzipano: Lightweight web-based panorama viewers.
   - Three.js/A-Frame: For interactive web rendering of panoramas and 3D models.

4. Backend Optimization:
   - Use a content delivery network (CDN) for fast panorama delivery.
   - Implement a JSON-based database to store panorama metadata (e.g., grid coordinates, orientation).
   - Preloading and caching for adjacent panoramas to minimize load times.

---

### API and CLI Requirements

1. API:
   - The system will include an API for integration with other software, such as offline video processing or other systems.

2. Command-Line Interface (CLI):
   - A command-line interface will be implemented for unit testing and control via CI/CD tools.

---

### Parallel Subsystems

#### Real-Time 3D Viewing Subsystem

1. Functionality:
   - This subsystem will handle rendering and synchronization of the virtual backdrop model shown via chroma key.

2. Capabilities:
   - Load, save, and manage custom models tailored to specific content.
   - Ensure real-time synchronization between the camera’s motion and the 3D virtual environment.

3. Potential Tools:
   - Unity: Interactive, API-driven, and capable of real-time rendering.
   - Three.js: Lightweight and browser-based for simpler implementations.

#### Real-Time Video Processing Subsystem

1. Functionality:
   - Handles effect compositing for chroma key replacement.
   - Feeds both the panorama creation engine and a real-time video stream.

2. Preferred Implementation:
   - Software-based solution to avoid recapturing HDMI video.

3. Potential Tools:
   - OBS Studio: Extensible and capable of real-time chroma keying.
   - FFmpeg: Lightweight, scriptable, and flexible for automated processing.
   - TouchDesigner: For visually rich and dynamic effects.


## Hardware Details for Miniature Art and Landscape VR Capture System

### Frame and Motion Components

1. Frame Construction:
   - The frame will be constructed from aluminum V-frame channels (40 mm on a side) and will be disassemblable for shipping.

2. Motion Platform:
   - The system will use a gantry-style motion platform similar to a 3D printer or CNC router.
   - X and Y axes will move on carriages; the Z axis will have a travel range of about 500 mm.

3. Linear Motion Components:
   - Belt-actuated Fuyumotion FP50s adapted for use with ClearPath motors.

4. Rotary Actuator:
   - A stepper-driven hollow rotary actuator with a 10:1 reduction ratio and a zeroing flag.
   - Moved by a Stepperonline Dual Shaft CNC Stepper Motor (3.1Nm/439 oz.in) and a Stepperonline Digital Stepper Motor Driver DM860T (compatible with the Teknic IPD power supply).

5. Power Supply:
   - Teknic IPD motor power supply operating at ~70V VDC.

6. Motors and Controllers:
   - High-precision ClearPath SK class servo motors in NEMA 23 for X, Y, and Z axes.
   - Controlled by a Teknic ClearCore, programmable in C++ with optional Arduino wrapper libraries.
   - Tilt servo may use the ClearCore or a dedicated controller such as Arduino or Raspberry Pi.

7. Limit Switches:
   - Included for positional control.

---

### Camera Probe

1. Camera:
   - Sony IMX258 mounted on a long, slender probe mechanism.
   - Housed in a custom 3D-printed shell (10 mm per side) to fit into narrow spaces.

2. Tilt and Pan:
   - Tilt: Controlled by a micro digital RC servo and extended pushrod system.
   - Pan: Achieved with 360-degree rotation using the rotary actuator and a slip ring assembly for infinite rotation.

3. Electrical Connections:
   - Includes USB and servo connections for tilt motor.
   - A small MIPI-to-USB converter will be housed inside the probe.

---

### Model Environment and Backdrop

1. Backdrop Design:
   - Fully enclosed square "infinity wall" cyclorama with 1-foot radius rounded corners.
   - Constructed from custom 3D-printed plastic corner mounts and 1mm Sintra panels, adhered with 3M VHB Heavy Duty Mounting Tape 5952.
   - Coated in chroma-key green paint.

2. Model Installation:
   - Centered square build plate, slightly raised and replaceable for installing models.

3. Access:
   - The chamber is accessible through the bottom, with approximately 1 meter of clearance beneath the active area for installation and maintenance.

