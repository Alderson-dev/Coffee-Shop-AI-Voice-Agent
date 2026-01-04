import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";

// Feature flag: Switch between 'groq' and 'openai'
const LLM_PROVIDER = (process.env.LLM_PROVIDER || "groq") as "groq" | "openai";

function generateBasicAuth(customerId: string, customerSecret: string): string {
  const credentials = `${customerId}:${customerSecret}`;
  return Buffer.from(credentials).toString("base64");
}

function generateRtcToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  role: number,
  tokenExpire: number,
  privilegeExpire: number,
): string {
  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    tokenExpire,
    privilegeExpire,
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelName, userUid = 0 } = body;

    if (!channelName) {
      return NextResponse.json(
        { error: "channelName is required" },
        { status: 400 },
      );
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const customerId = process.env.AGORA_CUSTOMER_ID;
    const customerSecret = process.env.AGORA_CUSTOMER_SECRET;

    if (!appId || !appCertificate || !customerId || !customerSecret) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 },
      );
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const tokenExpire = 3600;
    const privilegeExpireTime = currentTimestamp + 3600;

    // Generate RTC token for user
    const userToken = generateRtcToken(
      appId,
      appCertificate,
      channelName,
      userUid,
      RtcRole.PUBLISHER,
      tokenExpire,
      privilegeExpireTime,
    );

    // Generate RTC token for agent (using UID 1)
    const agentUid = 1;
    const agentToken = generateRtcToken(
      appId,
      appCertificate,
      channelName,
      agentUid,
      RtcRole.PUBLISHER,
      tokenExpire,
      privilegeExpireTime,
    );

    const basicAuth = generateBasicAuth(customerId, customerSecret);

    // Call Agora API to start the agent (v2 join endpoint)
    const agoraApiUrl = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/join`;

    // Generate unique agent name
    const agentName = `coffee-agent-${Date.now()}`;

    const agentConfig = {
      name: agentName,
      properties: {
        channel: channelName,
        token: agentToken,
        agent_rtc_uid: String(agentUid),
        remote_rtc_uids: [String(userUid)],
        enable_string_uid: false,
        idle_timeout: 120,
        asr: {
          language: "en-US",
        },
        llm:
          LLM_PROVIDER === "groq"
            ? {
                url: "https://api.groq.com/openai/v1/chat/completions",
                api_key: process.env.GROQ_API_KEY || "",
                system_messages: [
                  {
                    role: "system",
                    content:
                      "You are a helpful coffee shop order taking assistant. Be friendly and concise, please take orders for coffee and tea and confirm each item after the user has finished speaking.",
                  },
                ],
                max_history: 32,
                greeting_message:
                  "Hello! Welcome to HighBrew Coffee Shop. How can I help you today?",
                failure_message: "Please hold on a second.",
                params: {
                  model: "openai/gpt-oss-20b",
                },
              }
            : {
                url: "https://api.openai.com/v1/chat/completions",
                api_key: process.env.OPENAI_API_KEY || "",
                system_messages: [
                  {
                    role: "system",
                    content:
                      "You are a helpful coffee shop order taking assistant. Be friendly and concise, please take orders for coffee and tea and confirm each item after the user has finished speaking.",
                  },
                ],
                max_history: 32,
                greeting_message:
                  "Hello! Welcome to HighBrew Coffee Shop. How can I help you today?",
                failure_message: "Please hold on a second.",
                params: {
                  model: "gpt-4o-mini",
                },
              },
        tts: {
          vendor: "openai",
          params: {
            api_key: process.env.OPENAI_API_KEY || "",
            voice: "alloy",
          },
        },
      },
    };

    // Log the request for debugging
    console.log("=== Agora API Request ===");
    console.log("🤖 LLM Provider:", LLM_PROVIDER.toUpperCase());
    console.log("URL:", agoraApiUrl);
    console.log("Agent Name:", agentName);
    console.log("Full Config:", JSON.stringify(agentConfig, null, 2));
    console.log("========================");

    const agoraResponse = await fetch(agoraApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(agentConfig),
    });

    if (!agoraResponse.ok) {
      const errorText = await agoraResponse.text();
      console.error("=== Agora API Error ===");
      console.error("Status:", agoraResponse.status);
      console.error("Response:", errorText);
      console.error("Request was:", JSON.stringify(agentConfig, null, 2));
      console.error("======================");
      return NextResponse.json(
        { error: "Failed to start agent", details: errorText },
        { status: agoraResponse.status },
      );
    }

    const agoraData = await agoraResponse.json();

    return NextResponse.json({
      success: true,
      agentId: agoraData.agent_id || agoraData.agentId,
      channelName,
      userToken,
      appId,
      userUid,
      agentUid,
    });
  } catch (error) {
    console.error("Error starting agent:", error);
    return NextResponse.json(
      {
        error: "Failed to start agent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
