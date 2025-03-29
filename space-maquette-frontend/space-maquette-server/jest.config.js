// Jest configuration
module.exports = {
  // The root directory for Jest to search for test files
  rootDir: './',
  
  // The test environment to use
  testEnvironment: 'node',
  
  // The file patterns to look for tests
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Setup file to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  
  // Collect coverage information
  collectCoverage: true,
  
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  
  // The files and directories that Jest should collect coverage from
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/data/**',
    '!src/index.js'
  ],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Stop tests after first failure
  bail: 0,
  
  // Display individual test results with a progress bar reporter
  reporters: ['default'],
  
  // Cache tests to improve speed
  cache: true
}; 