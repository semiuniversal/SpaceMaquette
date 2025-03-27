// index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database initialization
const dbDir = path.join(__dirname, 'data');
const dbPath = path.join(dbDir, 'space-maquette.db');

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Import database setup
const { setupDatabase } = require('./database/setup');

// Always run setup - it should be modified to check for existing tables
setupDatabase();

// Setup API routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Register socket event handlers
const registerSocketHandlers = require('./socketHandlers');
registerSocketHandlers(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
