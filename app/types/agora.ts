export interface AgentStartResponse {
  success: boolean;
  agentId: string;
  channelName: string;
  userToken: string;
  appId: string;
  userUid: number;
  agentUid: number;
}

export interface AgentStopResponse {
  success: boolean;
  message: string;
}

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'disconnecting';
