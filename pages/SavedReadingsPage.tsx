// INPUT: useLanguage/useTheme/useAuth, react-router useNavigate, savedReadingsClient (list/delete).
// OUTPUT: Default-exported SavedReadingsPage — login-gated /saved list of the user's durable readings (open / delete).
// POS: backlog #24 consumption UI. Protected route (App.tsx PROTECTED_PATHS + /saved). Lists metadata only; full payload is loaded on the detail page. Update pages/FOLDER.md if added.

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Section,
  Card,
  ActionButton,
  useLanguage,
  useTheme,
} from "../components/UIComponents";
import { useAuth } from "../contexts/AuthContext";
import {
  listSavedReadings,
  deleteSavedReading,
  type SavedReadingSummary,
  type SavedToolType,
} from "../services/savedReadingsClient";

const SavedReadingsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const [readings, setReadings] = useState<SavedReadingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const s = t.saved;
  const mutedText = isDark ? "text-star-400" : "text-paper-500";
  const borderColor = isDark ? "border-gold-500/20" : "border-paper-200";

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    setLoading(true);
    setError(null);
    listSavedReadings()
      .then((rows) => {
        if (active) setReadings(rows);
      })
      .catch(() => {
        if (active) setError(s?.error || "Couldn't load your saved readings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // Only auth state drives the list fetch; the i18n fallback string is read
    // in the catch handler at error time, not a fetch dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const typeLabel = (type: SavedToolType): string => {
    const map: Record<SavedToolType, string | undefined> = {
      natal: s?.type_natal,
      cycle: s?.type_cycle,
      synastry: s?.type_synastry,
    };
    return map[type] || type;
  };

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSavedReading(id);
      setReadings((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError(s?.error || "Couldn't delete the reading.");
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  return (
    <Container>
      <div className="py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-serif font-semibold mb-2">
          {s?.title || "Saved Readings"}
        </h1>
        <p className={`text-base ${mutedText}`}>
          {s?.subtitle || "Revisit the charts and readings you've saved."}
        </p>
      </div>

      <Section>
        {loading ? (
          <p className={mutedText}>{s?.loading || "Loading…"}</p>
        ) : error ? (
          <p className="text-rose-500">{error}</p>
        ) : readings.length === 0 ? (
          <p className={mutedText}>{s?.empty || "No saved readings yet."}</p>
        ) : (
          <ul className="space-y-3">
            {readings.map((r) => (
              <li key={r.id}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <button
                      type="button"
                      className="text-left flex-1 min-w-0"
                      onClick={() => navigate(`/saved/${r.id}`)}
                    >
                      <div className="font-semibold truncate">{r.title}</div>
                      <div className={`text-sm ${mutedText}`}>
                        {typeLabel(r.toolType)} · {s?.saved_on || "Saved"}{" "}
                        {formatDate(r.createdAt)}
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      {confirmingId === r.id ? (
                        <>
                          <span
                            className={`text-xs ${mutedText} hidden sm:inline`}
                          >
                            {s?.delete_confirm || "Delete?"}
                          </span>
                          <ActionButton
                            size="sm"
                            variant="primary"
                            disabled={deletingId === r.id}
                            onClick={() => handleDelete(r.id)}
                          >
                            {deletingId === r.id
                              ? s?.deleting || "Deleting…"
                              : s?.delete || "Delete"}
                          </ActionButton>
                          <ActionButton
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmingId(null)}
                          >
                            ✕
                          </ActionButton>
                        </>
                      ) : (
                        <>
                          <ActionButton
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/saved/${r.id}`)}
                          >
                            {s?.open || "Open"}
                          </ActionButton>
                          <ActionButton
                            size="sm"
                            variant="ghost"
                            ariaLabel={s?.delete || "Delete"}
                            onClick={() => {
                              setError(null);
                              setConfirmingId(r.id);
                            }}
                          >
                            {s?.delete || "Delete"}
                          </ActionButton>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <div className={`mt-2 border-t ${borderColor}`} />
    </Container>
  );
};

export default SavedReadingsPage;
