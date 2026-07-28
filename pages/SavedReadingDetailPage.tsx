// INPUT: react-router useParams/useNavigate, useLanguage/useTheme, savedReadingsClient (getSavedReading).
// OUTPUT: Default-exported SavedReadingDetailPage — read-only render of one saved reading's output_json at /saved/:id.
// POS: backlog #24 consumption UI. Renders the saved snapshot generically (humanized headings + paragraphs + lists) so any natal/cycle/synastry shape displays cleanly without re-calling the AI (no credit re-charge). Protected route. Update pages/FOLDER.md if added.

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

// Recursively render an arbitrary saved-output value as readable JSX. Strings →
// paragraphs, string arrays → bullet lists, objects → labeled sub-sections.
const RenderValue: React.FC<{
  value: unknown;
  depth: number;
  muted: string;
}> = ({ value, depth, muted }) => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "string") {
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
    );
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return <p className="text-sm">{String(value)}</p>;
  }
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      return (
        <ul className="list-disc pl-5 space-y-1">
          {value.map((v, i) => (
            <li key={i} className="text-sm">
              {String(v)}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div className="space-y-3">
        {value.map((v, i) => (
          <div key={i} className={`pl-3 border-l ${muted}`}>
            <RenderValue value={v} depth={depth + 1} muted={muted} />
          </div>
        ))}
      </div>
    );
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value).filter(
      ([k, v]) =>
        !SKIP_KEYS.has(k) && v !== null && v !== undefined && v !== "",
    );
    return (
      <div className="space-y-3">
        {entries.map(([k, v]) => (
          <div key={k}>
            <div className={`text-xs uppercase tracking-wider mb-1 ${muted}`}>
              {humanize(k)}
            </div>
            <RenderValue value={v} depth={depth + 1} muted={muted} />
          </div>
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
              <RenderValue
                value={reading.outputJson}
                depth={0}
                muted={borderMuted}
              />
            </Card>
          </Section>
        </>
      )}
    </Container>
  );
};

export default SavedReadingDetailPage;
