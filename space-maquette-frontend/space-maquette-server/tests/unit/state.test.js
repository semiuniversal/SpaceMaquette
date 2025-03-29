// Unit tests for state.js
const stateModule = require('../../src/state');

describe('State Module', () => {
  // Create a backup of the original state to restore after tests
  const originalState = { ...stateModule.systemState };
  
  afterEach(() => {
    // Reset the state to its original values after each test
    Object.keys(originalState).forEach(key => {
      stateModule.systemState[key] = originalState[key];
    });
    
    // Reset the terminal output
    stateModule.systemState.terminalOutput = [];
  });
  
  describe('updatePosition', () => {
    test('should update x position correctly', () => {
      stateModule.updatePosition({ x: 300 });
      expect(stateModule.systemState.position.x).toBe(300);
    });
    
    test('should update y position correctly', () => {
      stateModule.updatePosition({ y: 300 });
      expect(stateModule.systemState.position.y).toBe(300);
    });
    
    test('should update z position correctly', () => {
      stateModule.updatePosition({ z: 100 });
      expect(stateModule.systemState.position.z).toBe(100);
    });
    
    test('should update pan correctly', () => {
      stateModule.updatePosition({ pan: 90 });
      expect(stateModule.systemState.position.pan).toBe(90);
    });
    
    test('should update tilt correctly', () => {
      stateModule.updatePosition({ tilt: 70 });
      expect(stateModule.systemState.position.tilt).toBe(70);
    });
    
    test('should update multiple position values at once', () => {
      stateModule.updatePosition({ x: 250, y: 350, z: 75, pan: 110, tilt: 60 });
      expect(stateModule.systemState.position.x).toBe(250);
      expect(stateModule.systemState.position.y).toBe(350);
      expect(stateModule.systemState.position.z).toBe(75);
      expect(stateModule.systemState.position.pan).toBe(110);
      expect(stateModule.systemState.position.tilt).toBe(60);
    });
    
    test('should only update specified values', () => {
      const originalX = stateModule.systemState.position.x;
      stateModule.updatePosition({ y: 400 });
      expect(stateModule.systemState.position.x).toBe(originalX);
      expect(stateModule.systemState.position.y).toBe(400);
    });
  });
  
  describe('updateSystemStatus', () => {
    test('should update clearCoreStatus correctly', () => {
      stateModule.updateSystemStatus({ clearCoreStatus: 'MOVING' });
      expect(stateModule.systemState.clearCoreStatus).toBe('MOVING');
    });
    
    test('should update rangefinderActive correctly', () => {
      stateModule.updateSystemStatus({ rangefinderActive: true });
      expect(stateModule.systemState.rangefinderActive).toBe(true);
    });
    
    test('should update eStop correctly', () => {
      stateModule.updateSystemStatus({ eStop: true });
      expect(stateModule.systemState.eStop).toBe(true);
    });
    
    test('should update servoStatus correctly', () => {
      stateModule.updateSystemStatus({ servoStatus: 'ACTIVE' });
      expect(stateModule.systemState.servoStatus).toBe('ACTIVE');
    });
    
    test('should update multiple status values at once', () => {
      stateModule.updateSystemStatus({
        clearCoreStatus: 'HOMING',
        rangefinderActive: true,
        eStop: false,
        servoStatus: 'ACTIVE'
      });
      
      expect(stateModule.systemState.clearCoreStatus).toBe('HOMING');
      expect(stateModule.systemState.rangefinderActive).toBe(true);
      expect(stateModule.systemState.eStop).toBe(false);
      expect(stateModule.systemState.servoStatus).toBe('ACTIVE');
    });
    
    test('should only update specified status values', () => {
      const originalServoStatus = stateModule.systemState.servoStatus;
      stateModule.updateSystemStatus({ clearCoreStatus: 'HOMING' });
      expect(stateModule.systemState.clearCoreStatus).toBe('HOMING');
      expect(stateModule.systemState.servoStatus).toBe(originalServoStatus);
    });
  });
  
  describe('addTerminalEntry', () => {
    test('should add new entry to terminal output', () => {
      stateModule.addTerminalEntry('Command executed successfully');
      expect(stateModule.systemState.terminalOutput).toContain('Command executed successfully');
    });
    
    test('should add multiple entries in order', () => {
      stateModule.addTerminalEntry('First command');
      stateModule.addTerminalEntry('Second command');
      expect(stateModule.systemState.terminalOutput).toEqual(['First command', 'Second command']);
    });
    
    test('should limit terminal output to the last 100 entries', () => {
      // Fill the terminal with 110 entries
      for (let i = 0; i < 110; i++) {
        stateModule.addTerminalEntry(`Entry ${i}`);
      }
      
      // Should keep only the last 100
      expect(stateModule.systemState.terminalOutput.length).toBe(100);
      expect(stateModule.systemState.terminalOutput[0]).toBe('Entry 10');
      expect(stateModule.systemState.terminalOutput[99]).toBe('Entry 109');
    });
  });
  
  describe('updateConfig', () => {
    test('should update config value correctly', () => {
      stateModule.updateConfig('motion', 'velocity_x', 400);
      expect(stateModule.systemState.config.motion.velocity_x).toBe(400);
    });
    
    test('should return true when update is successful', () => {
      const result = stateModule.updateConfig('motion', 'velocity_y', 450);
      expect(result).toBe(true);
    });
    
    test('should return false for nonexistent category', () => {
      const result = stateModule.updateConfig('nonexistent', 'velocity_x', 400);
      expect(result).toBe(false);
    });
    
    test('should return false for nonexistent key', () => {
      const result = stateModule.updateConfig('motion', 'nonexistent', 400);
      expect(result).toBe(false);
    });
  });
  
  describe('scan data functions', () => {
    test('addScanData should add points correctly', () => {
      stateModule.addScanData({ x: 100, y: 100, z: 50 });
      expect(stateModule.systemState.scanData).toContainEqual({ x: 100, y: 100, z: 50 });
    });
    
    test('updateScanProgress should update progress', () => {
      stateModule.updateScanProgress(75);
      expect(stateModule.systemState.scanProgress).toBe(75);
    });
    
    test('clearScanData should reset scan data and progress', () => {
      // Add some scan data
      stateModule.addScanData({ x: 100, y: 100, z: 50 });
      stateModule.updateScanProgress(75);
      
      // Clear it
      stateModule.clearScanData();
      
      // Verify it's cleared
      expect(stateModule.systemState.scanData).toEqual([]);
      expect(stateModule.systemState.scanProgress).toBe(0);
    });
  });
}); 