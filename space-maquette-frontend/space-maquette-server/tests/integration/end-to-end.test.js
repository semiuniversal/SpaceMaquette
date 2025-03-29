// End-to-end test that simulates a full workflow
const registerSocketHandlers = require('../../src/socketHandlers');
const { systemState, updatePosition, updateSystemStatus } = require('../../src/state');
const motionSim = require('../../src/motion_sim');
const { logDebug } = require('../../src/logger');

// Mock dependencies
jest.mock('../../src/logger', () => ({
  logDebug: jest.fn()
}));

// Mock motion_sim for predictable responses
jest.mock('../../src/motion_sim', () => {
  return {
    moveToPosition: jest.fn().mockImplementation((position) => {
      // Check if E-Stop is active
      const mockState = require('../../src/state');
      if (mockState.systemState.eStop) {
        return { status: 'ERROR', message: 'E-STOP ACTIVE' };
      }
      
      // Update the system state to simulate actual movement
      const newPosition = {};
      if (position.x !== undefined) newPosition.x = position.x;
      if (position.y !== undefined) newPosition.y = position.y;
      if (position.z !== undefined) newPosition.z = position.z;
      if (position.pan !== undefined) newPosition.pan = position.pan;
      if (position.tilt !== undefined) newPosition.tilt = position.tilt;
      
      // Apply the position update
      require('../../src/state').updatePosition(newPosition);
      
      return { status: 'OK', message: 'Position updated' };
    }),
    homeAxis: jest.fn().mockImplementation((axis, callback) => {
      // Simulate homing completion after a short delay
      if (callback) {
        setTimeout(() => {
          const mockSystemState = require('../../src/state').systemState;
          
          if (axis === 'ALL' || axis === 'X') {
            mockSystemState.homed.x = true;
          }
          if (axis === 'ALL' || axis === 'Y') {
            mockSystemState.homed.y = true;
          }
          if (axis === 'ALL' || axis === 'Z') {
            mockSystemState.homed.z = true;
          }
          
          callback(`Homing complete for ${axis}`);
        }, 50);
      }
      
      return { status: 'OK', message: 'Homing started' };
    }),
    executeButtonMovement: jest.fn().mockImplementation((direction) => {
      const mockState = require('../../src/state');
      const mockSystemState = mockState.systemState;
      const mockUpdatePosition = mockState.updatePosition;
      
      // Check if E-Stop is active
      if (mockSystemState.eStop) {
        return { status: 'ERROR', message: 'E-STOP ACTIVE' };
      }
      
      // Simulate button movements
      switch (direction) {
        case 'x+':
          mockUpdatePosition({ x: mockSystemState.position.x + 50 });
          break;
        case 'x-':
          mockUpdatePosition({ x: mockSystemState.position.x - 50 });
          break;
        case 'y+':
          mockUpdatePosition({ y: mockSystemState.position.y + 50 });
          break;
        case 'y-':
          mockUpdatePosition({ y: mockSystemState.position.y - 50 });
          break;
        case 'z+':
          mockUpdatePosition({ z: mockSystemState.position.z + 20 });
          break;
        case 'z-':
          mockUpdatePosition({ z: mockSystemState.position.z - 20 });
          break;
      }
      
      return { status: 'OK', message: 'Button movement executed' };
    }),
    stopAllMotions: jest.fn(),
    setIo: jest.fn()
  };
});

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

describe('End-to-End Workflow', () => {
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
    
    // Reset system state for the workflow
    updatePosition({ x: 150, y: 150, z: 50, pan: 180, tilt: 90 });
    updateSystemStatus({ 
      eStop: false, 
      clearCoreStatus: 'READY',
      homed: { x: false, y: false, z: false }
    });
    systemState.terminalOutput = [];
    systemState.homed = { x: false, y: false, z: false };
  });
  
  test('complete workflow from system start to operation', async () => {
    // Step 1: Initial connection should send system status
    expect(mockSocket.emit).toHaveBeenCalledWith('systemStatus', expect.objectContaining({
      position: expect.objectContaining({ x: 150, y: 150, z: 50 })
    }));
    
    // Step 2: Home all axes
    let callback = jest.fn();
    socketHandlers.command({ command: 'HOME', params: ['ALL'] }, callback);
    
    // Verify command acknowledgment
    expect(callback).toHaveBeenCalledWith({ 
      success: true, 
      message: 'Homing started' 
    });
    
    // Wait for homing to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify homing completed for all axes
    expect(systemState.homed.x).toBe(true);
    expect(systemState.homed.y).toBe(true);
    expect(systemState.homed.z).toBe(true);
    
    // Step 3: Move to a position using absolute coordinates
    callback = jest.fn();
    socketHandlers.command({ command: 'MOVE', params: ['300', '400', '70'] }, callback);
    
    // Verify move command acknowledgment
    expect(callback).toHaveBeenCalledWith({ 
      success: true, 
      message: 'Position updated' 
    });
    
    // Verify position was updated
    expect(systemState.position.x).toBe(300);
    expect(systemState.position.y).toBe(400);
    expect(systemState.position.z).toBe(70);
    
    // Step 4: Use button controls to adjust position
    socketHandlers.button_movement({ direction: 'x+' });
    expect(systemState.position.x).toBe(350); // 300 + 50
    
    socketHandlers.button_movement({ direction: 'y-' });
    expect(systemState.position.y).toBe(350); // 400 - 50
    
    // Step 5: Use keyboard controls for fine movements
    socketHandlers.keyboard_movement({ 
      forward: 1,  // Move forward
      strafe: 0,   // No sideways movement
      deltaTime: 0.1 
    });
    
    // System should have updated position (handled by the mock)
    expect(motionSim.moveToPosition).toHaveBeenCalled();
    
    // Step 6: Use mouse look to change orientation
    socketHandlers.mouse_look({
      deltaX: 15,  // Pan right
      deltaY: -10  // Tilt up
    });
    
    // System should have updated orientation (handled by the mock)
    expect(motionSim.moveToPosition).toHaveBeenCalled();
    
    // Remember current position before E-Stop
    const positionBeforeEStop = { ...systemState.position };
    
    // Step 7: Emergency stop scenario
    updateSystemStatus({ eStop: true });
    
    // Try to move while E-Stop is active
    callback = jest.fn();
    socketHandlers.command({ command: 'MOVE', params: ['200', '200', '50'] }, callback);
    
    // Movement should be rejected - position should remain the same
    expect(systemState.position.x).toBe(positionBeforeEStop.x); 
    expect(systemState.position.y).toBe(positionBeforeEStop.y);
    
    // Callback should indicate failure
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      success: false
    }));
    
    // Step 8: Clear E-Stop and try again
    updateSystemStatus({ eStop: false });
    
    callback = jest.fn();
    socketHandlers.command({ command: 'MOVE', params: ['200', '200', '50'] }, callback);
    
    // Now movement should succeed
    expect(systemState.position.x).toBe(200);
    expect(systemState.position.y).toBe(200);
    expect(systemState.position.z).toBe(50);
    
    // Step 9: Stop all motions
    socketHandlers.button_movement({ direction: 'stop' });
    expect(motionSim.stopAllMotions).toHaveBeenCalled();
    
    // Verify terminal output has recorded all commands
    expect(systemState.terminalOutput.length).toBeGreaterThan(0);
    expect(systemState.terminalOutput).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/HOME: ALL/),
        expect.stringMatching(/MOVE: 300, 400, 70/),
        expect.stringMatching(/MOVE: 200, 200, 50/)
      ])
    );
  });
}); 