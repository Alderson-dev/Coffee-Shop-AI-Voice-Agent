import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check if critical environment variables are set
    const envVarsSet = {
      AGORA_APP_ID: !!process.env.AGORA_APP_ID,
      AGORA_APP_CERTIFICATE: !!process.env.AGORA_APP_CERTIFICATE,
      AGORA_CUSTOMER_ID: !!process.env.AGORA_CUSTOMER_ID,
      AGORA_CUSTOMER_SECRET: !!process.env.AGORA_CUSTOMER_SECRET,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    };

    const allEnvVarsSet = Object.values(envVarsSet).every(
      (value) => value === true
    );

    if (!allEnvVarsSet) {
      return NextResponse.json(
        {
          status: "unhealthy",
          message: "Missing required environment variables",
          envVars: envVarsSet,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      message: "Service is running",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
