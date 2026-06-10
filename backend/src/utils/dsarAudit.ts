// INPUT: logger (structured logger), hashInput (SHA-256, cache/strategy).
// OUTPUT: logDsarEvent(event, userId) + dsarUserRef(userId) — sanitized DSAR compliance audit trail.
// POS: backlog #26. Called by the auth export/erase handlers so every data-subject request leaves an auditable record. The user reference is HASHED — the plaintext auth id (a sensitive identifier per CLAUDE.md 隐私红线 #3) never lands in logs. Update backend/src/utils/FOLDER.md on change.

import { logger } from "./logger.js";
import { hashInput } from "../cache/strategy.js";

export type DsarEvent = "data_export" | "account_erasure";

// Pseudonymous, stable reference: lets the audit trail correlate a single
// user's DSAR actions without exposing the plaintext auth id in logs.
export const dsarUserRef = (userId: string): string =>
  hashInput(userId).slice(0, 16);

// Emit one structured compliance line. The logger adds the timestamp; we add
// only the event kind + the hashed user reference — never PII or the raw id.
export function logDsarEvent(event: DsarEvent, userId: string): void {
  logger.info("dsar_request", { event, userRef: dsarUserRef(userId) });
}
