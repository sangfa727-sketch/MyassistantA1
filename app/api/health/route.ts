import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "myassistant-a1",
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    timestamp: new Date().toISOString()
  });
}
