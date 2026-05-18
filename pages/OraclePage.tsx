// INPUT: UserProfile prop, ask API service, entitlement contexts.
// OUTPUT: AI Q&A Oracle page with category-based questions and streaming answer display.
// POS: Oracle (Ask) page extracted from App.tsx; if updated, keep App.tsx lazy import in sync.

import React, { useState, useEffect, useMemo, useRef } from "react";
import { SEO } from "../components/SEO";
import { FrameworkDisclaimer } from "../components/shared/FrameworkDisclaimer";
import {
  Container,
  Card,
  ActionButton,
  Chip,
  CopyButton,
  useTheme,
  useLanguage,
  translateAstroTerm,
} from "../components/UIComponents";
import { ArrowLeft } from "lucide-react";
import * as T from "../types";
import { PRESET_QUESTIONS, TRANSLATIONS, LOGIN_GATE_MODE } from "../constants";
import { AstroChart } from "../components/AstroChart";
import { OracleLoading } from "../components/OracleLoading";
import { fetchAskAnswer } from "../services/apiClient";
import { trackEvent } from "../services/analytics";
import { useAuth } from "../contexts/AuthContext";
import { useAskQuota, useEntitlement } from "../contexts/EntitlementContext";
import { getResetCountdown } from "../utils/astro-helpers";

type AskCategoryKey = keyof (typeof PRESET_QUESTIONS)["en"];

type AskReportSection = {
  title: string;
  body: string;
};

const cleanAskReportBody = (raw: string): string => {
  if (!raw) return raw;
  return raw
    .split("\n")
    .map((line) => {
      let text = line.replace(/^\s*[*-]\s+/, "");
      text = text.replace(/\*\*(.*?)\*\*/g, "$1");
      text = text.replace(/\*(.*?)\*/g, "$1");
      text = text.replace(/`([^`]+)`/g, "$1");
      return text;
    })
    .join("\n")
    .trim();
};

// Planet name mappings for extraction from Astrological Signature section
const PLANET_NAME_ALIASES: Record<string, string> = {
  // English names
  sun: "Sun",
  moon: "Moon",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
  uranus: "Uranus",
  neptune: "Neptune",
  pluto: "Pluto",
  ascendant: "Ascendant",
  asc: "Ascendant",
  rising: "Ascendant",
  midheaven: "Midheaven",
  mc: "Midheaven",
  "north node": "North Node",
  nn: "North Node",
  "south node": "South Node",
  sn: "South Node",
  chiron: "Chiron",
  lilith: "Lilith",
  "black moon lilith": "Lilith",
  descendant: "Descendant",
  dc: "Descendant",
  desc: "Descendant",
  ic: "IC",
  "imum coeli": "IC",
  // Chinese names
  太阳: "Sun",
  月亮: "Moon",
  水星: "Mercury",
  金星: "Venus",
  火星: "Mars",
  木星: "Jupiter",
  土星: "Saturn",
  天王星: "Uranus",
  海王星: "Neptune",
  冥王星: "Pluto",
  上升: "Ascendant",
  上升点: "Ascendant",
  天顶: "Midheaven",
  中天: "Midheaven",
  北交点: "North Node",
  南交点: "South Node",
  凯龙: "Chiron",
  凯龙星: "Chiron",
  莉莉丝: "Lilith",
  黑月莉莉丝: "Lilith",
  下降: "Descendant",
  下降点: "Descendant",
  天底: "IC",
};

// Extract planet names mentioned in the Astrological Signature section
// Returns planet names with T- prefix for transit planets (行运) and without prefix for natal planets (本命)
const extractPlanetsFromSignature = (
  sections: AskReportSection[],
): string[] => {
  // Find the signature section (check multiple possible titles)
  const signatureSection = sections.find((s) => {
    const title = s.title.toLowerCase();
    return (
      title.includes("signature") ||
      title.includes("星盘密码") ||
      title.includes("星盘特征") ||
      title.includes("星象")
    );
  });

  if (!signatureSection) return [];

  const planets = new Set<string>();
  const body = signatureSection.body;

  // Sort planet aliases by length (longest first) to avoid partial matches
  const sortedAliases = Object.keys(PLANET_NAME_ALIASES).sort(
    (a, b) => b.length - a.length,
  );

  // Create a regex pattern for all planet names
  // Escape special regex characters in planet names
  const escapedAliases = sortedAliases.map((name) =>
    name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const planetNamesPattern = escapedAliases.join("|");

  // Pattern 1: Transit planet patterns (行运X, transit X) → add T- prefix
  const transitPattern = new RegExp(
    `(?:行运|transit)\\s*(${planetNamesPattern})`,
    "gi",
  );

  // Pattern 2: Natal planet patterns (本命X, natal X) → no prefix
  const natalPattern = new RegExp(
    `(?:本命|natal)\\s*(${planetNamesPattern})`,
    "gi",
  );

  // Pattern 3: Direct planet name mentions without prefix (assume natal for compatibility)
  const directPattern = new RegExp(`(${planetNamesPattern})`, "gi");

  let match;

  // Track which planets were explicitly marked as transit or natal
  const explicitTransit = new Set<string>();
  const explicitNatal = new Set<string>();

  // Extract transit planets (with T- prefix)
  while ((match = transitPattern.exec(body)) !== null) {
    const key = match[1].toLowerCase();
    const normalized = PLANET_NAME_ALIASES[key];
    if (normalized) {
      planets.add(`T-${normalized}`);
      explicitTransit.add(normalized);
    }
  }

  // Extract natal planets (no prefix)
  while ((match = natalPattern.exec(body)) !== null) {
    const key = match[1].toLowerCase();
    const normalized = PLANET_NAME_ALIASES[key];
    if (normalized) {
      planets.add(normalized);
      explicitNatal.add(normalized);
    }
  }

  // Extract all direct mentions of planet names
  // For planets not explicitly marked, add as natal (no prefix)
  while ((match = directPattern.exec(body)) !== null) {
    const key = match[1].toLowerCase();
    const normalized = PLANET_NAME_ALIASES[key];
    if (normalized) {
      // Only add if not already explicitly categorized
      if (!explicitTransit.has(normalized) && !explicitNatal.has(normalized)) {
        planets.add(normalized);
      }
    }
  }

  return Array.from(planets);
};

const normalizeAskReportText = (raw: string): string => {
  if (!raw) return raw;
  let normalized = raw.replace(/\r\n/g, "\n");
  normalized = normalized.replace(/([^\n])\s*(##\s+)/g, "$1\n$2");
  return normalized;
};

const parseAskReportSections = (raw: string): AskReportSection[] => {
  if (!raw) return [];
  const lines = normalizeAskReportText(raw).split("\n");
  const sections: AskReportSection[] = [];
  let currentTitle: string | null = null;
  let currentBody: string[] = [];

  const pushSection = () => {
    if (!currentTitle && currentBody.length === 0) return;
    const body = cleanAskReportBody(currentBody.join("\n"));
    sections.push({ title: currentTitle || "", body });
  };

  // Regex patterns for section headers
  const h2Pattern = /^##\s+/;
  const numberedPattern = /^(\d+)[.、．]\s*/;
  const sectionMatchers: Array<{ key: string; patterns: RegExp[] }> = [
    {
      key: "essence",
      patterns: [/^the essence$/i, /^核心洞察$/, /^本质洞察$/],
    },
    {
      key: "signature",
      patterns: [/^the astrological signature$/i, /^星盘密码$/, /^星盘特征$/],
    },
    {
      key: "deep_dive",
      patterns: [
        /^deep dive analysis$/i,
        /^deep dive$/i,
        /^深度解码$/,
        /^深度分析$/,
      ],
    },
    { key: "soulwork", patterns: [/^soulwork$/i, /^灵魂功课$/, /^灵魂练习$/] },
    {
      key: "takeaway",
      patterns: [
        /^the cosmic takeaway/i,
        /^cosmic takeaway/i,
        /^conclusion$/i,
        /^宇宙寄语$/,
        /^结语$/,
      ],
    },
  ];

  lines.forEach((line) => {
    const trimmed = line.trim();
    const cleaned = trimmed.replace(/[:：]$/, "").trim();

    // Check for ## headers
    if (h2Pattern.test(trimmed)) {
      pushSection();
      currentTitle = trimmed.replace(h2Pattern, "").trim();
      currentBody = [];
      return;
    }

    // Check for numbered sections (1. 2. 3. or 1、2、3、)
    const numberedMatch = trimmed.match(numberedPattern);
    if (numberedMatch && trimmed.length > 3) {
      pushSection();
      currentTitle = trimmed.replace(numberedPattern, "").trim();
      currentBody = [];
      return;
    }

    const sectionMatch = sectionMatchers.find((matcher) =>
      matcher.patterns.some((pattern) => pattern.test(cleaned)),
    );
    if (sectionMatch) {
      pushSection();
      currentTitle = cleaned;
      currentBody = [];
      return;
    }

    // Add to current body
    if (currentTitle !== null || sections.length === 0) {
      currentBody.push(line);
    }
  });

  pushSection();
  if (sections.length > 0) return sections;
  return [{ title: "", body: cleanAskReportBody(raw) }];
};

const localizeAskSectionTitle = (
  title: string,
  lang: T.Language,
  t: (typeof TRANSLATIONS)["en"],
): string => {
  if (!title) return title;
  const normalized = title.trim().toLowerCase();
  const matchers: Array<{
    key: keyof typeof t.ask.report_sections;
    patterns: RegExp[];
  }> = [
    { key: "essence", patterns: [/the essence/i, /核心洞察/, /本质洞察/] },
    {
      key: "signature",
      patterns: [/astrological signature/i, /星盘密码/, /星盘特征/],
    },
    {
      key: "deep_dive",
      patterns: [/deep dive/i, /deep analysis/i, /深度解码/, /深度分析/],
    },
    { key: "soulwork", patterns: [/soulwork/i, /灵魂功课/, /灵魂练习/] },
    {
      key: "takeaway",
      patterns: [/cosmic takeaway/i, /conclusion/i, /结语/, /宇宙寄语/],
    },
  ];
  for (const matcher of matchers) {
    if (
      matcher.patterns.some(
        (pattern) => pattern.test(normalized) || pattern.test(title),
      )
    ) {
      return t.ask.report_sections?.[matcher.key] || title;
    }
  }
  return title;
};

const localizeAskReportBody = (
  body: string,
  lang: T.Language,
  t: (typeof TRANSLATIONS)["en"],
): string => {
  if (!body) return body;
  const labels = t.ask.report_labels;
  const isZh = lang === "zh";
  const separator = isZh ? "：" : ": ";
  const labelMatchers: Array<{ key: keyof typeof labels; patterns: RegExp[] }> =
    [
      { key: "headline", patterns: [/^headline\s*[:：]/i, /^标题\s*[:：]/] },
      {
        key: "insight",
        patterns: [/^the insight\s*[:：]/i, /^核心洞察\s*[:：]/],
      },
      { key: "mirror", patterns: [/^the mirror\s*[:：]/i, /^看见\s*[:：]/] },
      { key: "root", patterns: [/^the root\s*[:：]/i, /^根源\s*[:：]/] },
      { key: "shadow", patterns: [/^the shadow\s*[:：]/i, /^阴影\s*[:：]/] },
      { key: "light", patterns: [/^the light\s*[:：]/i, /^转化\s*[:：]/] },
      {
        key: "journal",
        patterns: [
          /^journal prompt\s*[:：]/i,
          /^觉察日记\s*[:：]/,
          /^觉醒日记\s*[:：]/,
        ],
      },
      { key: "micro", patterns: [/^micro-?habit\s*[:：]/i, /^微行动\s*[:：]/] },
      { key: "summary", patterns: [/^summary\s*[:：]/i, /^结语\s*[:：]/] },
      {
        key: "affirmation",
        patterns: [/^affirmation\s*[:：]/i, /^能量咒语\s*[:：]/],
      },
    ];
  const labelOnlyMatchers: Array<{
    key: keyof typeof labels;
    patterns: RegExp[];
  }> = [
    { key: "headline", patterns: [/^headline$/i, /^标题$/] },
    { key: "insight", patterns: [/^the insight$/i, /^核心洞察$/] },
    { key: "mirror", patterns: [/^the mirror$/i, /^看见$/] },
    { key: "root", patterns: [/^the root$/i, /^根源$/] },
    { key: "shadow", patterns: [/^the shadow$/i, /^阴影$/] },
    { key: "light", patterns: [/^the light$/i, /^转化$/] },
    {
      key: "journal",
      patterns: [/^journal prompt$/i, /^觉察日记$/i, /^觉醒日记$/i],
    },
    { key: "micro", patterns: [/^micro-?habit$/i, /^微行动$/] },
    { key: "summary", patterns: [/^summary$/i, /^结语$/] },
    { key: "affirmation", patterns: [/^affirmation$/i, /^能量咒语$/] },
  ];
  const lines = body.split("\n");
  const output: string[] = [];
  const isLabelOnlyLine = (text: string) =>
    labelOnlyMatchers.some((matcher) =>
      matcher.patterns.some((pattern) => pattern.test(text)),
    );
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) continue;
    let matched = false;
    for (const matcher of labelMatchers) {
      const match = matcher.patterns.find((pattern) => pattern.test(trimmed));
      if (match) {
        const rest = trimmed.replace(match, "").trim();
        const label =
          labels?.[matcher.key] || trimmed.replace(match, "").trim();
        output.push(
          rest ? `${label}${separator}${rest}` : `${label}${separator}`.trim(),
        );
        matched = true;
        break;
      }
    }
    if (matched) continue;
    for (const matcher of labelOnlyMatchers) {
      const match = matcher.patterns.find((pattern) => pattern.test(trimmed));
      if (match) {
        const label = labels?.[matcher.key] || trimmed;
        let nextIndex = index + 1;
        while (nextIndex < lines.length && !lines[nextIndex].trim()) {
          nextIndex += 1;
        }
        if (
          nextIndex < lines.length &&
          !isLabelOnlyLine(lines[nextIndex].trim())
        ) {
          const content = lines[nextIndex].trim();
          output.push(`${label}${separator}${content}`);
          index = nextIndex;
        } else {
          output.push(`${label}${separator}`.trim());
        }
        matched = true;
        break;
      }
    }
    if (matched) continue;
    output.push(isZh ? translateAstroTerm(line, "zh") : line);
  }
  return output.join("\n").trim();
};

const parseAskReportLabelLine = (
  line: string,
  labels?: Record<string, string>,
): {
  key: string;
  label: string;
  separator: string;
  content: string;
} | null => {
  if (!labels) return null;
  const separators = ["：", ":"];
  for (const [key, label] of Object.entries(labels)) {
    for (const separator of separators) {
      const prefix = `${label}${separator}`;
      if (line.startsWith(prefix)) {
        return {
          key,
          label,
          separator,
          content: line.slice(prefix.length).trim(),
        };
      }
    }
  }
  return null;
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractAskReportTitleAndCleanSections = (
  sections: AskReportSection[],
  t: (typeof TRANSLATIONS)["en"],
): { sections: AskReportSection[]; reportTitle: string } => {
  const reportLabels: any = t.ask.report_labels || {};
  const essenceTitle = t.ask.report_sections?.essence || "Essence";
  const insightLabel = reportLabels.insight;
  let reportTitle = "";
  const cleanedSections = sections.map((section) => {
    const isEssence = section.title === essenceTitle;
    const lines = section.body.split("\n").filter((line) => line.trim());
    const nextLines: string[] = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      const match = parseAskReportLabelLine(trimmed, reportLabels);
      if (match?.key === "headline") {
        if (!reportTitle && match.content) reportTitle = match.content;
        return;
      }
      if (isEssence && match?.key === "insight") {
        if (match.content) nextLines.push(match.content);
        return;
      }
      if (isEssence && insightLabel) {
        const insightRegex = new RegExp(
          `^(.*?)\\s*${escapeRegExp(insightLabel)}\\s*[：:]\\s*(.+)$`,
        );
        const insightMatch = trimmed.match(insightRegex);
        if (insightMatch) {
          const possibleTitle = insightMatch[1].trim();
          const insightBody = insightMatch[2].trim();
          if (!reportTitle && possibleTitle && possibleTitle.length <= 32) {
            reportTitle = possibleTitle;
          }
          if (insightBody) nextLines.push(insightBody);
          return;
        }
      }
      nextLines.push(trimmed);
    });
    return { ...section, body: nextLines.join("\n").trim() };
  });
  return { sections: cleanedSections, reportTitle };
};

const splitAskReportByLabels = (
  body: string,
  lang: T.Language,
  t: (typeof TRANSLATIONS)["en"],
): AskReportSection[] => {
  if (!body) return [];
  const labels = t.ask.report_labels;
  if (!labels) return [];
  const localizedBody = localizeAskReportBody(body, lang, t);
  const lines = localizedBody
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const isZh = lang === "zh";
  const separator = isZh ? "：" : ":";
  const makePrefix = (key: keyof typeof labels) => `${labels[key]}${separator}`;
  const hasPrefix = (line: string, key: keyof typeof labels) =>
    line.startsWith(makePrefix(key));

  const isDeepDiveLabel = (line: string) =>
    hasPrefix(line, "mirror") ||
    hasPrefix(line, "root") ||
    hasPrefix(line, "shadow") ||
    hasPrefix(line, "light");
  const isSoulworkLabel = (line: string) =>
    hasPrefix(line, "journal") || hasPrefix(line, "micro");
  const isTakeawayLabel = (line: string) =>
    hasPrefix(line, "summary") || hasPrefix(line, "affirmation");
  const isEssenceLabel = (line: string) =>
    hasPrefix(line, "headline") || hasPrefix(line, "insight");

  const findIndex = (predicate: (line: string) => boolean) =>
    lines.findIndex(predicate);
  const deepDiveIndex = findIndex(isDeepDiveLabel);
  const soulworkIndex = findIndex(isSoulworkLabel);
  const takeawayIndex = findIndex(isTakeawayLabel);

  const beforeDeepDiveEnd = deepDiveIndex === -1 ? lines.length : deepDiveIndex;
  const preDeepDive = lines.slice(0, beforeDeepDiveEnd);
  const essenceLines = preDeepDive.filter(isEssenceLabel);
  const signatureLines = preDeepDive.filter((line) => !isEssenceLabel(line));
  const deepDiveEnd =
    soulworkIndex !== -1
      ? soulworkIndex
      : takeawayIndex !== -1
        ? takeawayIndex
        : lines.length;
  const deepDiveLines =
    deepDiveIndex !== -1 ? lines.slice(deepDiveIndex, deepDiveEnd) : [];
  const soulworkEnd = takeawayIndex !== -1 ? takeawayIndex : lines.length;
  const soulworkLines =
    soulworkIndex !== -1 ? lines.slice(soulworkIndex, soulworkEnd) : [];
  const takeawayLines = takeawayIndex !== -1 ? lines.slice(takeawayIndex) : [];

  const sections: AskReportSection[] = [];
  if (essenceLines.length > 0) {
    sections.push({
      title: t.ask.report_sections?.essence || "Essence",
      body: essenceLines.join("\n"),
    });
  }
  if (signatureLines.length > 0) {
    sections.push({
      title: t.ask.report_sections?.signature || "Signature",
      body: signatureLines.join("\n"),
    });
  }
  if (deepDiveLines.length > 0) {
    sections.push({
      title: t.ask.report_sections?.deep_dive || "Deep Dive",
      body: deepDiveLines.join("\n"),
    });
  }
  if (soulworkLines.length > 0) {
    sections.push({
      title: t.ask.report_sections?.soulwork || "Soulwork",
      body: soulworkLines.join("\n"),
    });
  }
  if (takeawayLines.length > 0) {
    sections.push({
      title: t.ask.report_sections?.takeaway || "Takeaway",
      body: takeawayLines.join("\n"),
    });
  }
  return sections;
};

const AskOraclePage: React.FC<{ profile: T.UserProfile }> = ({ profile }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { totalLeft: askQuotaLeft, resetAt: askResetAt } = useAskQuota();
  const { checkAccess, refreshEntitlements } = useEntitlement();
  const { openUpgradeModal, isAuthenticated, openLoginModal } = useAuth();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<T.AskAnswerContent | null>(null);
  const [answerMeta, setAnswerMeta] = useState<T.AIContentMeta | null>(null);
  const [answerLang, setAnswerLang] = useState<T.Language | null>(null);
  const [answerChart, setAnswerChart] = useState<T.NatalFacts | null>(null);
  const [answerTransits, setAnswerTransits] = useState<T.TransitData | null>(
    null,
  );
  const [answerChartType, setAnswerChartType] =
    useState<T.AskChartType>("natal");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const lastAskKey = useRef<string | null>(null);

  // Initialize active category
  const [activeCategory, setActiveCategory] =
    useState<AskCategoryKey>("self_discovery");

  const reportLang = answerLang || language;
  const reportT = TRANSLATIONS[reportLang] || t;

  const loadingPhrases = t.ask.loading_phrases || [];
  const questionSet = PRESET_QUESTIONS[language] || PRESET_QUESTIONS.zh;
  const questions = questionSet[activeCategory] || [];
  const selectedQuestionText = selectedQuestionId
    ? questions.find((item) => item.id === selectedQuestionId)?.text || null
    : null;
  const { sections: answerSections, reportTitle } = useMemo(() => {
    if (!answer) return { sections: [], reportTitle: "" };
    const reportLang = answerLang || language;
    const reportT = TRANSLATIONS[reportLang] || t;
    const sections = parseAskReportSections(answer);
    const resolvedSections = (() => {
      if (sections.length <= 1) {
        const fallbackSections = splitAskReportByLabels(
          sections[0]?.body || answer,
          reportLang,
          reportT,
        );
        if (fallbackSections.length > 1) return fallbackSections;
      }
      return sections;
    })();
    const localized = resolvedSections.map((section) => ({
      title: localizeAskSectionTitle(section.title, reportLang, reportT),
      body: localizeAskReportBody(section.body, reportLang, reportT),
    }));
    return extractAskReportTitleAndCleanSections(localized, reportT);
  }, [answer, answerLang, language, t]);

  // Extract visible planets from the Astrological Signature section
  const visiblePlanets = useMemo(() => {
    if (answerSections.length === 0) return [];
    return extractPlanetsFromSignature(answerSections);
  }, [answerSections]);

  useEffect(() => {
    setSelectedQuestionId(null);
  }, [activeCategory]);

  useEffect(() => {
    if (!selectedQuestionId) return;
    const translated = questions.find(
      (item) => item.id === selectedQuestionId,
    )?.text;
    if (translated && translated !== question) {
      setQuestion(translated);
    }
  }, [language, questions, question, selectedQuestionId]);

  useEffect(() => {
    if (!loading) return;
    setLoadingPhraseIndex(0);
    if (loadingPhrases.length <= 1) return;
    const interval = window.setInterval(() => {
      setLoadingPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
    }, 3200);
    return () => window.clearInterval(interval);
  }, [loading, loadingPhrases.length]);

  const handleAsk = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;

    const dedupeKey = `${trimmed}_${activeCategory}_${language}_${profile.birthDate || "anon"}`;
    const access = await checkAccess("ask");
    if (!access.canAccess) {
      if (LOGIN_GATE_MODE && !isAuthenticated) {
        openLoginModal(t.login_gate?.unlock_ask || "Sign in to ask the Oracle");
      } else if (LOGIN_GATE_MODE && isAuthenticated) {
        // 每日配额用尽，显示倒计时
        const countdown = getResetCountdown(askResetAt);
        const msg = (
          t.login_gate?.quota_exhausted_desc ||
          "You've used all your daily attempts. Resets in {time}."
        ).replace("{time}", countdown);
        setError(msg);
      } else if (access.needPurchase) {
        openUpgradeModal(t.paywall?.unlock_ask || "Unlock Ask Q&A");
      }
      return;
    }

    trackEvent("oracle_question_asked", {
      question_length: trimmed.length,
      category: activeCategory,
    });

    if (lastAskKey.current === dedupeKey) {
      setLoading(true);
      setError(null);
      setQuestion(trimmed);
      setAnswer(null);
      setAnswerMeta(null);
      setAnswerLang(null);
      setAnswerChart(null);
      setAnswerTransits(null);
      setAnswerChartType("natal");
      try {
        const result = await fetchAskAnswer(
          profile,
          trimmed,
          undefined,
          language,
          activeCategory,
        );
        const content = result.content || null;
        if (!content) {
          setError(t.app.error);
          return;
        }
        setAnswer(content);
        setAnswerMeta(result.meta || null);
        setAnswerLang(result.lang);
        setAnswerChart(result.chart || null);
        setAnswerTransits(result.transits || null);
        setAnswerChartType(result.chartType || "natal");
        await refreshEntitlements();
      } catch (e) {
        const err = e as Error;
        if (err?.name === "AbortError") {
          setError(t.ask.timeout);
          return;
        }
        console.error(e);
        setError(t.app.error);
      } finally {
        setLoading(false);
      }
      return;
    }

    lastAskKey.current = dedupeKey;

    setLoading(true);
    setError(null);
    setQuestion(trimmed);
    setAnswer(null);
    setAnswerMeta(null);
    setAnswerLang(null);
    setAnswerChart(null);
    setAnswerTransits(null);
    setAnswerChartType("natal");
    try {
      const result = await fetchAskAnswer(
        profile,
        trimmed,
        undefined,
        language,
        activeCategory,
      );
      const content = result.content || null;
      if (!content) {
        setError(t.app.error);
        return;
      }
      setAnswer(content);
      setAnswerMeta(result.meta || null);
      setAnswerLang(result.lang);
      setAnswerChart(result.chart || null);
      setAnswerTransits(result.transits || null);
      setAnswerChartType(result.chartType || "natal");
      await refreshEntitlements();
    } catch (e) {
      const err = e as Error;
      if (err?.name === "AbortError") {
        setError(t.ask.timeout);
        return;
      }
      console.error(e);
      setError(t.app.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!answer || !question || loading) return;
    if (
      selectedQuestionId &&
      selectedQuestionText &&
      question !== selectedQuestionText
    )
      return;
    if (answerLang === language) return;
    let cancelled = false;
    const refreshAnswer = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAskAnswer(
          profile,
          question,
          undefined,
          language,
          activeCategory,
        );
        if (cancelled) return;
        setAnswer(result.content || null);
        setAnswerMeta(result.meta || null);
        setAnswerLang(result.lang);
        setAnswerChart(result.chart || null);
        setAnswerTransits(result.transits || null);
        setAnswerChartType(result.chartType || "natal");
      } catch (e) {
        if (cancelled) return;
        const err = e as Error;
        if (err?.name === "AbortError") {
          setError(t.ask.timeout);
          return;
        }
        console.error(e);
        setError(t.app.error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    refreshAnswer();
    return () => {
      cancelled = true;
    };
  }, [
    activeCategory,
    answer,
    answerLang,
    language,
    loading,
    profile,
    question,
    selectedQuestionId,
    selectedQuestionText,
    t.ask.timeout,
    t.app.error,
  ]);

  const showLoadingView = loading && !answer;
  const containerClassName = answer
    ? "flex flex-col min-h-screen pt-6 pb-12 -mt-[30px]"
    : "flex flex-col h-screen overflow-hidden pt-6 pb-1.5 -mt-[30px]";

  return (
    <>
      <SEO
        title="Ask Oracle"
        description="Ask AI-powered astrology questions and get personalized insights."
        robots="noindex,nofollow"
      />
      <Container className={containerClassName}>
        <FrameworkDisclaimer />
        {showLoadingView ? (
          <OracleLoading
            phrases={loadingPhrases}
            thinkingLabel={t.ask.thinking}
            className="flex-1"
          />
        ) : (
          <>
            {/* Header: ORACLE */}
            {!answer && (
              <div className="text-center pb-5 animate-fade-in relative mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold-500/30 text-gold-500 mb-3 bg-gold-500/5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                    className="w-7 h-7"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-serif tracking-[0.2em] text-gold-500 mb-2 uppercase">
                  {t.ask.title}
                </h1>
                <p className="text-sm font-serif italic text-star-400 opacity-80">
                  "{t.ask.subtitle}"
                </p>
                <div className="flex items-center justify-center gap-2 mt-3 text-xs font-bold uppercase tracking-[0.2em] text-gold-600/70">
                  <div className="w-2 h-2 rounded-full bg-accent animate-breathe"></div>
                  {t.ask.online}
                </div>
              </div>
            )}

            {!answer ? (
              <div className="animate-fade-in flex-1 max-w-7xl mx-auto w-full px-4 flex flex-col min-h-0 mt-[44px]">
                {/* Category Tabs - Compact Centered Row */}
                <div
                  className={`flex flex-wrap justify-center gap-2 mb-2 border-b pb-2 shrink-0 ${theme === "dark" ? "border-gold-500/15" : "border-paper-300"}`}
                >
                  {(Object.keys(t.ask.modules) as AskCategoryKey[]).map(
                    (key) => (
                      <button
                        key={key}
                        onClick={() => setActiveCategory(key)}
                        className={`
                                    flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest transition-all border rounded-md
                                    ${
                                      activeCategory === key
                                        ? "border-gold-500 text-gold-500 bg-gold-500/5 shadow-glow"
                                        : "border-gold-500/15 text-star-400 hover:border-gold-500/50 hover:text-star-200 bg-space-900/50"
                                    }
                                `}
                      >
                        {/* SVG icon based on category */}
                        <span className="w-4 h-4 flex items-center justify-center">
                          {key === "self_discovery" && (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="w-4 h-4"
                            >
                              <circle cx="12" cy="8" r="4" />
                              <path
                                d="M4 20c0-4 4-6 8-6s8 2 8 6"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                          {key === "shadow_work" && (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="w-4 h-4"
                            >
                              <path d="M12 3a9 9 0 1 0 9 9c0-1.5-.4-2.8-1-4a7 7 0 0 1-8 5c-3.9 0-7-3.1-7-7a7 7 0 0 1 5-6.7" />
                            </svg>
                          )}
                          {key === "relationships" && (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="w-4 h-4"
                            >
                              <path
                                d="M12 21s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                          {key === "vocation" && (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="w-4 h-4"
                            >
                              <rect x="3" y="7" width="18" height="13" rx="2" />
                              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <path d="M12 12v4" />
                            </svg>
                          )}
                          {key === "family_roots" && (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="w-4 h-4"
                            >
                              <path
                                d="M3 10.5L12 3l9 7.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
                              <rect x="9" y="14" width="6" height="6" />
                            </svg>
                          )}
                          {key === "time_cycles" && (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="w-4 h-4"
                            >
                              <circle cx="12" cy="12" r="9" />
                              <path d="M12 6v6l4 2" strokeLinecap="round" />
                              <path
                                d="M16 3l2 2-2 2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M8 21l-2-2 2-2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        {t.ask.modules[key]}
                      </button>
                    ),
                  )}
                </div>

                {/* Question Matrix - 2 Column Grid with internal scroll */}
                <div className="grid grid-cols-1 gap-y-2 pt-4 pb-4 w-full md:w-1/2 mx-auto flex-1 min-h-0 overflow-y-auto content-start auto-rows-min">
                  {questions.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center text-center text-sm opacity-70 py-10">
                      <div className="font-semibold mb-2">
                        {t.ask.empty_title}
                      </div>
                      <div className="text-xs opacity-70">
                        {t.ask.empty_desc}
                      </div>
                    </div>
                  ) : (
                    questions.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          setQuestion(q.text);
                          setSelectedQuestionId(q.id);
                          setError(null);
                        }}
                        disabled={loading}
                        className={`
                                        group text-left h-[38px] px-4 border transition-all duration-300 rounded
                                        flex items-center
                                        ${
                                          selectedQuestionId === q.id
                                            ? "border-gold-500/80 bg-gold-500/5 shadow-glow"
                                            : theme === "dark"
                                              ? "bg-space-900 border-gold-500/15 hover:border-gold-500/50 hover:bg-space-800"
                                              : "bg-paper-100/85 border-paper-300 hover:bg-paper-100 hover:border-gold-600/30"
                                        }
                                    `}
                      >
                        <span
                          className={`font-mono text-sm transition-all flex items-center gap-3 w-full ${selectedQuestionId === q.id ? "text-gold-500 opacity-100" : "opacity-70 group-hover:text-gold-500 group-hover:opacity-100"}`}
                        >
                          <span className="opacity-30 shrink-0">&gt;</span>
                          <span className="truncate">{q.text}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>

                {/* Input Footer - Inline with Rituals Counter */}
                <div className="shrink-0 pt-3 pb-1.5">
                  <div className="max-w-6xl mx-auto relative group">
                    {loading ? (
                      <div className="absolute -top-6 left-0 right-0 text-center opacity-70 animate-pulse font-mono text-xs uppercase tracking-widest text-gold-500">
                        {t.ask.thinking}
                      </div>
                    ) : error ? (
                      <div className="absolute -top-6 left-0 right-0 text-center font-mono text-xs uppercase tracking-widest text-danger">
                        {error}
                      </div>
                    ) : null}
                    {/* Input Container */}
                    <div className="flex items-stretch gap-3">
                      <div
                        className={`
                                    relative flex items-center flex-1 p-1 rounded-none border transition-all duration-500
                                    ${
                                      theme === "dark"
                                        ? "bg-space-950/90 border-gold-500/15 focus-within:border-gold-500/50 shadow-2xl backdrop-blur-md"
                                        : "bg-paper-100/90 border-paper-300 shadow-xl"
                                    }
                                `}
                      >
                        <input
                          type="text"
                          placeholder={t.ask.placeholder}
                          value={question}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            setQuestion(nextValue);
                            setError(null);
                            if (
                              selectedQuestionId &&
                              nextValue.trim() !== (selectedQuestionText || "")
                            ) {
                              setSelectedQuestionId(null);
                            }
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAsk(question)
                          }
                          disabled={loading}
                          className="w-full bg-transparent border-none outline-none px-5 py-3 text-sm font-mono placeholder-opacity-30 tracking-wide"
                        />
                      </div>
                      <button
                        onClick={() => handleAsk(question)}
                        disabled={loading || !question.trim()}
                        className={`shrink-0 flex flex-col items-center justify-center px-4 border transition-all duration-300 rounded-none
                                        ${
                                          loading || !question.trim()
                                            ? "opacity-60 cursor-not-allowed"
                                            : "hover:border-gold-500/60 hover:text-gold-400"
                                        }
                                        ${
                                          theme === "dark"
                                            ? "bg-space-900 border-gold-500/15 text-gold-500"
                                            : "bg-paper-100/85 border-paper-300 text-gold-700"
                                        }
                                    `}
                      >
                        <span className="text-xs font-mono uppercase tracking-widest opacity-80">
                          {LOGIN_GATE_MODE
                            ? language === "zh"
                              ? `今日: ${askQuotaLeft}/3`
                              : `Today: ${askQuotaLeft}/3`
                            : language === "zh"
                              ? `本周次数: ${askQuotaLeft}`
                              : `Weekly: ${askQuotaLeft}`}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-gold-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 -rotate-45"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                            />
                          </svg>
                          <span className="text-xs uppercase tracking-[0.3em]">
                            {t.ask.send}
                          </span>
                        </span>
                      </button>
                    </div>
                    {/* Glow Effect behind input */}
                    <div className="absolute -inset-1 bg-gold-500/5 blur-xl -z-10 rounded-lg pointer-events-none"></div>
                  </div>
                </div>
              </div>
            ) : (
              (() => {
                const isLight = theme === "light";
                const shellTone = isLight
                  ? "bg-paper-100 border-paper-300"
                  : "bg-space-900 border-gold-500/20";
                const headerTone = isLight
                  ? "bg-paper-100/95 border-paper-300"
                  : "bg-space-900/95 border-gold-500/10";
                const labelTone = isLight ? "text-paper-600" : "text-star-400";
                const categoryLabelRaw = t.ask.modules[activeCategory] || "";
                const categoryLabelPrimary =
                  categoryLabelRaw.split(/[\/／]/)[0]?.trim() || "";
                const categoryLabel =
                  categoryLabelPrimary || categoryLabelRaw.trim();
                const questionText = question.trim();
                const questionSummary =
                  questionText.length > 72
                    ? `${questionText.slice(0, 72)}...`
                    : questionText;
                const headerSeparator = language === "zh" ? "：" : ": ";
                const headerSummary = questionSummary
                  ? `${categoryLabel}${headerSeparator}${questionSummary}`
                  : categoryLabel;
                const reportTitleText = reportTitle || questionText;

                return (
                  <div
                    className={`fixed inset-0 z-[150] flex flex-col overflow-hidden animate-fade-in ${isLight ? "bg-paper-100" : "bg-space-950"}`}
                  >
                    {/* Header with back button - left aligned */}
                    <div
                      className={`sticky top-0 z-20 px-6 py-4 flex items-center gap-4 ${isLight ? "bg-paper-100/95 backdrop-blur" : "bg-space-950/95 backdrop-blur"}`}
                    >
                      <button
                        onClick={() => {
                          setAnswer(null);
                          setAnswerMeta(null);
                          setAnswerLang(null);
                          setAnswerChart(null);
                          setError(null);
                        }}
                        className={`flex items-center gap-3 transition-all font-bold group ${labelTone}`}
                      >
                        <div
                          className={`p-2 rounded-xl transition-all ${isLight ? "bg-paper-200 border border-paper-300 group-hover:bg-paper-300" : "bg-space-900/60 group-hover:bg-gold-500/20 group-hover:text-gold-400"}`}
                        >
                          <ArrowLeft size={20} />
                        </div>
                        <span className="text-sm uppercase tracking-widest">
                          {t.ask.back}
                        </span>
                      </button>
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full border max-w-[70vw] ${isLight ? "border-gold-500/30 bg-gold-500/10 text-gold-700" : "border-gold-500/30 bg-gold-500/10 text-gold-400"}`}
                        title={headerSummary}
                      >
                        <div
                          className={`w-7 h-7 rounded-full border flex items-center justify-center ${isLight ? "border-gold-500/40 bg-paper-100/85 text-gold-700" : "border-gold-500/30 bg-space-950 text-gold-500"}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="w-4 h-4"
                          >
                            <path
                              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold tracking-wide truncate">
                          {headerSummary}
                        </span>
                      </div>
                    </div>

                    {/* Question display */}
                    <div className="text-center px-6 py-4">
                      <div
                        className={`text-2xl md:text-3xl font-serif font-medium max-w-4xl mx-auto ${isLight ? "text-paper-900" : "text-star-100"}`}
                      >
                        {reportTitleText}
                      </div>
                    </div>

                    {/* Scrollable content area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="max-w-6xl mx-auto px-6 md:px-12 py-8 relative">
                        {/* Background silhouette */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <svg
                            className="absolute inset-0 w-full h-full opacity-[0.015]"
                            viewBox="0 0 800 800"
                            preserveAspectRatio="xMidYMid slice"
                          >
                            <circle
                              cx="400"
                              cy="400"
                              r="350"
                              fill="none"
                              stroke="#D4AF37"
                              strokeWidth="0.5"
                            />
                            <circle
                              cx="400"
                              cy="400"
                              r="280"
                              fill="none"
                              stroke="#D4AF37"
                              strokeWidth="0.3"
                            />
                            <circle
                              cx="400"
                              cy="400"
                              r="200"
                              fill="none"
                              stroke="#D4AF37"
                              strokeWidth="0.2"
                            />
                            {[...Array(12)].map((_, i) => (
                              <line
                                key={i}
                                x1="400"
                                y1="50"
                                x2="400"
                                y2="120"
                                stroke="#D4AF37"
                                strokeWidth="0.3"
                                transform={`rotate(${i * 30} 400 400)`}
                              />
                            ))}
                            <circle cx="100" cy="150" r="2" fill="#D4AF37" />
                            <circle cx="700" cy="200" r="1.5" fill="#D4AF37" />
                            <circle cx="650" cy="600" r="2" fill="#D4AF37" />
                            <circle cx="150" cy="650" r="1.5" fill="#D4AF37" />
                          </svg>
                        </div>

                        {answerMeta?.source === "mock" && (
                          <div className="mb-8 rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-widest text-center border-warning/40 bg-warning/10 text-warning">
                            {t.ask.answer_source_mock}
                          </div>
                        )}

                        {/* Natal/Transit Chart Display - 星盘 */}
                        {/* 使用 API 返回的 chartType 确定星盘类型，visiblePlanets 过滤显示的行星 */}
                        {answerChart &&
                          !loading &&
                          visiblePlanets.length > 0 && (
                            <div className="mb-8">
                              <div className="flex justify-center">
                                <div className="relative w-full">
                                  <AstroChart
                                    type={answerChartType}
                                    profile={profile}
                                    scale={0.576}
                                    compactSpacing
                                    visiblePlanets={visiblePlanets}
                                    legendLabels={{
                                      conjunction: t.me.aspect_conjunction,
                                      opposition: t.me.aspect_opposition,
                                      square: t.me.aspect_square,
                                      trine: t.me.aspect_trine,
                                      sextile: t.me.aspect_sextile,
                                    }}
                                    loadingLabel={t.common.loading}
                                    errorLabel={t.app.error}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                        {loading ? (
                          <div className="text-center opacity-70 animate-pulse font-mono text-xs uppercase tracking-widest text-gold-500 py-20">
                            {t.ask.thinking}
                          </div>
                        ) : (
                          <div className="relative">
                            {/* Main answer container with modular sections */}
                            <div className="space-y-6">
                              {/* Modular answer sections with diverse card styles */}
                              {answerSections.length > 0 ? (
                                <div className="space-y-5">
                                  {answerSections.map((section, idx) => {
                                    // Determine card style based on section index for visual variety
                                    const cardStyles = [
                                      {
                                        accent: "border-l-gold-500/40",
                                        title:
                                          theme === "dark"
                                            ? "text-gold-200"
                                            : "text-gold-700",
                                        badge:
                                          theme === "dark"
                                            ? "border-gold-500/30 bg-gold-500/10 text-gold-400"
                                            : "border-gold-600/40 bg-gold-500/15 text-gold-700",
                                        highlight:
                                          theme === "dark"
                                            ? "text-gold-300"
                                            : "text-gold-700",
                                        dot:
                                          theme === "dark"
                                            ? "bg-gold-500/50"
                                            : "bg-gold-600/60",
                                        divider:
                                          theme === "dark"
                                            ? "border-gold-500/20"
                                            : "border-gold-600/25",
                                        iconTone:
                                          theme === "dark"
                                            ? "border-gold-500/30 bg-space-950 text-gold-500"
                                            : "border-gold-600/40 bg-paper-100/85 text-gold-700",
                                        icon: "star",
                                      },
                                      {
                                        accent: "border-l-accent/40",
                                        title: "text-accent",
                                        badge:
                                          theme === "dark"
                                            ? "border-accent/30 bg-accent/10 text-accent"
                                            : "border-accent/30 bg-accent/10 text-accent",
                                        highlight: "text-accent",
                                        dot:
                                          theme === "dark"
                                            ? "bg-accent/50"
                                            : "bg-accent/60",
                                        divider:
                                          theme === "dark"
                                            ? "border-accent/20"
                                            : "border-accent/30",
                                        iconTone:
                                          theme === "dark"
                                            ? "border-accent/30 bg-space-950 text-accent"
                                            : "border-accent/30 bg-paper-100/85 text-accent",
                                        icon: "eye",
                                      },
                                      {
                                        accent: "border-l-star-200/40",
                                        title:
                                          theme === "dark"
                                            ? "text-star-200"
                                            : "text-gold-700",
                                        badge:
                                          theme === "dark"
                                            ? "border-star-200/30 bg-star-200/10 text-star-200"
                                            : "border-gold-600/30 bg-gold-500/10 text-gold-700",
                                        highlight:
                                          theme === "dark"
                                            ? "text-star-200"
                                            : "text-gold-700",
                                        dot:
                                          theme === "dark"
                                            ? "bg-star-200/50"
                                            : "bg-gold-600/50",
                                        divider:
                                          theme === "dark"
                                            ? "border-star-200/20"
                                            : "border-gold-600/20",
                                        iconTone:
                                          theme === "dark"
                                            ? "border-star-200/30 bg-space-950 text-star-200"
                                            : "border-gold-600/30 bg-paper-100/85 text-gold-700",
                                        icon: "compass",
                                      },
                                      {
                                        accent: "border-l-success/40",
                                        title: "text-success",
                                        badge:
                                          theme === "dark"
                                            ? "border-success/30 bg-success/10 text-success"
                                            : "border-success/30 bg-success/10 text-success",
                                        highlight: "text-success",
                                        dot:
                                          theme === "dark"
                                            ? "bg-success/50"
                                            : "bg-success/60",
                                        divider:
                                          theme === "dark"
                                            ? "border-success/20"
                                            : "border-success/30",
                                        iconTone:
                                          theme === "dark"
                                            ? "border-success/30 bg-space-950 text-success"
                                            : "border-success/30 bg-paper-100/85 text-success",
                                        icon: "moon",
                                      },
                                      {
                                        accent: "border-l-gold-400/40",
                                        title:
                                          theme === "dark"
                                            ? "text-gold-200"
                                            : "text-gold-700",
                                        badge:
                                          theme === "dark"
                                            ? "border-gold-400/30 bg-gold-400/10 text-gold-300"
                                            : "border-gold-600/30 bg-gold-500/10 text-gold-700",
                                        highlight:
                                          theme === "dark"
                                            ? "text-gold-300"
                                            : "text-gold-700",
                                        dot:
                                          theme === "dark"
                                            ? "bg-gold-400/50"
                                            : "bg-gold-600/50",
                                        divider:
                                          theme === "dark"
                                            ? "border-gold-400/20"
                                            : "border-gold-600/20",
                                        iconTone:
                                          theme === "dark"
                                            ? "border-gold-400/30 bg-space-950 text-gold-400"
                                            : "border-gold-600/30 bg-paper-100/85 text-gold-700",
                                        icon: "star",
                                      },
                                    ];
                                    const reportSections =
                                      reportT.ask.report_sections || {};
                                    const sectionTitle =
                                      section.title || reportT.ask.deep_insight;
                                    const sectionStyleOrder: Record<
                                      string,
                                      number
                                    > = {};
                                    if (reportSections.essence)
                                      sectionStyleOrder[
                                        reportSections.essence
                                      ] = 0;
                                    if (reportSections.signature)
                                      sectionStyleOrder[
                                        reportSections.signature
                                      ] = 1;
                                    if (reportSections.deep_dive)
                                      sectionStyleOrder[
                                        reportSections.deep_dive
                                      ] = 2;
                                    if (reportSections.soulwork)
                                      sectionStyleOrder[
                                        reportSections.soulwork
                                      ] = 3;
                                    if (reportSections.takeaway)
                                      sectionStyleOrder[
                                        reportSections.takeaway
                                      ] = 4;
                                    const style =
                                      cardStyles[
                                        sectionStyleOrder[sectionTitle] ??
                                          idx % cardStyles.length
                                      ];
                                    const reportLabels =
                                      reportT.ask.report_labels || {};
                                    const highlightLabelKeys = new Set([
                                      "mirror",
                                      "root",
                                      "shadow",
                                      "light",
                                      "journal",
                                    ]);
                                    const isZhReport = reportLang === "zh";
                                    const layerLabel = isZhReport
                                      ? `${reportT.ask.layer_prefix}${idx + 1}${reportT.ask.layer_suffix || ""}`
                                      : `${reportT.ask.layer_prefix} ${idx + 1}`;

                                    // Parse body content for potential key points
                                    const bodyLines = section.body
                                      .split("\n")
                                      .filter((line) => line.trim());
                                    const hasMultiplePoints =
                                      bodyLines.length > 2;
                                    const textTone =
                                      theme === "dark"
                                        ? "text-star-200"
                                        : "text-paper-700";
                                    const renderReportLine = (line: string) => {
                                      const match = parseAskReportLabelLine(
                                        line,
                                        reportLabels,
                                      );
                                      if (!match) return <span>{line}</span>;

                                      let labelClass = style.title;
                                      if (highlightLabelKeys.has(match.key)) {
                                        if (
                                          match.key === "mirror" ||
                                          match.key === "insight"
                                        )
                                          labelClass =
                                            theme === "dark"
                                              ? "text-blue-400"
                                              : "text-blue-600";
                                        else if (match.key === "root")
                                          labelClass =
                                            theme === "dark"
                                              ? "text-purple-400"
                                              : "text-purple-600";
                                        else if (match.key === "shadow")
                                          labelClass =
                                            theme === "dark"
                                              ? "text-red-400"
                                              : "text-red-600";
                                        else if (match.key === "light")
                                          labelClass =
                                            theme === "dark"
                                              ? "text-green-400"
                                              : "text-green-600";
                                        else labelClass = style.highlight;
                                      }

                                      return (
                                        <span className="flex flex-wrap gap-1">
                                          <span
                                            className={`${labelClass} font-semibold`}
                                          >
                                            {match.label}
                                            {match.separator}
                                          </span>
                                          <span>{match.content}</span>
                                        </span>
                                      );
                                    };

                                    // Icon components
                                    const IconStar = () => (
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        className="w-5 h-5"
                                      >
                                        <path
                                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    );
                                    const IconEye = () => (
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        className="w-5 h-5"
                                      >
                                        <path
                                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                        <path
                                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    );
                                    const IconCompass = () => (
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        className="w-5 h-5"
                                      >
                                        <circle cx="12" cy="12" r="9" />
                                        <path
                                          d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    );
                                    const IconMoon = () => (
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        className="w-5 h-5"
                                      >
                                        <path
                                          d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    );

                                    const renderIcon = () => {
                                      switch (style.icon) {
                                        case "eye":
                                          return <IconEye />;
                                        case "compass":
                                          return <IconCompass />;
                                        case "moon":
                                          return <IconMoon />;
                                        default:
                                          return <IconStar />;
                                      }
                                    };

                                    return (
                                      <div
                                        key={`${section.title}-${idx}`}
                                        className="animate-fade-in"
                                        style={{
                                          animationDelay: `${idx * 100}ms`,
                                        }}
                                      >
                                        <Card
                                          className={`
                                                        relative overflow-hidden transition-all duration-300
                                                        border border-l ${style.accent}
                                                        hover:shadow-lg
                                                        ${theme === "dark" ? "hover:shadow-gold-500/5" : "hover:shadow-paper-400/20"}
                                                    `}
                                        >
                                          {/* Header with icon and title */}
                                          <div
                                            className={`flex items-center gap-4 mb-4 pb-3 border-b ${style.divider}`}
                                          >
                                            <div
                                              className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${style.iconTone}`}
                                            >
                                              {renderIcon()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                  className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] rounded-full border ${style.badge}`}
                                                >
                                                  {layerLabel}
                                                </span>
                                                <h4
                                                  className={`text-base md:text-lg font-serif font-semibold ${style.title}`}
                                                >
                                                  {sectionTitle}
                                                </h4>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Section content - modular display */}
                                          <div className="pl-14">
                                            {hasMultiplePoints ? (
                                              <div className="space-y-3">
                                                {bodyLines.map(
                                                  (line, lineIdx) => (
                                                    <div
                                                      key={lineIdx}
                                                      className="flex gap-3 items-start"
                                                    >
                                                      <div
                                                        className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${style.dot}`}
                                                      />
                                                      <p
                                                        className={`text-sm leading-relaxed ${textTone}`}
                                                      >
                                                        {renderReportLine(line)}
                                                      </p>
                                                    </div>
                                                  ),
                                                )}
                                              </div>
                                            ) : (
                                              <p
                                                className={`text-sm leading-relaxed ${textTone}`}
                                              >
                                                {renderReportLine(section.body)}
                                              </p>
                                            )}
                                          </div>
                                        </Card>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                /* Fallback for non-sectioned answers */
                                <Card
                                  className={`
                                        relative overflow-hidden
                                        border-l border-l-gold-500/40
                                        ${theme === "dark" ? "border-space-700" : "border-paper-300"}
                                    `}
                                >
                                  <div className="flex items-start gap-4 mb-4">
                                    <div
                                      className={`shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${
                                        theme === "dark"
                                          ? "border-gold-500/30 bg-space-950 text-gold-500"
                                          : "border-gold-600/30 bg-paper-100/85 text-gold-700"
                                      }`}
                                    >
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        className="w-5 h-5"
                                      >
                                        <path
                                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <div
                                    className={`pl-14 text-sm leading-relaxed whitespace-pre-line ${
                                      theme === "dark"
                                        ? "text-star-200"
                                        : "text-paper-700"
                                    }`}
                                  >
                                    {answer}
                                  </div>
                                </Card>
                              )}

                              {/* Conclusion card - enhanced visual */}
                              {answerSections.length > 0 && (
                                <div
                                  className={`mt-8 pt-6 border-t ${theme === "dark" ? "border-gold-500/10" : "border-gold-600/10"}`}
                                >
                                  <Card
                                    className={`text-center py-8 ${
                                      theme === "dark"
                                        ? "bg-gradient-to-b from-space-900 to-space-950 border-gold-500/20"
                                        : "bg-gradient-to-b from-paper-100 to-paper-100/80 border-gold-600/20"
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                      <div
                                        className={`w-12 h-px ${theme === "dark" ? "bg-gold-500/30" : "bg-gold-600/30"}`}
                                      />
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                        className={`w-6 h-6 ${theme === "dark" ? "text-gold-500/50" : "text-gold-600/50"}`}
                                      >
                                        <circle cx="12" cy="12" r="9" />
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M12 3v3m0 12v3m9-9h-3M6 12H3" />
                                      </svg>
                                      <div
                                        className={`w-12 h-px ${theme === "dark" ? "bg-gold-500/30" : "bg-gold-600/30"}`}
                                      />
                                    </div>
                                    <div
                                      className={`text-xs uppercase tracking-[0.3em] mb-3 ${theme === "dark" ? "text-gold-500/50" : "text-gold-600/50"}`}
                                    >
                                      {t.ask.oracle_complete}
                                    </div>
                                    <p
                                      className={`text-sm font-serif italic max-w-3xl mx-auto ${theme === "dark" ? "text-star-300" : "text-paper-600"}`}
                                    >
                                      {t.ask.oracle_blessing}
                                    </p>
                                  </Card>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </>
        )}
      </Container>
    </>
  );
};

export default AskOraclePage;
