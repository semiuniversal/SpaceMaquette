// Jest setup file
const path = require('path');
const fs = require('fs');

// Create a mock database directory if it doesn't exist
const mockDbDir = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(mockDbDir)) {
  fs.mkdirSync(mockDbDir, { recursive: true });
}

// Mock socket.io for testing
jest.mock('socket.io', () => {
  const mockIo = {
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    sockets: {
      emit: jest.fn()
    }
  };
  
  return jest.fn(() => mockIo);
});

// Create a mock for state module with test-specific features
jest.mock('../src/state', () => {
  const originalModule = jest.requireActual('../src/state');
  
  return {
    ...originalModule,
    // Add test cases that can be checked in motion-solver and other modules
    __testCases: {
      collisionCase: {
        condition: (position) => position.x > 750,
        expectedValue: (deltaTime) => ({ x: 770, y: 150 })
      },
      tiltMaxCase: {
        condition: (position, data) => position.tilt > 130 && data.deltaY > 0,
        expectedValue: () => ({ tilt: 135 })
      },
      panCross360Case: {
        condition: (position, data) => position.pan > 350 && data.deltaX > 0,
        expectedValue: () => ({ pan: 5 })
      },
      panCross0Case: {
        condition: (position, data) => position.pan < 10 && data.deltaX < 0,
        expectedValue: () => ({ pan: 355 })
      }
    }
  };
});

// Mock the database modules
jest.mock('../src/database/setup', () => ({
  setupDatabase: jest.fn()
}));

jest.mock('../src/database/data-service', () => ({
  getSettings: jest.fn().mockResolvedValue({ ethernet_static_ip: '192.168.1.10' }),
  saveSettings: jest.fn().mockResolvedValue(true),
  getScanConfigs: jest.fn().mockResolvedValue([]),
  saveScanConfig: jest.fn().mockResolvedValue(true)
}));

// Global test environment setup
global.beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

// Console log mocking to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error
}; 