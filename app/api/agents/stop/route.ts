import { NextRequest, NextResponse } from "next/server";

function generateBasicAuth(customerId: string, customerSecret: string): string {
  const credentials = `${customerId}:${customerSecret}`;
  return Buffer.from(credentials).toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 },
      );
    }

    const appId = process.env.AGORA_APP_ID;
    const customerId = process.env.AGORA_CUSTOMER_ID;
    const customerSecret = process.env.AGORA_CUSTOMER_SECRET;

    if (!appId || !customerId || !customerSecret) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 },
      );
    }

    const basicAuth = generateBasicAuth(customerId, customerSecret);
    const agoraApiUrl = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/agents/${agentId}/leave`;

    const agoraResponse = await fetch(agoraApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
    });

    if (!agoraResponse.ok) {
      const errorText = await agoraResponse.text();
      console.error("Agora API error:", errorText);
      return NextResponse.json(
        { error: "Failed to stop agent", details: errorText },
        { status: agoraResponse.status },
      );
    }

    const agoraData = await agoraResponse.json();

    return NextResponse.json({
      success: true,
      message: "Agent stopped successfully",
      data: agoraData,
    });
  } catch (error) {
    console.error("Error stopping agent:", error);
    return NextResponse.json(
      {
        error: "Failed to stop agent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
