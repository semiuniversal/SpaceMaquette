# Space Maquette Frontend and Server

This project consists of a React frontend and Node.js server application for the Space Maquette project, which provides an interface for fine-tuning and debugging motion control and scan mapping.

## Project Structure

- `space-maquette-ui/` - React frontend application
- `space-maquette-server/` - Node.js server application

## Frontend Features

### Curator Mode
- Camera preview window
- Show metadata management
- Backdrop configuration
- Map preview with drawing tools for no-go regions
- Scan region selection and monitoring
- Motion controls with keyboard and mouse support

### Debug Mode
- Terminal output for ClearCore communication
- System commands interface
- Motion commands interface
- Rangefinder commands interface
- Servo commands interface
- Configuration commands interface

## Server Features

- RESTful API for frontend data
- WebSocket communication for real-time updates
- SQLite database for persistence
- Mock ClearCore command processing

## Getting Started

### Frontend

```bash
cd space-maquette-ui
npm install
npm start
```

### Server

```bash
cd space-maquette-server
npm install
npm start
```

## Technologies Used

- React with TypeScript
- Material UI
- Socket.io for real-time communication
- Express.js for the server
- SQLite for database
