// System Types
export interface SystemStatus {
  connected: boolean;
  clearCoreStatus: string;
  rangefinderActive: boolean;
  eStop: boolean;
  servoStatus: string;
  firmwareVersion: string;
  lastUpdated: string;
}

export interface Position {
  x: number;
  y: number;
  z: number;
  pan: number;
  tilt: number;
}

// Map Types
export interface ScanRegion {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  step: number;
  estimatedTime: number;
  status: 'pending' | 'in-progress' | 'paused' | 'completed' | 'cancelled';
}

export interface NoGoRegion {
  id: string;
  type: 'rectangle' | 'circle' | 'polygon';
  points: { x: number; y: number }[];
  color: string;
}

// Metadata Types
export interface ShowMetadata {
  title: string;
  artist: string;
  date: string;
  materials: string;
  dimensions: string;
  description: string;
}

// Backdrop Types
export type BackdropType = 'natural' | 'physical' | 'chroma-key' | 'solid-color' | '3d-skybox';

export interface BackdropSettings {
  type: BackdropType;
  chromaKeyTransparency: number;
  solidColor: string;
  skyboxSelection: string;
}

// Configuration Types
export type ConfigKeyType = 'string' | 'number' | 'boolean';

export interface ConfigKey {
  key: string;
  value: string;
  type: ConfigKeyType;
  category: string;
}

export interface ConfigValue {
  key: string;
  value: string | number;
  type: 'string' | 'number' | 'boolean';
  category: 'system' | 'motion' | 'rangefinder' | 'servo' | 'homing';
  description: string;
}

// WebSocket Event Types
export type WebSocketEventType = 
  | 'position_update'
  | 'status_change'
  | 'scan_progress'
  | 'error'
  | 'command_response'
  | 'connection_status';

export interface WebSocketEvent {
  type: WebSocketEventType;
  payload: any;
  timestamp: string;
}

// Command Types
export interface Command {
  type: string;
  parameters: Record<string, any>;
}

export interface CommandResponse {
  success: boolean;
  message: string;
  data?: any;
}