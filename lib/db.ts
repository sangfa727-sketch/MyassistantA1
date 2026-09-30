import { neon } from "@neondatabase/serverless";

let sqlClient: ReturnType<typeof neon> | null = null;

function getSql() {
  if (!sqlClient) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not configured.");
    sqlClient = neon(url);
  }
  return sqlClient;
}

export type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export async function createSession() {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO a1_sessions (memory)
    VALUES ('{}'::jsonb)
    RETURNING id, memory, created_at, updated_at
  `;
  return rows[0];
}

export async function getSession(sessionId: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, memory, created_at, updated_at
    FROM a1_sessions
    WHERE id = ${sessionId}::uuid
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function updateSessionMemory(sessionId: string, memory: Record<string, unknown>) {
  const sql = getSql();
  const rows = await sql`
    UPDATE a1_sessions
    SET memory = ${JSON.stringify(memory)}::jsonb, updated_at = now()
    WHERE id = ${sessionId}::uuid
    RETURNING id, memory, updated_at
  `;
  return rows[0] ?? null;
}

export async function getRecentMessages(sessionId: string, limit = 20): Promise<StoredMessage[]> {
  const sql = getSql();
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 50);
  const rows = await sql`
    SELECT id, role, content, created_at
    FROM a1_messages
    WHERE session_id = ${sessionId}::uuid
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;
  return rows.reverse() as StoredMessage[];
}

export async function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO a1_messages (session_id, role, content)
    VALUES (${sessionId}::uuid, ${role}, ${content})
    RETURNING id, role, content, created_at
  `;
  return rows[0] as StoredMessage;
}
