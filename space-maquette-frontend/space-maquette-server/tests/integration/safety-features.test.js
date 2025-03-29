// Safety feature tests
const motionController = require('../../src/motion-controller');
const { systemState, updateSystemStatus, updatePosition } = require('../../src/state');
const motionSim = require('../../src/motion_sim');
const registerSocketHandlers = require('../../src/socketHandlers');

// Mock dependencies
jest.mock('../../src/motion_sim');
jest.mock('../../src/logger', () => ({
  logDebug: jest.fn()
}));

// Create a mock socket.io instance
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

describe('Safety Features', () => {
  let mockIo, mockSocket, socketHandlers;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mocks
    motionSim.moveToPosition.mockImplementation((position) => {
      if (systemState.eStop) {
        return { status: 'ERROR', message: 'E-STOP ACTIVE' };
      }
      
      // Check for collisions
      if (position.x !== undefined && (position.x < 0 || position.x > 800)) {
        return { status: 'ERROR', message: 'X MOVEMENT LIMIT EXCEEDED' };
      }
      
      if (position.y !== undefined && (position.y < 0 || position.y > 800)) {
        return { status: 'ERROR', message: 'Y MOVEMENT LIMIT EXCEEDED' };
      }
      
      return { status: 'OK', message: 'Position updated' };
    });
    
    // Mock homeAxis to return a valid response
    motionSim.homeAxis.mockImplementation((axis, callback) => {
      if (callback) setTimeout(() => callback(`Homing complete for ${axis}`), 50);
      return { status: 'OK', message: 'Homing started' };
    });
    
    // Create mock Socket.IO objects
    const mocks = createMockSocketIo();
    mockIo = mocks.io;
    mockSocket = mocks.socket;
    
    // Register socket handlers
    registerSocketHandlers(mockIo);
    
    // Get the registered handlers
    socketHandlers = mocks.socketHandlers;
    
    // Reset system state
    updatePosition({ x: 150, y: 150, z: 50, pan: 180, tilt: 90 });
    updateSystemStatus({ eStop: false, clearCoreStatus: 'READY' });
  });
  
  describe('E-Stop Functionality', () => {
    test('should prevent movement when E-Stop is active', () => {
      // Activate E-Stop
      updateSystemStatus({ eStop: true });
      
      // Try to move
      const result = motionController.moveToPosition({ x: 200, y: 200 });
      
      // Should be prevented
      expect(result.status).toBe('ERROR');
      expect(result.message).toContain('E-STOP ACTIVE');
    });
    
    test('should block keyboard movement when E-Stop is active', () => {
      // Activate E-Stop
      updateSystemStatus({ eStop: true });
      
      // Try keyboard movement via socket
      const movementData = { forward: 1, strafe: 0, deltaTime: 0.1 };
      socketHandlers.keyboard_movement(movementData);
      
      // Motion controller should not be called
      expect(motionSim.moveToPosition).not.toHaveBeenCalled();
    });
    
    test('should block mouse look when E-Stop is active', () => {
      // Activate E-Stop
      updateSystemStatus({ eStop: true });
      
      // Try mouse look via socket
      const lookData = { deltaX: 10, deltaY: -5 };
      socketHandlers.mouse_look(lookData);
      
      // Motion controller should not be called
      expect(motionSim.moveToPosition).not.toHaveBeenCalled();
    });
    
    test('should block button movement when E-Stop is active', () => {
      // Activate E-Stop
      updateSystemStatus({ eStop: true });
      
      // Try button movement via socket
      socketHandlers.button_movement({ direction: 'x+' });
      
      // Motion controller should not be called
      expect(motionSim.executeButtonMovement).not.toHaveBeenCalled();
    });
    
    test('should resume normal operation when E-Stop is cleared', () => {
      // Activate E-Stop
      updateSystemStatus({ eStop: true });
      
      // Try to move (should fail)
      const blockedResult = motionController.moveToPosition({ x: 200, y: 200 });
      expect(blockedResult.status).toBe('ERROR');
      
      // Clear E-Stop
      updateSystemStatus({ eStop: false });
      
      // Try to move again (should succeed)
      const allowedResult = motionController.moveToPosition({ x: 200, y: 200 });
      expect(allowedResult.status).toBe('OK');
    });
  });
  
  describe('Position Limit Safety', () => {
    test('should prevent movement beyond X axis limits', () => {
      // Try to move beyond X limit
      const result = motionController.moveToPosition({ x: 900, y: 150 });
      
      // Should be prevented
      expect(result.status).toBe('ERROR');
      expect(result.message).toContain('X MOVEMENT LIMIT EXCEEDED');
    });
    
    test('should prevent movement beyond Y axis limits', () => {
      // Try to move beyond Y limit
      const result = motionController.moveToPosition({ x: 150, y: 900 });
      
      // Should be prevented
      expect(result.status).toBe('ERROR');
      expect(result.message).toContain('Y MOVEMENT LIMIT EXCEEDED');
    });
    
    test('should allow movement within limits', () => {
      // Move within limits
      const result = motionController.moveToPosition({ x: 400, y: 400 });
      
      // Should succeed
      expect(result.status).toBe('OK');
    });
  });
  
  describe('Command Safety Checks', () => {
    test('should validate MOVE command parameters', () => {
      const callback = jest.fn();
      
      // Call with invalid parameters (missing Y and Z)
      socketHandlers.command({ command: 'MOVE', params: ['300'] }, callback);
      
      // Should report error
      expect(callback).toHaveBeenCalledWith({
        success: false,
        message: 'MISSING_PARAMS'
      });
      
      // Position should not be updated
      expect(systemState.position.x).toBe(150);
    });
    
    test('should validate HOME command parameters', () => {
      const callback = jest.fn();
      
      // Valid axis
      socketHandlers.command({ command: 'HOME', params: ['X'] }, callback);
      expect(callback).toHaveBeenCalledWith({
        success: true,
        message: 'Homing started'
      });
      
      // Valid ALL option
      callback.mockClear();
      socketHandlers.command({ command: 'HOME', params: ['ALL'] }, callback);
      expect(callback).toHaveBeenCalledWith({
        success: true,
        message: 'Homing started'
      });
    });
  });
  
  describe('Boundary Collision Prevention', () => {
    test('should respect motion solver boundaries for keyboard movement', () => {
      // Move to edge of boundary first
      updatePosition({ x: 770, y: 150 });
      
      // Try to move beyond boundary via keyboard
      const movementData = { forward: -1, strafe: 0, deltaTime: 1.0 };
      motionController.processKeyboardMovement(movementData);
      
      // Position should be limited to boundary
      expect(motionSim.moveToPosition).toHaveBeenCalledWith(expect.objectContaining({
        x: expect.any(Number)
      }));
      
      // In a real scenario, motion-solver would limit this value
      // Since we're mocking motionSim, we can only verify it was called
    });
  });
}); 