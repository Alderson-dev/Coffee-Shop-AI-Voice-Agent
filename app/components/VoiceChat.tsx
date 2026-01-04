"use client";

import { useState, useEffect, useRef } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import type { AgentStartResponse, ConnectionStatus } from "@/app/types/agora";

export default function VoiceChat() {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const timingRef = useRef<{
    startTime?: number;
    agentStarted?: number;
    channelJoined?: number;
    audioPublished?: number;
    firstAudioReceived?: number;
    lastAudioReceived?: number;
  }>({});

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
      console.error("Cleanup error:", err);
    }
  };

  const startConversation = async () => {
    setError(null);
    setStatus("connecting");

    try {
      // Reset timing data
      timingRef.current = {};
      const startTime = Date.now();
      timingRef.current.startTime = startTime;

      console.log(
        "🚀 [TIMING] Starting conversation at",
        new Date(startTime).toISOString(),
      );

      const channelName = `coffee-${Date.now()}`;

      // Time the agent start API call
      const agentStartRequestTime = Date.now();
      console.log("📡 [TIMING] Calling /api/agents/start...");

      const response = await fetch("/api/agents/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelName,
          userUid: 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start agent");
      }

      const data: AgentStartResponse = await response.json();
      const agentStartedTime = Date.now();
      timingRef.current.agentStarted = agentStartedTime;

      const agentStartDuration = agentStartedTime - agentStartRequestTime;
      console.log(`✅ [TIMING] Agent started in ${agentStartDuration}ms`);
      console.log(
        `   Total time from start: ${agentStartedTime - startTime}ms`,
      );

      setAgentId(data.agentId);

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // Set up event listener for when agent publishes audio
      client.on("user-published", async (user, mediaType) => {
        const audioReceivedTime = Date.now();

        if (!timingRef.current.firstAudioReceived) {
          timingRef.current.firstAudioReceived = audioReceivedTime;
          const timeToFirstAudio = audioReceivedTime - startTime;
          console.log(
            `🎤 [TIMING] First audio received from agent in ${timeToFirstAudio}ms`,
          );
          console.log(
            `   Time since agent started: ${audioReceivedTime - (timingRef.current.agentStarted || 0)}ms`,
          );
        } else {
          const timeSinceLastAudio = timingRef.current.lastAudioReceived
            ? audioReceivedTime - timingRef.current.lastAudioReceived
            : 0;
          console.log(
            `🎤 [TIMING] Audio published by agent (${timeSinceLastAudio}ms since last)`,
          );
        }

        timingRef.current.lastAudioReceived = audioReceivedTime;

        await client.subscribe(user, mediaType);
        if (mediaType === "audio") {
          const remoteAudioTrack = user.audioTrack;
          remoteAudioTrack?.play();
          console.log("🔊 [TIMING] Playing remote audio track");
        }
      });

      // Time channel join
      console.log("🔗 [TIMING] Joining Agora channel...");
      const channelJoinStartTime = Date.now();

      await client.join(
        data.appId,
        data.channelName,
        data.userToken,
        data.userUid,
      );

      const channelJoinedTime = Date.now();
      timingRef.current.channelJoined = channelJoinedTime;

      const channelJoinDuration = channelJoinedTime - channelJoinStartTime;
      console.log(`✅ [TIMING] Channel joined in ${channelJoinDuration}ms`);
      console.log(
        `   Total time from start: ${channelJoinedTime - startTime}ms`,
      );

      // Time microphone creation and publishing
      console.log("🎙️ [TIMING] Creating microphone track...");
      const micCreateStartTime = Date.now();

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      audioTrackRef.current = audioTrack;

      const micCreatedTime = Date.now();
      console.log(
        `✅ [TIMING] Microphone created in ${micCreatedTime - micCreateStartTime}ms`,
      );

      console.log("📤 [TIMING] Publishing audio track...");
      const publishStartTime = Date.now();

      await client.publish([audioTrack]);

      const audioPublishedTime = Date.now();
      timingRef.current.audioPublished = audioPublishedTime;

      const publishDuration = audioPublishedTime - publishStartTime;
      console.log(`✅ [TIMING] Audio published in ${publishDuration}ms`);
      console.log(
        `   Total time from start: ${audioPublishedTime - startTime}ms`,
      );

      console.log("🎉 [TIMING] === READY TO TALK ===");
      console.log(
        `   Total connection time: ${audioPublishedTime - startTime}ms`,
      );

      setStatus("connected");
    } catch (err) {
      console.error("❌ [TIMING] Error starting conversation:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start conversation",
      );
      setStatus("error");
      cleanup();
    }
  };

  const endConversation = async () => {
    setStatus("disconnecting");
    console.log("👋 [TIMING] Ending conversation");

    try {
      if (agentId) {
        const stopStartTime = Date.now();
        console.log("📡 [TIMING] Calling /api/agents/stop...");

        await fetch("/api/agents/stop", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ agentId }),
        });

        const stopEndTime = Date.now();
        console.log(
          `✅ [TIMING] Agent stopped in ${stopEndTime - stopStartTime}ms`,
        );
      }

      await cleanup();
      setAgentId(null);
      setStatus("idle");

      // Print summary
      if (timingRef.current.startTime && timingRef.current.firstAudioReceived) {
        console.log("📊 [TIMING] === SESSION SUMMARY ===");
        console.log(
          `   Time to first audio: ${timingRef.current.firstAudioReceived - timingRef.current.startTime}ms`,
        );
        if (timingRef.current.agentStarted) {
          console.log(
            `   Agent start latency: ${timingRef.current.agentStarted - timingRef.current.startTime}ms`,
          );
        }
        if (timingRef.current.channelJoined) {
          console.log(
            `   Channel join latency: ${timingRef.current.channelJoined - timingRef.current.startTime}ms`,
          );
        }
      }

      // Reset timing data
      timingRef.current = {};
    } catch (err) {
      console.error("❌ [TIMING] Error ending conversation:", err);
      setError(
        err instanceof Error ? err.message : "Failed to end conversation",
      );
      setStatus("error");
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "idle":
        return "Click to start talking";
      case "connecting":
        return "Connecting...";
      case "connected":
        return "Listening... speak now";
      case "disconnecting":
        return "Ending conversation...";
      case "error":
        return error || "An error occurred";
      default:
        return "";
    }
  };

  const isActive = status === "connected";
  const isDisabled = status === "connecting" || status === "disconnecting";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <button
          onClick={isActive ? endConversation : startConversation}
          disabled={isDisabled}
          className={`
            relative flex h-32 w-32 items-center justify-center rounded-full
            text-white transition-all duration-300 shadow-lg
            ${
              isActive
                ? "bg-red-500 hover:bg-red-600 active:scale-95"
                : "bg-blue-500 hover:bg-blue-600 active:scale-95"
            }
            ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl"}
          `}
        >
          <svg
            className={`h-12 w-12 ${isActive ? "animate-pulse" : ""}`}
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
            status === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          {getStatusText()}
        </p>

        {status === "error" && (
          <button
            onClick={() => {
              setError(null);
              setStatus("idle");
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
