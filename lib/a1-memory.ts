export type A1Memory = {
  preferredLanguage?: string;
  responseStyle?: "concise" | "detailed";
  userName?: string;
  notes?: string[];
};

const STORAGE_KEY = "a1-memory";

export function loadMemory(): A1Memory {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveMemory(memory: A1Memory) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

export function clearMemory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function memorySummary(memory: A1Memory) {
  const parts: string[] = [];
  if (memory.userName) parts.push(`User name: ${memory.userName}`);
  if (memory.preferredLanguage) parts.push(`Preferred language: ${memory.preferredLanguage}`);
  if (memory.responseStyle) parts.push(`Response style: ${memory.responseStyle}`);
  if (memory.notes?.length) parts.push(`User notes: ${memory.notes.slice(0, 5).join("; ")}`);
  return parts.join("\n");
}
