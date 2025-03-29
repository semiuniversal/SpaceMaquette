# Space Maquette Server Test Suite

This directory contains a comprehensive test suite for the Space Maquette Server module. The tests are designed to verify the proper functionality and safety of the server that controls physical motors and cameras.

## Test Structure

The test suite is organized as follows:

- `unit/`: Unit tests for individual modules
  - `motion-solver.test.js`: Tests for movement calculations and boundaries
  - `state.test.js`: Tests for state management
  - `motion-controller.test.js`: Tests for motion controller operations
  
- `integration/`: Integration tests that verify module interactions
  - `socket-handlers.test.js`: Tests for socket event handlers
  - `safety-features.test.js`: Tests specifically for safety features
  - `end-to-end.test.js`: End-to-end workflow simulation
  
- `jest.setup.js`: Global test setup and configuration
- `test-helpers.js`: Common utilities shared across tests

## Running Tests

You can run the tests using the following npm commands:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run safety-specific tests
npm run test:safety

# Watch for changes and run tests automatically
npm run test:watch

# Run the dedicated test watcher script
npm run test:watcher
```

## Test Coverage

The test suite is designed to cover:

1. **Core Functionality**
   - Movement calculations
   - Position and orientation tracking
   - Command parsing and execution
   - Socket communication

2. **Safety Features**
   - E-Stop functionality
   - Motion limits and boundaries
   - Command validation
   - Collision prevention

3. **Error Handling**
   - Invalid commands
   - Missing parameters
   - Out-of-bounds movement

## Adding New Tests

When adding new features to the server, please follow these guidelines:

1. Create unit tests for any new module or significant function
2. Update integration tests if the feature affects multiple modules
3. Add safety-specific tests if the feature involves physical motion
4. Update end-to-end tests to include the new functionality in workflows

## Mocking Strategy

The test suite uses several mocking strategies:

- Socket.IO and Express are mocked to simulate network communication
- Physical movement is simulated by directly updating state
- Asynchronous operations use promises and Jest's async utilities
- External services are mocked with Jest's mock functions

## Best Practices

- Always reset system state before and after tests
- Use descriptive test names that explain what's being tested
- Group related tests with describe blocks
- Isolate tests to prevent cross-contamination
- Focus on testing behavior, not implementation details
- Verify safety conditions in all movement-related tests 