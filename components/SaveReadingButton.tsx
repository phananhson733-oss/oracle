// INPUT: useAuth (isAuthenticated/openLoginModal), useLanguage, savedReadingsClient.saveReading.
// OUTPUT: <SaveReadingButton> — reusable Save control for a natal/cycle/synastry result view (sign-in gate, saving/done states).
// POS: backlog #24 producer UI. Pages pass already-loaded input/output; for synastry the page MUST pass name-free payloads (real names stay client-side — privacy red line #4). Update components/FOLDER.md if added.

import React, { useState } from "react";
import { ActionButton, useLanguage } from "./UIComponents";
import { useAuth } from "../contexts/AuthContext";
import {
  saveReading,
  type SavedToolType,
} from "../services/savedReadingsClient";

interface SaveReadingButtonProps {
  toolType: SavedToolType;
  title: string;
  inputJson: Record<string, unknown>;
  outputJson: Record<string, unknown>;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost";
  className?: string;
  // Optional builder run at click time to assemble the FINAL payload — used
  // when some data loads lazily (e.g. cycle names). It computes fresh values
  // and returns them directly, avoiding stale-closure capture of props. When
  // provided it overrides inputJson/outputJson.
  prepare?: () => Promise<{
    inputJson: Record<string, unknown>;
    outputJson: Record<string, unknown>;
  }>;
}

type Status = "idle" | "saving" | "done" | "error";

const SaveReadingButton: React.FC<SaveReadingButtonProps> = ({
  toolType,
  title,
  inputJson,
  outputJson,
  size = "sm",
  variant = "secondary",
  className,
  prepare,
}) => {
  const { t, language } = useLanguage();
  const { isAuthenticated, openLoginModal } = useAuth();
  const [status, setStatus] = useState<Status>("idle");

  const s = t.saved;

  const handleClick = async () => {
    if (!isAuthenticated) {
      openLoginModal(s?.sign_in_to_save || "Sign in to save");
      return;
    }
    if (status === "saving" || status === "done") return;
    setStatus("saving");
    try {
      const payload = prepare
        ? await prepare()
        : { inputJson, outputJson };
      await saveReading({
        tool_type: toolType,
        title,
        input_json: payload.inputJson,
        output_json: payload.outputJson,
        lang: language === "zh" ? "zh" : "en",
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const label =
    status === "saving"
      ? s?.saving || "Saving…"
      : status === "done"
        ? s?.save_done || "Saved"
        : status === "error"
          ? s?.save_error || "Couldn't save"
          : isAuthenticated
            ? s?.save || "Save"
            : s?.sign_in_to_save || "Sign in to save";

  return (
    <ActionButton
      size={size}
      variant={variant}
      className={className}
      disabled={status === "saving"}
      onClick={handleClick}
      ariaLabel={s?.save || "Save"}
    >
      {status === "done" ? `✓ ${label}` : label}
    </ActionButton>
  );
};

export default SaveReadingButton;
