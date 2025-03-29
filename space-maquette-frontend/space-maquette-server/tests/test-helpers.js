// Common test helper functions and mocks
const { systemState } = require('../src/state');

/**
 * Creates a mock socket.io instance for testing
 * @returns {Object} Object containing io, socket, and socketHandlers
 */
const createMockSocketIo = () => {
  const socketHandlers = {};
  const socket = {
    id: 'test-socket-id',
    on: jest.fn((event, handler) => {
      socketHandlers[event] = handler;
    }),
    emit: jest.fn()
  };
  
  const io = {
    on: jest.fn((event, handler) => {
      if (event === 'connection') {
        handler(socket);
      }
    }),
    emit: jest.fn(),
    sockets: {
      emit: jest.fn()
    }
  };
  
  return { io, socket, socketHandlers };
};

/**
 * Saves the current system state and returns a function to restore it
 * @returns {Function} Function to restore the original state
 */
const saveAndRestoreState = () => {
  const originalState = JSON.parse(JSON.stringify(systemState));
  
  return () => {
    Object.keys(originalState).forEach(key => {
      systemState[key] = originalState[key];
    });
  };
};

/**
 * Creates a mock response function that captures response data
 * @returns {Object} Object with response function and captured data
 */
const createMockResponse = () => {
  const captured = {
    status: null,
    json: null,
    headers: {},
    ended: false
  };
  
  const res = {
    status: jest.fn(code => {
      captured.status = code;
      return res;
    }),
    json: jest.fn(data => {
      captured.json = data;
      return res;
    }),
    send: jest.fn(data => {
      captured.data = data;
      return res;
    }),
    setHeader: jest.fn((name, value) => {
      captured.headers[name] = value;
      return res;
    }),
    end: jest.fn(() => {
      captured.ended = true;
      return res;
    })
  };
  
  return { res, captured };
};

/**
 * Creates a mock request object for testing Express routes
 * @param {Object} options Options to configure the request
 * @returns {Object} Mock request object
 */
const createMockRequest = (options = {}) => {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    ...options
  };
};

/**
 * Waits for a specified duration
 * @param {number} ms Milliseconds to wait
 * @returns {Promise} Promise that resolves after the delay
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  createMockSocketIo,
  saveAndRestoreState,
  createMockResponse,
  createMockRequest,
  wait
}; 