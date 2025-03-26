// src/contexts/WebSocketContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import io, { Socket } from 'socket.io-client';
import {
  Position,
  SystemStatus,
  CommandResponse,
  WebSocketEventType,
} from '../types';

interface WebSocketContextType {
  socket: Socket | null;
  connected: boolean;
  sendCommand: (command: string, params?: any[]) => Promise<CommandResponse>;
  position: Position;
  systemStatus: SystemStatus;
  terminalOutput: string[];
  scanData: Array<{ x: number; y: number; z: number }>;
  scanProgress: number;
  clearTerminal: () => void;
  clearScanData: () => void;
  clearCoreIp: string | null;
}

// Default position
const defaultPosition: Position = {
  x: 0,
  y: 0,
  z: 0,
  pan: 0,
  tilt: 90,
};

// Default system status
const defaultSystemStatus: SystemStatus = {
  connected: false,
  clearCoreStatus: 'Disconnected',
  rangefinderActive: false,
  eStop: false,
  servoStatus: 'Unknown',
  firmwareVersion: 'Unknown',
  lastUpdated: new Date().toISOString(),
};

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  connected: false,
  sendCommand: async () => ({
    success: false,
    message: 'Socket not initialized',
  }),
  position: defaultPosition,
  systemStatus: defaultSystemStatus,
  terminalOutput: [],
  scanData: [],
  scanProgress: 0,
  clearTerminal: () => {},
  clearScanData: () => {},
  clearCoreIp: null,
});

const SOCKET_SERVER_URL =
  process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [position, setPosition] = useState<Position>(defaultPosition);
  const [systemStatus, setSystemStatus] =
    useState<SystemStatus>(defaultSystemStatus);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [scanData, setScanData] = useState<
    Array<{ x: number; y: number; z: number }>
  >([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [clearCoreIp, setClearCoreIp] = useState<string | null>(null);

  // Add terminal entry
  const addTerminalEntry = useCallback((message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
    setTerminalOutput((prev) => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // Clear terminal
  const clearTerminal = useCallback(() => {
    if (socket && connected) {
      socket.emit('clearTerminal');
    }
    setTerminalOutput([]);
  }, [socket, connected]);

  // Clear scan data
  const clearScanData = useCallback(() => {
    setScanData([]);
    setScanProgress(0);
  }, []);

  // Process commandResponse events (extracted to a reusable function)
  const handleCommandResponse = useCallback(
    (data: any) => {
      console.log('Processing commandResponse:', data);
      const { command, response, timestamp } = data;

      // For special async commands that complete later
      if (
        command === 'HOME_COMPLETE' ||
        command === 'SCAN_COMPLETE' ||
        command === 'PAN_COMPLETE' ||
        command === 'INFO'
      ) {
        console.log('Adding async response to terminal:', response);
        // Use plain text format without prefix since server already added it
        addTerminalEntry(`${response.status}: ${response.message}`);
      }
    },
    [addTerminalEntry]
  );
  // Send command to server
  const sendCommand = useCallback(
    async (command: string, params: any[] = []): Promise<CommandResponse> => {
      if (!socket || !connected) {
        const response: CommandResponse = {
          success: false,
          message: 'Not connected to server',
        };
        addTerminalEntry(`Command failed: ${command} - Not connected`);
        return response;
      }

      console.log('Sending command:', command, params);
      addTerminalEntry(
        `> ${command}${params.length ? ': ' + params.join(', ') : ''}`
      );

      return new Promise((resolve) => {
        socket.emit(
          'command',
          { command, params },
          (response: CommandResponse) => {
            console.log('Command callback received:', response);
            addTerminalEntry(
              `< ${response.success ? 'OK' : 'ERROR'}: ${response.message}`
            );
            resolve(response);
          }
        );
      });
    },
    [socket, connected, addTerminalEntry]
  );

  // Initialize socket connection
  useEffect(() => {
    // Clean up function that handles disconnection
    const cleanup = () => {
      if (socket) {
        socket.disconnect();
      }
    };

    addTerminalEntry(
      `Attempting to connect to ${SOCKET_SERVER_URL} (attempt ${connectionAttempts + 1})`
    );

    const newSocket = io(SOCKET_SERVER_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true,
    });

    setSocket(newSocket);

    // Socket event handlers
    newSocket.on('connect', () => {
      setConnected(true);
      setConnectionAttempts(0);
      addTerminalEntry(`Connected to server (ID: ${newSocket.id})`);

      setSystemStatus((prev) => ({
        ...prev,
        connected: true,
        lastUpdated: new Date().toISOString(),
      }));

      // Request initial status and ClearCore info
      newSocket.emit('command', { command: 'STATUS' });
      newSocket.emit('getClearCoreInfo');
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      addTerminalEntry(`Disconnected from server: ${reason}`);

      setSystemStatus((prev) => ({
        ...prev,
        connected: false,
        clearCoreStatus: 'Disconnected',
        lastUpdated: new Date().toISOString(),
      }));
    });

    // Add error handlers
    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setConnected(false);
      addTerminalEntry(`Connection error: ${error.message}`);

      setConnectionAttempts((prev) => prev + 1);
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

    // Handle async command responses - THIS IS THE CRITICAL FIX FOR HOMING COMPLETIONS
    newSocket.on('commandResponse', (data) => {
      console.log('Async commandResponse received:', data);
      handleCommandResponse(data);
    });

    // Handle ClearCore IP information
    newSocket.on('clearCoreInfo', (data) => {
      if (data && data.ipAddress) {
        setClearCoreIp(data.ipAddress);
        addTerminalEntry(`ClearCore IP: ${data.ipAddress}`);
      }
    });

    // Handle WebSocket events
    newSocket.on(
      'event',
      (data: { type: WebSocketEventType; payload: any }) => {
        const { type, payload } = data;

        switch (type) {
          case 'position_update':
            setPosition(payload);
            break;
          case 'status_change':
            setSystemStatus((prevStatus) => ({
              ...prevStatus,
              ...payload,
              lastUpdated: new Date().toISOString(),
            }));
            break;
          case 'scan_progress':
            if (payload.progress !== undefined) {
              setScanProgress(payload.progress);
            }
            if (payload.point) {
              setScanData((prev) => [...prev, payload.point]);
            }
            break;
          case 'error':
            addTerminalEntry(`Error: ${payload.message}`);
            break;
        }
      }
    );

    // Listen for system status updates
    newSocket.on('systemStatus', (data) => {
      console.log(`Received systemStatus update [${data._updateId}]:`, data);

      if (data.position) {
        setPosition(data.position);
      }

      setSystemStatus((prevStatus) => {
        // Only update if values actually changed to avoid unnecessary rerenders
        if (
          prevStatus.clearCoreStatus === data.clearCoreStatus &&
          prevStatus.rangefinderActive === data.rangefinderActive &&
          prevStatus.eStop === data.eStop &&
          prevStatus.servoStatus === data.servoStatus
        ) {
          return prevStatus; // No changes needed
        }

        // Return updated state if anything changed
        return {
          ...prevStatus,
          clearCoreStatus: data.clearCoreStatus,
          rangefinderActive: data.rangefinderActive,
          eStop: data.eStop,
          servoStatus: data.servoStatus,
          lastUpdated: new Date().toISOString(),
        };
      });
    });
    // Listen for terminal output
    newSocket.on('terminalOutput', (data) => {
      console.log('Received terminalOutput event:', data);
      setTerminalOutput(data);
    });

    // Listen for scan data
    newSocket.on('scanData', (data) => {
      setScanData((prev) => [...prev, data]);
    });

    return cleanup;
  }, [
    addTerminalEntry,
    connectionAttempts,
    SOCKET_SERVER_URL,
    handleCommandResponse,
  ]);

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
    clearScanData,
    clearCoreIp,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
