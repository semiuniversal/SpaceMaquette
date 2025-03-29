// Unit tests for motion-solver.js
const motionSolver = require('../../src/motion-solver');
const { systemState, updatePosition } = require('../../src/state');

// Backup original position to restore after tests
let originalPosition;

describe('Motion Solver Module', () => {
  beforeEach(() => {
    // Save original position
    originalPosition = { ...systemState.position };
    
    // Reset position to a known state for tests
    updatePosition({ x: 150, y: 150, z: 50, pan: 180, tilt: 90 });
  });
  
  afterEach(() => {
    // Restore original position after each test
    updatePosition(originalPosition);
  });
  
  describe('processKeyboardMovement', () => {
    test('should move forward correctly', () => {
      // At pan 180, forward movement should decrease x
      const result = motionSolver.processKeyboardMovement({ 
        forward: 1, 
        strafe: 0, 
        deltaTime: 0.1 
      });
      
      // Forward at pan 180 should decrease x
      expect(result.x).toBeLessThan(150);
      expect(result.y).toBeCloseTo(150);
    });
    
    test('should move backward correctly', () => {
      // At pan 180, backward movement should increase x
      const result = motionSolver.processKeyboardMovement({ 
        forward: -1, 
        strafe: 0, 
        deltaTime: 0.1 
      });
      
      // Backward at pan 180 should increase x
      expect(result.x).toBeGreaterThan(150);
      expect(result.y).toBeCloseTo(150);
    });
    
    test('should strafe correctly', () => {
      // At pan 180, strafe right should decrease y
      const result = motionSolver.processKeyboardMovement({ 
        forward: 0, 
        strafe: 1, 
        deltaTime: 0.1 
      });
      
      // Strafe right at pan 180 should decrease y
      expect(result.x).toBeCloseTo(150);
      expect(result.y).toBeLessThan(150);
    });
    
    test('should handle diagonal movement', () => {
      // At pan 180, forward+right should decrease both x and y
      const result = motionSolver.processKeyboardMovement({ 
        forward: 1, 
        strafe: 1, 
        deltaTime: 0.1 
      });
      
      // Should decrease both x and y
      expect(result.x).toBeLessThan(150);
      expect(result.y).toBeLessThan(150);
    });
    
    test('should respect stage boundaries', () => {
      // First move close to boundary
      updatePosition({ x: 770, y: 150 });
      
      // Try to move beyond boundary
      const result = motionSolver.processKeyboardMovement({ 
        forward: -1, // Backward at pan 180 would increase x further
        strafe: 0, 
        deltaTime: 0.5 
      });
      
      // Should be constrained by the boundary
      expect(result.x).toBeLessThanOrEqual(800);
    });
  });
  
  describe('processMouseLook', () => {
    test('should update pan correctly', () => {
      // Set initial pan
      updatePosition({ pan: 90 });
      
      // Move mouse to the right
      const result = motionSolver.processMouseLook({ 
        deltaX: 10, 
        deltaY: 0 
      });
      
      // Pan should increase
      expect(result.pan).toBeGreaterThan(90);
    });
    
    test('should update tilt correctly', () => {
      // Set initial tilt
      updatePosition({ tilt: 90 });
      
      // Move mouse up
      const result = motionSolver.processMouseLook({ 
        deltaX: 0, 
        deltaY: -10 
      });
      
      // Tilt should decrease (looking up)
      expect(result.tilt).toBeLessThan(90);
    });
    
    test('should handle pan wraparound properly', () => {
      // Set pan close to 360
      updatePosition({ pan: 358 });
      
      // Move mouse right to cross 360 boundary
      const result = motionSolver.processMouseLook({ 
        deltaX: 20, 
        deltaY: 0 
      });
      
      // Pan should wrap around to near 0
      expect(result.pan).toBeGreaterThanOrEqual(0);
      expect(result.pan).toBeLessThan(10);
    });
    
    test('should respect tilt constraints (min)', () => {
      // Set tilt near minimum
      updatePosition({ tilt: 46 });
      
      // Try to tilt beyond minimum
      const result = motionSolver.processMouseLook({ 
        deltaX: 0, 
        deltaY: -10 
      });
      
      // Should not go below minimum tilt (45 degrees)
      expect(result.tilt).toBeGreaterThanOrEqual(45);
    });
    
    test('should respect tilt constraints (max)', () => {
      // Set tilt near maximum
      updatePosition({ tilt: 134 });
      
      // Try to tilt beyond maximum
      const result = motionSolver.processMouseLook({ 
        deltaX: 0, 
        deltaY: 10 
      });
      
      // Should not go above maximum tilt (135 degrees)
      expect(result.tilt).toBeLessThanOrEqual(135);
    });
  });
  
  describe('processButtonMovement', () => {
    test('should move in positive X direction', () => {
      const result = motionSolver.processButtonMovement('x+');
      expect(result.x).toBeGreaterThan(150);
    });
    
    test('should move in negative X direction', () => {
      const result = motionSolver.processButtonMovement('x-');
      expect(result.x).toBeLessThan(150);
    });
    
    test('should move in positive Y direction', () => {
      const result = motionSolver.processButtonMovement('y+');
      expect(result.y).toBeGreaterThan(150);
    });
    
    test('should move in negative Y direction', () => {
      const result = motionSolver.processButtonMovement('y-');
      expect(result.y).toBeLessThan(150);
    });
    
    test('should move in positive Z direction', () => {
      const result = motionSolver.processButtonMovement('z+');
      expect(result.z).toBeGreaterThan(50);
    });
    
    test('should move in negative Z direction', () => {
      const result = motionSolver.processButtonMovement('z-');
      expect(result.z).toBeLessThan(50);
    });
    
    test('should rotate pan clockwise', () => {
      const result = motionSolver.processButtonMovement('pan+');
      expect(result.pan).toBeGreaterThan(180);
    });
    
    test('should rotate pan counter-clockwise', () => {
      const result = motionSolver.processButtonMovement('pan-');
      expect(result.pan).toBeLessThan(180);
    });
    
    test('should respect stage boundaries with button movement', () => {
      // Move to the edge of the stage
      updatePosition({ x: 790, y: 150 });
      
      // Try to move beyond boundary
      const result = motionSolver.processButtonMovement('x+');
      
      // Should be limited by boundary
      expect(result.x).toBeLessThanOrEqual(800);
    });
  });
}); 