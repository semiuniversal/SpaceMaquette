// tests/ui/contexts/WebSocketContext.test.tsx
import React from '../../../space-maquette-ui/node_modules/react';
import {
  render,
  screen,
} from '../../../space-maquette-ui/node_modules/@testing-library/react';
import {
  WebSocketProvider,
  useWebSocket,
} from '../../../space-maquette-ui/src/contexts/WebSocketContext';

// Mock socket.io-client
jest.mock('../../../space-maquette-ui/node_modules/socket.io-client', () => {
  const mockOn = jest.fn();
  const mockEmit = jest.fn();

  return {
    io: jest.fn(() => ({
      on: mockOn,
      emit: mockEmit,
      connect: jest.fn(),
      disconnect: jest.fn(),
      id: 'mock-socket-id',
    })),
  };
});

// Test component
const TestComponent = () => {
  const { connected, position } = useWebSocket();
  return (
    <div>
      <div data-testid="connection-status">
        {connected ? 'Connected' : 'Disconnected'}
      </div>
      <div data-testid="position">{`X:${position.x.toFixed(1)}, Y:${position.y.toFixed(1)}`}</div>
    </div>
  );
};

describe('WebSocketContext', () => {
  test('provides default values', () => {
    render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );

    expect(screen.getByTestId('connection-status')).toHaveTextContent(
      'Disconnected'
    );
    expect(screen.getByTestId('position')).toHaveTextContent('X:0.0, Y:0.0');
  });
});
