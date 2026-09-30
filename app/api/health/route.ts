import { NextResponse } from "next/server";
import { getSession } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let databaseConfigured = Boolean(process.env.DATABASE_URL);
  let databaseReachable = false;

  if (databaseConfigured) {
    try {
      await getSession("00000000-0000-0000-0000-000000000000");
      databaseReachable = true;
    } catch {
      databaseReachable = false;
    }
  }

  const aiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const ok = databaseConfigured && databaseReachable && aiConfigured;

  return NextResponse.json(
    {
      ok,
      service: "myassistant-a1",
      aiConfigured,
      databaseConfigured,
      databaseReachable,
      timestamp: new Date().toISOString()
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
