import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT = 12_000;
const MAX_TASKS = 8;
const MAX_TITLE = 180;
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const buckets = new Map<string, { count: number; resetAt: number }>();

function keyOf(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

function allowed(key: string) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= MAX_REQUESTS;
}

function cleanTitle(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_TITLE);
}

export async function POST(request: NextRequest) {
  if (!allowed(keyOf(request))) {
    return NextResponse.json({ error: "Task planner rate limit reached. Please try again shortly." }, { status: 429 });
  }

  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  if (!key) return NextResponse.json({ error: "A1 backend is not configured." }, { status: 503 });

  try {
    const body = await request.json();
    const input = typeof body?.text === "string" ? body.text.trim().slice(0, MAX_INPUT) : "";
    if (!input) return NextResponse.json({ error: "Text is required." }, { status: 400 });

    const response = await fetch(baseUrl + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: "You are A1 task planner. Convert the user request into a short actionable task list. Return only JSON with a tasks array containing title fields. Create at most 8 tasks. Keep each title under 180 characters. If the request is not actionable, return an empty tasks array."
          },
          { role: "user", content: input }
        ],
        response_format: { type: "json_object" }
      }),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store"
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: "AI task planner request failed." }, { status: 502 });

    const raw = data?.choices?.[0]?.message?.content;
    let parsed: unknown;
    try { parsed = JSON.parse(typeof raw === "string" ? raw : "{}"); } catch { parsed = {}; }

    const source = parsed && typeof parsed === "object" && Array.isArray((parsed as any).tasks)
      ? (parsed as any).tasks
      : [];

    const tasks = source
      .slice(0, MAX_TASKS)
      .map((item: any) => cleanTitle(item?.title))
      .filter(Boolean);

    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ error: "A1 could not create tasks." }, { status: 500 });
  }
}
