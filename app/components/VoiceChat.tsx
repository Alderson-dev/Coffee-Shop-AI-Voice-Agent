'use client';

import { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import type {
  AgentStartResponse,
  ConnectionStatus,
} from '@/app/types/agora';

export default function VoiceChat() {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = async () => {
    try {
      if (audioTrackRef.current) {
        audioTrackRef.current.close();
        audioTrackRef.current = null;
      }

      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  };

  const startConversation = async () => {
    setError(null);
    setStatus('connecting');

    try {
      const channelName = `coffee-${Date.now()}`;

      const response = await fetch('/api/agents/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelName,
          userUid: 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start agent');
      }

      const data: AgentStartResponse = await response.json();
      setAgentId(data.agentId);

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          remoteAudioTrack?.play();
        }
      });

      await client.join(
        data.appId,
        data.channelName,
        data.userToken,
        data.userUid
      );

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      audioTrackRef.current = audioTrack;

      await client.publish([audioTrack]);

      setStatus('connected');
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
      setStatus('error');
      cleanup();
    }
  };

  const endConversation = async () => {
    setStatus('disconnecting');

    try {
      if (agentId) {
        await fetch('/api/agents/stop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agentId }),
        });
      }

      await cleanup();
      setAgentId(null);
      setStatus('idle');
    } catch (err) {
      console.error('Error ending conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to end conversation');
      setStatus('error');
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Click to start talking';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Listening... speak now';
      case 'disconnecting':
        return 'Ending conversation...';
      case 'error':
        return error || 'An error occurred';
      default:
        return '';
    }
  };

  const isActive = status === 'connected';
  const isDisabled = status === 'connecting' || status === 'disconnecting';

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <button
          onClick={isActive ? endConversation : startConversation}
          disabled={isDisabled}
          className={`
            relative flex h-32 w-32 items-center justify-center rounded-full
            text-white transition-all duration-300 shadow-lg
            ${isActive
              ? 'bg-red-500 hover:bg-red-600 active:scale-95'
              : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
            }
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
          `}
        >
          <svg
            className={`h-12 w-12 ${isActive ? 'animate-pulse' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isActive ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            )}
          </svg>
        </button>

        {isActive && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
          </span>
        )}
      </div>

      <div className="text-center">
        <p
          className={`text-lg font-medium ${
            status === 'error'
              ? 'text-red-600 dark:text-red-400'
              : 'text-zinc-700 dark:text-zinc-300'
          }`}
        >
          {getStatusText()}
        </p>

        {status === 'error' && (
          <button
            onClick={() => {
              setError(null);
              setStatus('idle');
            }}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
