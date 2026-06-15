// INPUT: express, supabase service-role client, auth middleware (authMiddleware/requireAuth), logger.
// OUTPUT: savedReadingsRouter — authed CRUD for durable user readings (POST save / GET list / GET :id own / DELETE :id own).
// POS: backlog #24 retention. Highest-PII route: birth inputs persisted under RLS, user-id isolation enforced on EVERY query (userId from JWT, never body/params); synastry partner names stripped defensively (privacy red line #4); error logs never include the body (red line #3). Update backend/src/api/FOLDER.md + docs/PRD.md §4.3/§4.4 on change.

import { Router, Request, Response } from "express";
import { supabase, isSupabaseConfigured } from "../db/supabase.js";
import { authMiddleware, requireAuth } from "./auth.js";
import { logger } from "../utils/logger.js";

export const savedReadingsRouter = Router();

const TOOL_TYPES = new Set(["natal", "cycle", "synastry"]);
const MAX_TITLE_LEN = 200;
// Per-JSON-column cap (~64KB) — a saved reading is a structured snapshot, not
// a blob. Stays under the global express.json() 100KB limit so this handler
// (not the body parser) owns the meaningful boundary with a stable error code.
const MAX_PAYLOAD_BYTES = 64_000;
// Synastry partner real names must NEVER persist server-side (privacy red
// line #4). The client aliases them to "Person A/B"; we additionally drop
// these explicit keys at any depth as defense in depth.
const NAME_KEYS = new Set(["nameA", "nameB"]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// Supabase 错误对象不是原生 Error（logger 的 Error 展开只抓 name/message/stack），
// 显式提取 message/code/details 便于远程诊断失败原因；均为错误元数据，非用户 PII（红线#3）。
const errorFields = (
  error: unknown,
): { message?: unknown; code?: unknown; details?: unknown } => {
  const e = error as
    | { message?: unknown; code?: unknown; details?: unknown }
    | null
    | undefined;
  return { message: e?.message, code: e?.code, details: e?.details };
};

const jsonBytes = (v: unknown): number =>
  Buffer.byteLength(JSON.stringify(v) ?? "", "utf8");

// Deep clone that drops partner-name keys at any depth. Never strips generic
// keys — only the unambiguous synastry name fields — so natal/cycle payloads
// are untouched.
const stripNames = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripNames);
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (NAME_KEYS.has(k)) continue;
      out[k] = stripNames(v);
    }
    return out;
  }
  return value;
};

const unavailable = (res: Response) =>
  res
    .status(503)
    .json({ error: "Service unavailable", code: "SERVICE_UNAVAILABLE" });

// POST / — save a reading. userId from the authenticated session only.
savedReadingsRouter.post(
  "/",
  authMiddleware,
  requireAuth,
  async (req: Request, res: Response) => {
    if (!isSupabaseConfigured()) return unavailable(res);
    const userId = req.userId!;
    const body = (req.body || {}) as Record<string, unknown>;
    const toolType = typeof body.tool_type === "string" ? body.tool_type : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const lang = typeof body.lang === "string" ? body.lang.slice(0, 5) : "en";
    const inputJson = body.input_json;
    const outputJson = body.output_json;

    if (!TOOL_TYPES.has(toolType)) {
      return res
        .status(400)
        .json({ error: "Invalid reading type", code: "INVALID_TOOL_TYPE" });
    }
    if (!title || title.length > MAX_TITLE_LEN) {
      return res
        .status(400)
        .json({ error: "Invalid title", code: "INVALID_TITLE" });
    }
    if (!isPlainObject(inputJson) || !isPlainObject(outputJson)) {
      return res
        .status(400)
        .json({ error: "Invalid reading payload", code: "INVALID_PAYLOAD" });
    }
    if (
      jsonBytes(inputJson) > MAX_PAYLOAD_BYTES ||
      jsonBytes(outputJson) > MAX_PAYLOAD_BYTES
    ) {
      return res
        .status(413)
        .json({ error: "Reading too large", code: "PAYLOAD_TOO_LARGE" });
    }

    try {
      const { data, error } = await supabase
        .from("saved_readings")
        .insert({
          user_id: userId,
          tool_type: toolType,
          title,
          input_json: stripNames(inputJson),
          output_json: stripNames(outputJson),
          lang,
        })
        .select("id, created_at")
        .single();
      if (error) throw error;
      return res.status(201).json({ id: data.id, createdAt: data.created_at });
    } catch (error) {
      // Never log the body — input_json holds birth data (privacy red line #3).
      logger.error("Save reading failed", {
        userId,
        toolType,
        ...errorFields(error),
      });
      return res
        .status(500)
        .json({ error: "Failed to save reading", code: "SAVE_FAILED" });
    }
  },
);

// GET / — list the caller's readings (metadata only; full payload is GET /:id).
savedReadingsRouter.get(
  "/",
  authMiddleware,
  requireAuth,
  async (req: Request, res: Response) => {
    if (!isSupabaseConfigured()) return unavailable(res);
    const userId = req.userId!;
    try {
      const { data, error } = await supabase
        .from("saved_readings")
        .select("id, tool_type, title, lang, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return res.json({
        readings: (data || []).map((r) => ({
          id: r.id,
          toolType: r.tool_type,
          title: r.title,
          lang: r.lang,
          createdAt: r.created_at,
        })),
      });
    } catch (error) {
      logger.error("List readings failed", { userId, ...errorFields(error) });
      return res
        .status(500)
        .json({ error: "Failed to list readings", code: "LIST_FAILED" });
    }
  },
);

// GET /:id — read one of the caller's readings (full payload). Ownership is
// enforced by the user_id filter: another user's id simply returns 404.
savedReadingsRouter.get(
  "/:id",
  authMiddleware,
  requireAuth,
  async (req: Request, res: Response) => {
    if (!isSupabaseConfigured()) return unavailable(res);
    const userId = req.userId!;
    const { id } = req.params;
    if (!UUID_RE.test(id)) {
      return res.status(400).json({ error: "Invalid id", code: "INVALID_ID" });
    }
    try {
      const { data, error } = await supabase
        .from("saved_readings")
        .select(
          "id, tool_type, title, input_json, output_json, lang, created_at",
        )
        .eq("user_id", userId)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return res
          .status(404)
          .json({ error: "Reading not found", code: "NOT_FOUND" });
      }
      return res.json({
        reading: {
          id: data.id,
          toolType: data.tool_type,
          title: data.title,
          inputJson: data.input_json,
          outputJson: data.output_json,
          lang: data.lang,
          createdAt: data.created_at,
        },
      });
    } catch (error) {
      logger.error("Get reading failed", { userId, ...errorFields(error) });
      return res
        .status(500)
        .json({ error: "Failed to get reading", code: "GET_FAILED" });
    }
  },
);

// DELETE /:id — delete one of the caller's readings. 404 if it does not exist
// or belongs to someone else (the user_id filter never matches another user).
savedReadingsRouter.delete(
  "/:id",
  authMiddleware,
  requireAuth,
  async (req: Request, res: Response) => {
    if (!isSupabaseConfigured()) return unavailable(res);
    const userId = req.userId!;
    const { id } = req.params;
    if (!UUID_RE.test(id)) {
      return res.status(400).json({ error: "Invalid id", code: "INVALID_ID" });
    }
    try {
      const { data, error } = await supabase
        .from("saved_readings")
        .delete()
        .eq("user_id", userId)
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        return res
          .status(404)
          .json({ error: "Reading not found", code: "NOT_FOUND" });
      }
      return res.json({ success: true });
    } catch (error) {
      logger.error("Delete reading failed", { userId, ...errorFields(error) });
      return res
        .status(500)
        .json({ error: "Failed to delete reading", code: "DELETE_FAILED" });
    }
  },
);
