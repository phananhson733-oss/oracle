// INPUT: authFetch (authClient), VITE_API_BASE_URL.
// OUTPUT: CRUD client for /api/saved-readings — saveReading / listSavedReadings / getSavedReading / deleteSavedReading + types.
// POS: backlog #24 frontend data client for durable readings. Synastry payloads must arrive name-free (the page aliases partner names before calling saveReading; the backend also strips nameA/nameB). Update services/FOLDER.md on change.

import { authFetch } from "./authClient";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001/api" : "/api");

export type SavedToolType = "natal" | "cycle" | "synastry";

export interface SavedReadingSummary {
  id: string;
  toolType: SavedToolType;
  title: string;
  lang: string;
  createdAt: string;
}

export interface SavedReadingDetail extends SavedReadingSummary {
  inputJson: Record<string, unknown>;
  outputJson: Record<string, unknown>;
}

export interface SaveReadingInput {
  tool_type: SavedToolType;
  title: string;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown>;
  lang: string;
}

const failWith = async (res: Response, fallback: string): Promise<never> => {
  const body = await res.json().catch(() => ({}) as { error?: string });
  throw new Error(body.error || fallback);
};

export async function saveReading(
  input: SaveReadingInput,
): Promise<{ id: string; createdAt: string }> {
  const res = await authFetch(`${API_BASE}/saved-readings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return failWith(res, "Failed to save reading");
  return res.json();
}

export async function listSavedReadings(): Promise<SavedReadingSummary[]> {
  const res = await authFetch(`${API_BASE}/saved-readings`, { method: "GET" });
  if (!res.ok) return failWith(res, "Failed to load saved readings");
  const data = await res.json();
  return (data.readings || []) as SavedReadingSummary[];
}

export async function getSavedReading(id: string): Promise<SavedReadingDetail> {
  const res = await authFetch(
    `${API_BASE}/saved-readings/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
  if (!res.ok) return failWith(res, "Failed to load reading");
  const data = await res.json();
  return data.reading as SavedReadingDetail;
}

export async function deleteSavedReading(id: string): Promise<void> {
  const res = await authFetch(
    `${API_BASE}/saved-readings/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (!res.ok) await failWith(res, "Failed to delete reading");
}
