# Space Maquette Frontend and Server - Setup and Testing Guide

This guide provides detailed instructions for setting up, running, and testing the Space Maquette frontend and server applications.

## Prerequisites

- Node.js (v16.0.0 or higher)
- npm (v7.0.0 or higher)
- Git (for cloning the repository)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd space-maquette-frontend
```

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd space-maquette-ui

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend application will be available at http://localhost:3000

### 3. Server Setup

```bash
# Navigate to the server directory
cd ../space-maquette-server

# Install dependencies
npm install

# Start the server
npm start
```

The server will be running at http://localhost:3001

## Testing

### Frontend Testing

#### Manual Testing Checklist

1. **Core UI Components**
   - [ ] Verify the header displays correctly with emergency stop button
   - [ ] Check that the sidebar navigation works properly
   - [ ] Confirm the theme and styling are applied correctly

2. **Curator Mode**
   - [ ] Test camera preview window and fullscreen functionality
   - [ ] Verify show metadata dialog opens and saves data
   - [ ] Test backdrop configuration options
   - [ ] Check map preview with layer toggles
   - [ ] Test drawing tools for no-go regions
   - [ ] Verify scan region selection and confirmation
   - [ ] Test scan progress monitoring with pause/resume/cancel
   - [ ] Check motion controls for all axes
   - [ ] Test keyboard and mouse control mode

3. **Debug Mode**
   - [ ] Verify terminal output displays command history
   - [ ] Test system commands (PING, RESET, STATUS, etc.)
   - [ ] Check motion commands (HOME, MOVE, STOP, etc.)
   - [ ] Test rangefinder commands (MEASURE, SCAN)
   - [ ] Verify servo commands (TILT, PAN)
   - [ ] Test configuration commands (GET, SET, etc.)

### Server Testing

#### API Endpoints Testing

Use a tool like Postman or curl to test the following endpoints:

1. **Show Metadata**
   - GET /api/metadata
   - POST /api/metadata

2. **Backdrop Settings**
   - GET /api/backdrop
   - POST /api/backdrop

3. **No-Go Regions**
   - GET /api/nogo-regions
   - POST /api/nogo-regions
   - DELETE /api/nogo-regions/:id

4. **Scan Regions**
   - GET /api/scan-regions
   - POST /api/scan-regions
   - PATCH /api/scan-regions/:id/status

5. **Height Map**
   - GET /api/height-map
   - POST /api/height-map

6. **Configuration**
   - GET /api/config
   - POST /api/config/:key

7. **System Status**
   - GET /api/status

#### WebSocket Testing

1. Open the browser console while running the frontend application
2. Verify that WebSocket connection is established
3. Test command sending and response receiving
4. Verify real-time updates when system status changes

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - If port 3000 or 3001 is already in use, you can change the port:
     - For frontend: Edit the `.env` file and set `PORT=3002`
     - For server: Edit the `src/index.js` file and change `const PORT = process.env.PORT || 3001;`

2. **Database Issues**
   - If you encounter database errors, try deleting the `space-maquette-server/data/space-maquette.db` file and restart the server

3. **WebSocket Connection Failures**
   - Ensure both frontend and server are running
   - Check browser console for CORS errors
   - Verify that the WebSocket URL in the frontend matches the server address

## Production Deployment

For production deployment, follow these additional steps:

### Frontend

```bash
# Build the frontend
cd space-maquette-ui
npm run build

# The build folder can be served using any static file server
```

### Server

```bash
# Set environment variables for production
export NODE_ENV=production

# Start the server
cd space-maquette-server
npm start
```

Consider using a process manager like PM2 for production deployment:

```bash
npm install -g pm2
pm2 start src/index.js --name space-maquette-server
```

## Integration with ClearCore

To integrate with the actual ClearCore controller:

1. Update the server's command processing functions in `src/index.js`
2. Replace mock responses with actual ClearCore communication
3. Implement proper error handling for hardware communication
4. Update the WebSocket event handlers to work with the real hardware responses

## Performance Optimization

If you encounter performance issues:

1. For the frontend:
   - Consider implementing virtualization for large lists
   - Optimize canvas rendering in the MapPreview component
   - Use React.memo and useMemo for expensive computations

2. For the server:
   - Implement database query optimization
   - Consider caching frequently accessed data
   - Use connection pooling for database access
