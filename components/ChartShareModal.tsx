// INPUT: profile、filename、onClose、ChartShareCard、downloadElementAsPng、ThemeContext/useTheme/useLanguage。
// OUTPUT: <ChartShareModal> —— 全屏预览星盘分享卡（浅/深切换 + 下载 PNG + 关闭）。
// POS: 星盘分享卡预览/导出弹窗。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import { useEffect, useRef, useState } from "react";
import * as T from "../types";
import { ChartShareCard } from "./ChartShareCard";
import { downloadElementAsPng } from "../utils/domToPng";
import { ThemeContext, useTheme, useLanguage } from "./UIComponents";

interface ChartShareModalProps {
  profile: T.UserProfile;
  filename: string;
  chartType?: "natal" | "transit";
  onClose: () => void;
}

const noop = () => {};

const ChartShareModal: React.FC<ChartShareModalProps> = ({
  profile,
  filename,
  chartType = "natal",
  onClose,
}) => {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const zh = language === "zh";
  const [cardTheme, setCardTheme] = useState<"light" | "dark">(
    theme === "dark" ? "dark" : "light",
  );
  const [status, setStatus] = useState<"idle" | "working" | "done">("idle");
  const cardRef = useRef<HTMLDivElement>(null);
  const s = t.saved;

  // 让卡片整体（含 AstroChart 轮盘）按选定主题渲染：轮盘颜色来自 body class 的 CSS 变量，
  // 仅靠嵌套 ThemeContext 覆盖不到，故弹窗打开时直接把 body 主题类切到 cardTheme，关闭时还原。
  const originalBodyClass = useRef("");
  useEffect(() => {
    originalBodyClass.current = document.body.className;
    return () => {
      document.body.className = originalBodyClass.current;
    };
  }, []);
  useEffect(() => {
    document.body.className =
      cardTheme === "dark"
        ? "dark bg-space-950 text-star-50"
        : "light bg-paper-100 text-paper-900";
  }, [cardTheme]);

  const handleDownload = async () => {
    if (!cardRef.current || status === "working") return;
    setStatus("working");
    try {
      await downloadElementAsPng(cardRef.current, `${filename}-${cardTheme}`, {
        backgroundColor: cardTheme === "dark" ? "#0a0e17" : "#fbf7ef",
        pixelRatio: 2,
      });
      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("idle");
    }
  };

  const tabBtn = (val: "light" | "dark", label: string) => (
    <button
      type="button"
      onClick={() => setCardTheme(val)}
      style={{
        padding: "6px 16px",
        background: cardTheme === val ? "#d4b574" : "transparent",
        color: cardTheme === val ? "#1a1a1a" : "#d4b574",
        fontSize: 13,
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "auto",
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 14,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid #d4b574",
          }}
        >
          {tabBtn("light", zh ? "浅色" : "Light")}
          {tabBtn("dark", zh ? "深色" : "Dark")}
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={status === "working"}
          style={{
            padding: "8px 20px",
            background: "#d4b574",
            color: "#1a1a1a",
            borderRadius: 8,
            border: "none",
            fontWeight: 700,
            fontSize: 14,
            cursor: status === "working" ? "default" : "pointer",
          }}
        >
          {status === "working"
            ? s?.downloading || "Generating…"
            : status === "done"
              ? `✓ ${s?.download_done || "Downloaded"}`
              : s?.download || "Download image"}
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "8px 16px",
            background: "transparent",
            color: "#fff",
            borderRadius: 8,
            border: "1px solid #ffffff55",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {zh ? "关闭" : "Close"}
        </button>
      </div>

      <div
        className={cardTheme}
        style={{ boxShadow: "0 12px 60px rgba(0,0,0,0.5)", borderRadius: 8 }}
      >
        <ThemeContext.Provider value={{ theme: cardTheme, toggleTheme: noop }}>
          <ChartShareCard
            ref={cardRef}
            profile={profile}
            chartType={chartType}
          />
        </ThemeContext.Provider>
      </div>
    </div>
  );
};

export default ChartShareModal;
