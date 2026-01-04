import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if critical environment variables are set
    const llmProvider = process.env.LLM_PROVIDER || "groq";

    const envVarsSet = {
      AGORA_APP_ID: !!process.env.AGORA_APP_ID,
      AGORA_APP_CERTIFICATE: !!process.env.AGORA_APP_CERTIFICATE,
      AGORA_CUSTOMER_ID: !!process.env.AGORA_CUSTOMER_ID,
      AGORA_CUSTOMER_SECRET: !!process.env.AGORA_CUSTOMER_SECRET,
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      LLM_PROVIDER: !!process.env.LLM_PROVIDER,
    };

    // Check for required API keys based on provider
    const requiredKeys = [
      "AGORA_APP_ID",
      "AGORA_APP_CERTIFICATE",
      "AGORA_CUSTOMER_ID",
      "AGORA_CUSTOMER_SECRET",
    ];

    if (llmProvider === "groq") {
      requiredKeys.push("GROQ_API_KEY");
    } else if (llmProvider === "openai") {
      requiredKeys.push("OPENAI_API_KEY");
    }

    // OpenAI key is always required for TTS
    if (!requiredKeys.includes("OPENAI_API_KEY")) {
      requiredKeys.push("OPENAI_API_KEY");
    }

    const missingKeys = requiredKeys.filter(
      (key) => !envVarsSet[key as keyof typeof envVarsSet],
    );

    if (missingKeys.length > 0) {
      return NextResponse.json(
        {
          status: "unhealthy",
          message: "Missing required environment variables",
          missingKeys,
          environment: envVarsSet,
          llmProvider,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: "healthy",
      message: "Service is running",
      llmProvider,
      environment: envVarsSet,
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
      { status: 503 },
    );
  }
}
