// video-stream.js
const NodeWebcam = require('node-webcam');
const ss = require('socket.io-stream');
const fs = require('fs');
const path = require('path');

// Store available cameras
const availableCameras = [];

// Configure webcam options
const webcamOptions = {
  width: 640,
  height: 480,
  quality: 75,
  frames: 10,
  delay: 0,
  saveShots: true,
  output: 'jpeg',
  device: false,
  callbackReturn: 'buffer',
  verbose: false,
};

// Create webcam instance
const Webcam = NodeWebcam.create(webcamOptions);

// Detect available cameras
function detectCameras() {
  return new Promise((resolve) => {
    NodeWebcam.list((list) => {
      console.log('Detected cameras:', list);
      availableCameras.length = 0;
      list.forEach((device, index) => {
        availableCameras.push({
          id: index,
          name: device,
          url: `/stream/${index}`,
        });
      });
      resolve(availableCameras);
    });
  });
}

// Initialize streaming
function initializeStreaming(io) {
  detectCameras().then(() => {
    console.log('Camera detection complete. Found:', availableCameras.length);
  });

  // Handle camera streaming
  io.on('connection', (socket) => {
    // Send available cameras on request
    socket.on('getCameras', (callback) => {
      console.log('Sending available cameras:', availableCameras);
      callback(availableCameras);
    });

    // Start streaming a camera
    socket.on('startStream', (cameraId) => {
      if (cameraId >= 0 && cameraId < availableCameras.length) {
        console.log(`Starting stream for camera ${cameraId}`);

        // Set active camera
        webcamOptions.device = availableCameras[cameraId].name;

        // Stream at 10 FPS
        const streamInterval = setInterval(() => {
          Webcam.capture('stream', (err, data) => {
            if (err) {
              console.error('Webcam capture error:', err);
              return;
            }

            // Send frame to client
            socket.emit('videoFrame', {
              buffer: data.toString('base64'),
              cameraId: cameraId,
            });
          });
        }, 100);

        // Store interval reference for cleanup
        socket.streamInterval = streamInterval;
      } else {
        console.error('Invalid camera ID:', cameraId);
      }
    });

    // Stop streaming
    socket.on('stopStream', () => {
      if (socket.streamInterval) {
        clearInterval(socket.streamInterval);
        socket.streamInterval = null;
        console.log('Stream stopped');
      }
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
      if (socket.streamInterval) {
        clearInterval(socket.streamInterval);
        socket.streamInterval = null;
        console.log('Stream stopped due to disconnect');
      }
    });
  });
}

module.exports = {
  initializeStreaming,
  detectCameras,
  availableCameras,
};
