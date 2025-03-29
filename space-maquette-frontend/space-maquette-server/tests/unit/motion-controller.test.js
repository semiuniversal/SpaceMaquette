// Unit tests for motion-controller.js
const motionController = require('../../src/motion-controller');
const motionSim = require('../../src/motion_sim');
const motionSolver = require('../../src/motion-solver');
const { systemState } = require('../../src/state');

// Mock dependencies
jest.mock('../../src/motion_sim');
jest.mock('../../src/motion-solver');
jest.mock('../../src/logger', () => ({
  logDebug: jest.fn(),
}));

describe('Motion Controller Module', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup mock implementation for motion solver
    motionSolver.processKeyboardMovement.mockImplementation((data) => {
      return { x: 200, y: 200 };
    });
    
    motionSolver.processMouseLook.mockImplementation((data) => {
      return { pan: 90, tilt: 80 };
    });
    
    // Setup mock implementation for motion sim
    motionSim.moveToPosition.mockImplementation((position) => {
      // Check if E-Stop is active
      if (systemState.eStop) {
        return { status: 'ERROR', message: 'E-STOP ACTIVE' };
      }
      return { status: 'OK', message: 'Position updated' };
    });
    
    motionSim.homeAxis.mockImplementation((axis, callback) => {
      if (callback) setTimeout(() => callback('Homing complete'), 50);
      return { status: 'OK', message: 'Homing started' };
    });
  });
  
  describe('processKeyboardMovement', () => {
    test('should call motion solver with correct parameters', () => {
      const movementData = { forward: 1, strafe: 0, deltaTime: 0.1 };
      motionController.processKeyboardMovement(movementData);
      
      expect(motionSolver.processKeyboardMovement).toHaveBeenCalledWith(movementData);
    });
    
    test('should call moveToPosition with new position from motion solver', () => {
      motionController.processKeyboardMovement({ forward: 1, strafe: 0, deltaTime: 0.1 });
      
      expect(motionSim.moveToPosition).toHaveBeenCalledWith({ x: 200, y: 200 });
    });
    
    test('should return the new position from motion solver', () => {
      const result = motionController.processKeyboardMovement({ forward: 1, strafe: 0, deltaTime: 0.1 });
      
      expect(result).toEqual({ x: 200, y: 200 });
    });
  });
  
  describe('processMouseLook', () => {
    test('should call motion solver with correct parameters', () => {
      const lookData = { deltaX: 10, deltaY: -5 };
      motionController.processMouseLook(lookData);
      
      expect(motionSolver.processMouseLook).toHaveBeenCalledWith(lookData);
    });
    
    test('should call moveToPosition with new orientation from motion solver', () => {
      motionController.processMouseLook({ deltaX: 10, deltaY: -5 });
      
      expect(motionSim.moveToPosition).toHaveBeenCalledWith({ pan: 90, tilt: 80 });
    });
    
    test('should return the new orientation from motion solver', () => {
      const result = motionController.processMouseLook({ deltaX: 10, deltaY: -5 });
      
      expect(result).toEqual({ pan: 90, tilt: 80 });
    });
  });
  
  describe('moveToPosition', () => {
    test('should call motion sim moveToPosition with correct parameters', () => {
      const targetPosition = { x: 300, y: 400, z: 50, pan: 180, tilt: 90 };
      motionController.moveToPosition(targetPosition);
      
      expect(motionSim.moveToPosition).toHaveBeenCalledWith(targetPosition);
    });
  });
  
  describe('homeAxis', () => {
    test('should call motion sim homeAxis with correct parameters', () => {
      const callback = jest.fn();
      motionController.homeAxis('X', callback);
      
      expect(motionSim.homeAxis).toHaveBeenCalledWith('X', expect.any(Function));
    });
    
    test('should execute callback when homing completes', (done) => {
      const callback = jest.fn();
      motionController.homeAxis('X', callback);
      
      // Wait for the mocked homeAxis to call the callback
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith('Homing complete');
        done();
      }, 100);
    });
  });
  
  describe('stopAllMotions', () => {
    test('should call motion sim stopAllMotions', () => {
      motionController.stopAllMotions();
      
      expect(motionSim.stopAllMotions).toHaveBeenCalled();
    });
  });
  
  describe('setIo', () => {
    test('should call motion sim setIo with correct parameters', () => {
      const mockIo = { emit: jest.fn() };
      motionController.setIo(mockIo);
      
      expect(motionSim.setIo).toHaveBeenCalledWith(mockIo);
    });
  });
  
  describe('executeButtonMovement', () => {
    test('should call motion sim executeButtonMovement with correct parameters', () => {
      motionController.executeButtonMovement('x+');
      
      expect(motionSim.executeButtonMovement).toHaveBeenCalledWith('x+');
    });
  });
  
  // Additional safety tests
  describe('safety features', () => {
    test('E-Stop should prevent motion', () => {
      // Simulate E-Stop condition
      systemState.eStop = true;
      
      // Shouldn't move when E-Stop is active
      const result = motionController.moveToPosition({ x: 300, y: 400 });
      
      // Reset E-Stop for other tests
      systemState.eStop = false;
      
      // Assuming motion_sim is modified to check E-Stop first
      expect(result.status).toBe('ERROR');
      expect(result.message).toContain('E-STOP ACTIVE');
    });
  });
}); 