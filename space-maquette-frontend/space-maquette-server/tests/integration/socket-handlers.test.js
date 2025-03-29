// Integration tests for socketHandlers.js
const registerSocketHandlers = require('../../src/socketHandlers');
const { systemState, updatePosition } = require('../../src/state');
const motionController = require('../../src/motion-controller');

// Mock motion controller
jest.mock('../../src/motion-controller', () => ({
  processKeyboardMovement: jest.fn().mockReturnValue({ x: 200, y: 200 }),
  processMouseLook: jest.fn().mockReturnValue({ pan: 90, tilt: 80 }),
  moveToPosition: jest.fn().mockReturnValue({ status: 'OK', message: 'Position updated' }),
  homeAxis: jest.fn().mockImplementation((axis, callback) => {
    if (callback) setTimeout(() => callback('Homing complete'), 50);
    return { status: 'OK', message: 'Homing started' };
  }),
  stopAllMotions: jest.fn(),
  executeButtonMovement: jest.fn(),
  setIo: jest.fn()
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

describe('Socket Handlers Integration', () => {
  let mockIo, mockSocket, socketHandlers;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock Socket.IO objects
    const mocks = createMockSocketIo();
    mockIo = mocks.io;
    mockSocket = mocks.socket;
    
    // Register socket handlers
    registerSocketHandlers(mockIo);
    
    // Get the registered handlers
    socketHandlers = mocks.socketHandlers;
    
    // Reset system state for tests
    updatePosition({ x: 150, y: 150, z: 50, pan: 180, tilt: 90 });
    systemState.eStop = false;
    systemState.terminalOutput = [];
  });
  
  test('should register handlers for all expected socket events', () => {
    expect(mockSocket.on).toHaveBeenCalledWith('keyboard_movement', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('mouse_look', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('button_movement', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('command', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('clearTerminal', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('getClearCoreInfo', expect.any(Function));
  });
  
  test('should emit initial system status on connection', () => {
    expect(mockSocket.emit).toHaveBeenCalledWith('systemStatus', expect.objectContaining({
      position: expect.any(Object),
      _updateId: expect.any(Number)
    }));
  });
  
  describe('keyboard_movement event', () => {
    test('should call motionController.processKeyboardMovement with correct data', () => {
      const movementData = { forward: 1, strafe: 0, deltaTime: 0.1 };
      socketHandlers.keyboard_movement(movementData);
      
      expect(motionController.processKeyboardMovement).toHaveBeenCalledWith(movementData);
    });
    
    test('should emit updated system status', () => {
      socketHandlers.keyboard_movement({ forward: 1, strafe: 0, deltaTime: 0.1 });
      
      expect(mockIo.emit).toHaveBeenCalledWith('systemStatus', expect.objectContaining({
        _updateId: expect.any(Number)
      }));
    });
    
    test('should ignore movement when E-Stop is active', () => {
      // Activate E-Stop
      systemState.eStop = true;
      
      socketHandlers.keyboard_movement({ forward: 1, strafe: 0, deltaTime: 0.1 });
      
      // Should not call motion controller
      expect(motionController.processKeyboardMovement).not.toHaveBeenCalled();
      
      // Reset E-Stop
      systemState.eStop = false;
    });
  });
  
  describe('mouse_look event', () => {
    test('should call motionController.processMouseLook with correct data', () => {
      const lookData = { deltaX: 10, deltaY: -5 };
      socketHandlers.mouse_look(lookData);
      
      expect(motionController.processMouseLook).toHaveBeenCalledWith(lookData);
    });
    
    test('should emit updated system status', () => {
      socketHandlers.mouse_look({ deltaX: 10, deltaY: -5 });
      
      expect(mockIo.emit).toHaveBeenCalledWith('systemStatus', expect.objectContaining({
        _updateId: expect.any(Number)
      }));
    });
    
    test('should ignore movement when E-Stop is active', () => {
      // Activate E-Stop
      systemState.eStop = true;
      
      socketHandlers.mouse_look({ deltaX: 10, deltaY: -5 });
      
      // Should not call motion controller
      expect(motionController.processMouseLook).not.toHaveBeenCalled();
      
      // Reset E-Stop
      systemState.eStop = false;
    });
  });
  
  describe('button_movement event', () => {
    test('should call motionController.executeButtonMovement with correct direction', () => {
      socketHandlers.button_movement({ direction: 'x+' });
      
      expect(motionController.executeButtonMovement).toHaveBeenCalledWith('x+');
    });
    
    test('should call motionController.stopAllMotions when direction is "stop"', () => {
      socketHandlers.button_movement({ direction: 'stop' });
      
      expect(motionController.stopAllMotions).toHaveBeenCalled();
    });
    
    test('should ignore movement when E-Stop is active', () => {
      // Activate E-Stop
      systemState.eStop = true;
      
      socketHandlers.button_movement({ direction: 'x+' });
      
      // Should not call motion controller
      expect(motionController.executeButtonMovement).not.toHaveBeenCalled();
      
      // Reset E-Stop
      systemState.eStop = false;
    });
  });
  
  describe('command event', () => {
    test('should handle HOME command correctly', (done) => {
      const callback = jest.fn();
      
      socketHandlers.command({ command: 'HOME', params: ['X'] }, callback);
      
      // Should call homeAxis with correct parameters
      expect(motionController.homeAxis).toHaveBeenCalledWith('X', expect.any(Function));
      
      // Should add terminal entries
      expect(systemState.terminalOutput).toContain('> HOME: X');
      
      // Should call callback with success result
      expect(callback).toHaveBeenCalledWith({
        success: true,
        message: 'Homing started'
      });
      
      // Wait for the homing to complete
      setTimeout(() => {
        // Should emit commandResponse
        expect(mockSocket.emit).toHaveBeenCalledWith('commandResponse', expect.objectContaining({
          command: 'HOME_COMPLETE',
          response: { status: 'OK', message: 'Homing complete' }
        }));
        
        done();
      }, 100);
    });
    
    test('should handle MOVE command correctly', () => {
      const callback = jest.fn();
      
      socketHandlers.command({ command: 'MOVE', params: ['300', '400', '50'] }, callback);
      
      // Should call moveToPosition with correct parameters
      expect(motionController.moveToPosition).toHaveBeenCalledWith({
        x: 300,
        y: 400,
        z: 50,
        pan: 180,  // Default from system state
        tilt: 90   // Default from system state
      });
      
      // Should add terminal entries
      expect(systemState.terminalOutput).toContain('> MOVE: 300, 400, 50');
      
      // Should call callback with success result
      expect(callback).toHaveBeenCalledWith({
        success: true,
        message: 'Position updated'
      });
    });
    
    test('should handle MOVE command with missing parameters', () => {
      const callback = jest.fn();
      
      socketHandlers.command({ command: 'MOVE', params: ['300'] }, callback);
      
      // Should not call moveToPosition
      expect(motionController.moveToPosition).not.toHaveBeenCalled();
      
      // Should add error to terminal
      expect(systemState.terminalOutput).toContain('< ERROR: MISSING_PARAMS');
      
      // Should call callback with error result
      expect(callback).toHaveBeenCalledWith({
        success: false,
        message: 'MISSING_PARAMS'
      });
    });
  });
  
  describe('clearTerminal event', () => {
    test('should clear terminal output', () => {
      // Add some entries to terminal
      systemState.terminalOutput = ['Entry 1', 'Entry 2'];
      
      socketHandlers.clearTerminal();
      
      // Terminal should be empty
      expect(systemState.terminalOutput).toEqual([]);
      
      // Should emit empty terminal
      expect(mockSocket.emit).toHaveBeenCalledWith('terminalOutput', []);
    });
  });
}); 