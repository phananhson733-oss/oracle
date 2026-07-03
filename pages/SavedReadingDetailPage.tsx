// INPUT: react-router useParams/useNavigate, useLanguage/useTheme, savedReadingsClient (getSavedReading), LlmDoc 文档式排版原语。
// OUTPUT: Default-exported SavedReadingDetailPage — read-only render of one saved reading's output_json at /saved/:id.
// POS: backlog #24 consumption UI. Renders the saved snapshot via LlmDoc document flow (humanized section eyebrows + LlmProse paragraphs + LlmList lists) so any natal/cycle/synastry shape displays cleanly without re-calling the AI (no credit re-charge). Protected route. Update pages/FOLDER.md if added.

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Section,
  Card,
  ActionButton,
  useLanguage,
  useTheme,
} from "../components/UIComponents";
import {
  getSavedReading,
  type SavedReadingDetail,
  type SavedToolType,
} from "../services/savedReadingsClient";
import {
  LlmDoc,
  LlmSection,
  LlmField,
  LlmProse,
  LlmList,
  LLM_BODY_CLASS,
} from "../components/llm/LlmDoc";

// snake_case / camelCase key → human "Title Case" label.
const humanize = (key: string): string =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Keys that are internal/identifiers — not worth showing in a read-only view.
const SKIP_KEYS = new Set(["id", "cycle_id", "share_text", "hash", "version"]);

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// Recursively render an arbitrary saved-output value as document-flow JSX.
// Strings → LlmProse paragraphs, scalar arrays → LlmList, top-level object keys →
// hairline-separated LlmSection eyebrows, nested object keys → LlmField labels.
// No bordered boxes and no unbounded border-l indent chain.
const RenderValue: React.FC<{
  value: unknown;
  depth: number;
}> = ({ value, depth }) => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "string") {
    return <LlmProse text={value} />;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return <p className={LLM_BODY_CLASS}>{String(value)}</p>;
  }
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      return <LlmList items={value.map((v) => String(v))} />;
    }
    return (
      <div className="space-y-6">
        {value.map((v, i) => (
          <RenderValue key={i} value={v} depth={depth + 1} />
        ))}
      </div>
    );
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value).filter(
      ([k, v]) =>
        !SKIP_KEYS.has(k) && v !== null && v !== undefined && v !== "",
    );
    if (depth === 0) {
      return (
        <>
          {entries.map(([k, v], i) => (
            <LlmSection key={k} first={i === 0} eyebrow={humanize(k)}>
              <RenderValue value={v} depth={depth + 1} />
            </LlmSection>
          ))}
        </>
      );
    }
    return (
      <div className="space-y-5">
        {entries.map(([k, v]) => (
          <LlmField key={k} label={humanize(k)}>
            <RenderValue value={v} depth={depth + 1} />
          </LlmField>
        ))}
      </div>
    );
  }
  return null;
};

const SavedReadingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const [reading, setReading] = useState<SavedReadingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const s = t.saved;
  const mutedText = isDark ? "text-star-400" : "text-paper-500";
  const borderMuted = isDark ? "border-gold-500/20" : "border-paper-200";

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);
    getSavedReading(id)
      .then((r) => {
        if (active) setReading(r);
      })
      .catch(() => {
        if (active) setError(s?.not_found || "This reading was not found.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // Only the reading id drives a refetch; the i18n fallback string is read
    // in the catch handler at error time, not a fetch dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const typeLabel = useMemo(() => {
    if (!reading) return "";
    const map: Record<SavedToolType, string | undefined> = {
      natal: s?.type_natal,
      cycle: s?.type_cycle,
      synastry: s?.type_synastry,
    };
    return map[reading.toolType] || reading.toolType;
  }, [reading, s]);

  const dateLabel = useMemo(() => {
    if (!reading) return "";
    const d = new Date(reading.createdAt);
    if (Number.isNaN(d.getTime())) return reading.createdAt;
    return d.toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [reading, language]);

  return (
    <Container>
      <div className="py-6">
        <ActionButton
          variant="ghost"
          size="sm"
          onClick={() => navigate("/saved")}
        >
          ‹ {s?.back || "Back to saved"}
        </ActionButton>
      </div>

      {loading ? (
        <p className={mutedText}>{s?.loading || "Loading…"}</p>
      ) : error || !reading ? (
        <p className="text-rose-500">{error || s?.not_found || "Not found."}</p>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-serif font-semibold mb-1">
              {reading.title}
            </h1>
            <p className={`text-sm ${mutedText}`}>
              {typeLabel} · {s?.saved_on || "Saved"} {dateLabel}
            </p>
          </div>
          <Section>
            <Card className={`p-6 border ${borderMuted}`}>
              <LlmDoc>
                <RenderValue value={reading.outputJson} depth={0} />
              </LlmDoc>
            </Card>
          </Section>
        </>
      )}
    </Container>
  );
};

export default SavedReadingDetailPage;
