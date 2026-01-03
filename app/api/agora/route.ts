import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";

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
  expireTime: number,
  privilegeExpire: number
): string {
  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    expireTime,
    privilegeExpire
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelName, uid, role = "publisher", expireTime = 3600 } = body;

    if (!channelName) {
      return NextResponse.json(
        { error: "channelName is required" },
        { status: 400 }
      );
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const customerId = process.env.AGORA_CUSTOMER_ID;
    const customerSecret = process.env.AGORA_CUSTOMER_SECRET;

    if (!appId || !appCertificate || !customerId || !customerSecret) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 }
      );
    }

    const rtcRole =
      role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const uidValue = uid || 0;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTimestamp + expireTime;

    const token = generateRtcToken(
      appId,
      appCertificate,
      channelName,
      uidValue,
      rtcRole,
      expireTime,
      privilegeExpireTime
    );

    const basicAuth = generateBasicAuth(customerId, customerSecret);

    return NextResponse.json({
      token,
      appId,
      channelName,
      uid: uidValue,
      expireTime: privilegeExpireTime,
      basicAuth,
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
