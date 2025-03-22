// src/contexts/WebSocketContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { Position, SystemStatus, CommandResponse, WebSocketEventType } from '../types';

interface WebSocketContextType {
  socket: Socket | null;
  connected: boolean;
  sendCommand: (command: string, params?: any[]) => Promise<CommandResponse>;
  position: Position;
  systemStatus: SystemStatus;
  terminalOutput: string[];
  scanData: Array<{x: number, y: number, z: number}>;
  scanProgress: number;
  clearTerminal: () => void;
  clearScanData: () => void;
}

// Default position
const defaultPosition: Position = {
  x: 0,
  y: 0,
  z: 0,
  pan: 0,
  tilt: 90
};

// Default system status
const defaultSystemStatus: SystemStatus = {
  connected: false,
  clearCoreStatus: 'Disconnected',
  rangefinderActive: false,
  eStop: false,
  servoStatus: 'Unknown',
  firmwareVersion: 'Unknown',
  lastUpdated: new Date().toISOString()
};

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  connected: false,
  sendCommand: async () => ({ success: false, message: 'Socket not initialized' }),
  position: defaultPosition,
  systemStatus: defaultSystemStatus,
  terminalOutput: [],
  scanData: [],
  scanProgress: 0,
  clearTerminal: () => {},
  clearScanData: () => {}
});

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

export const WebSocketProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [position, setPosition] = useState<Position>(defaultPosition);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(defaultSystemStatus);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [scanData, setScanData] = useState<Array<{x: number, y: number, z: number}>>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Add terminal entry
  const addTerminalEntry = useCallback((message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
    setTerminalOutput(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // Clear terminal
  const clearTerminal = useCallback(() => {
    setTerminalOutput([]);
  }, []);

  // Clear scan data
  const clearScanData = useCallback(() => {
    setScanData([]);
    setScanProgress(0);
  }, []);

  // Send command to server
  const sendCommand = useCallback(async (command: string, params: any[] = []): Promise<CommandResponse> => {
    if (!socket || !connected) {
      const response: CommandResponse = { 
        success: false, 
        message: 'Not connected to server' 
      };
      addTerminalEntry(`Command failed: ${command} - Not connected`);
      return response;
    }

    addTerminalEntry(`> ${command}${params.length ? ': ' + params.join(', ') : ''}`);

    return new Promise((resolve) => {
      socket.emit('command', { command, params }, (response: CommandResponse) => {
        addTerminalEntry(`< ${response.success ? 'OK' : 'ERROR'}: ${response.message}`);
        resolve(response);
      });
    });
  }, [socket, connected, addTerminalEntry]);

  // Initialize socket connection
  useEffect(() => {
    // Clean up function that handles disconnection
    const cleanup = () => {
      if (socket) {
        socket.disconnect();
      }
    };

    addTerminalEntry(`Attempting to connect to ${SOCKET_SERVER_URL} (attempt ${connectionAttempts + 1})`);

    // Create new socket with simpler config - removed transports specification
    const newSocket = io(SOCKET_SERVER_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true
    });

    setSocket(newSocket);

    // Socket event handlers
    newSocket.on('connect', () => {
      setConnected(true);
      setConnectionAttempts(0);
      addTerminalEntry(`Connected to server (ID: ${newSocket.id})`);
      
      // Update system status
      setSystemStatus(prev => ({
        ...prev,
        connected: true,
        lastUpdated: new Date().toISOString()
      }));
      
      // Request initial status
      newSocket.emit('command', { command: 'STATUS' });
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      addTerminalEntry(`Disconnected from server: ${reason}`);
      
      // Update system status
      setSystemStatus(prev => ({
        ...prev,
        connected: false,
        clearCoreStatus: 'Disconnected',
        lastUpdated: new Date().toISOString()
      }));
    });

    // Add error handlers
    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setConnected(false);
      addTerminalEntry(`Connection error: ${error.message}`);
      
      // Increment connection attempts for tracking
      setConnectionAttempts(prev => prev + 1);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      addTerminalEntry(`Reconnection attempt #${attemptNumber}`);
    });

    newSocket.on('reconnect', () => {
      addTerminalEntry('Reconnected to server');
    });

    newSocket.on('reconnect_failed', () => {
      addTerminalEntry('Failed to reconnect after maximum attempts');
    });

    // Handle WebSocket events
    newSocket.on('event', (data: { type: WebSocketEventType, payload: any }) => {
      const { type, payload } = data;
      
      switch (type) {
        case 'position_update':
          setPosition(payload);
          break;
        case 'status_change':
          setSystemStatus(prevStatus => ({
            ...prevStatus,
            ...payload,
            lastUpdated: new Date().toISOString()
          }));
          break;
        case 'scan_progress':
          if (payload.progress !== undefined) {
            setScanProgress(payload.progress);
          }
          if (payload.point) {
            setScanData(prev => [...prev, payload.point]);
          }
          break;
        case 'error':
          addTerminalEntry(`Error: ${payload.message}`);
          break;
        case 'command_response':
          // Already handled by sendCommand callback
          break;
      }
    });

    // Listen for system status updates
    newSocket.on('systemStatus', (data) => {
      setPosition(data.position);
      setSystemStatus(prevStatus => ({
        ...prevStatus,
        clearCoreStatus: data.clearCoreStatus,
        rangefinderActive: data.rangefinderActive,
        eStop: data.eStop,
        servoStatus: data.servoStatus,
        lastUpdated: new Date().toISOString()
      }));
    });

    // Listen for terminal output
    newSocket.on('terminalOutput', (data) => {
      setTerminalOutput(data);
    });

    // Listen for scan data
    newSocket.on('scanData', (data) => {
      setScanData(prev => [...prev, data]);
    });

    return cleanup;
  }, [addTerminalEntry, connectionAttempts, SOCKET_SERVER_URL]);

  const contextValue = {
    socket,
    connected,
    sendCommand,
    position,
    systemStatus,
    terminalOutput,
    scanData,
    scanProgress,
    clearTerminal,
    clearScanData
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);