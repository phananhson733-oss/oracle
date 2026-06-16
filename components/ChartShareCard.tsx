// INPUT: profile（出生数据）、自取的 ExtendedNatalData（行星位置）、useTheme/useLanguage、AstroChart、庙旺落陷查表、TECH_DATA glyph。
// OUTPUT: <ChartShareCard ref> —— 信息丰富的本命盘分享卡（头部+行星表含庙旺落陷+元素/模式分布+轮盘），供 html-to-image 截图导出。
// POS: 星盘分享卡布局组件（参考 Astrodienst 信息密度）。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import { forwardRef, useEffect, useState } from "react";
import * as T from "../types";
import * as Astro from "../services/astroService";
import { AstroChart } from "./AstroChart";
import { useTheme, useLanguage } from "./UIComponents";
import { TECH_DATA, MAJOR_PLANETS } from "../constants";
import {
  getEssentialDignity,
  DIGNITY_LABEL,
  type Dignity,
} from "../data/essentialDignity";

interface ChartShareCardProps {
  profile: T.UserProfile;
}

const ELEMENTS = ["Fire", "Earth", "Air", "Water"] as const;
const MODALITIES = ["Cardinal", "Fixed", "Mutable"] as const;
const ELEMENT_LABEL: Record<string, { zh: string; en: string }> = {
  Fire: { zh: "火", en: "Fire" },
  Earth: { zh: "土", en: "Earth" },
  Air: { zh: "风", en: "Air" },
  Water: { zh: "水", en: "Water" },
};
const MODALITY_LABEL: Record<string, { zh: string; en: string }> = {
  Cardinal: { zh: "主导", en: "Cardinal" },
  Fixed: { zh: "固定", en: "Fixed" },
  Mutable: { zh: "易变", en: "Mutable" },
};
const DIGNITY_TONE: Record<Dignity, string> = {
  domicile: "#3b9c6e",
  exaltation: "#c79a3a",
  detriment: "#c2603a",
  fall: "#a14b6b",
};

const planetGlyph = (name: string) =>
  TECH_DATA.PLANETS[name as keyof typeof TECH_DATA.PLANETS]?.glyph ||
  name.slice(0, 2);
const signGlyph = (sign: string) =>
  TECH_DATA.SIGNS[sign as keyof typeof TECH_DATA.SIGNS]?.glyph ||
  sign.slice(0, 1);
const signMeta = (sign: string) =>
  TECH_DATA.SIGNS[sign as keyof typeof TECH_DATA.SIGNS];

export const ChartShareCard = forwardRef<HTMLDivElement, ChartShareCardProps>(
  ({ profile }, ref) => {
    const { theme } = useTheme();
    const { language } = useLanguage();
    const zh = language === "zh";
    const isDark = theme === "dark";
    const [data, setData] = useState<T.ExtendedNatalData | null>(null);

    useEffect(() => {
      let alive = true;
      Astro.calculateExtendedNatalData(profile)
        .then((d) => {
          if (alive) setData(d);
        })
        .catch(() => {});
      return () => {
        alive = false;
      };
    }, [profile]);

    // 主题色
    const bg = isDark ? "#0a0e17" : "#fbf7ef";
    const panel = isDark ? "#11161f" : "#ffffff";
    const border = isDark ? "#27303f" : "#e7ddc9";
    const ink = isDark ? "#e8edf5" : "#2a2f3a";
    const muted = isDark ? "#8b94a6" : "#8a7f6b";
    const gold = isDark ? "#d4b574" : "#9f7645";

    const planets = (data?.planets || []).filter((p) =>
      MAJOR_PLANETS.includes(p.name),
    );

    // 元素/模式分布（按行星星座统计）
    const elemCount: Record<string, number> = {
      Fire: 0,
      Earth: 0,
      Air: 0,
      Water: 0,
    };
    const modCount: Record<string, number> = {
      Cardinal: 0,
      Fixed: 0,
      Mutable: 0,
    };
    for (const p of planets) {
      const m = signMeta(p.sign);
      if (m?.element) elemCount[m.element] = (elemCount[m.element] || 0) + 1;
      if (m?.modality) modCount[m.modality] = (modCount[m.modality] || 0) + 1;
    }

    const birthLine1 = `${profile.birthDate || ""}${profile.birthTime ? " · " + profile.birthTime : ""}`;
    const coords =
      profile.lat != null && profile.lon != null
        ? `${Math.abs(profile.lat).toFixed(2)}°${profile.lat >= 0 ? "N" : "S"}, ${Math.abs(profile.lon).toFixed(2)}°${profile.lon >= 0 ? "E" : "W"}`
        : "";
    const birthLine2 = [profile.birthCity, coords, profile.timezone]
      .filter(Boolean)
      .join(" · ");

    return (
      <div
        ref={ref}
        style={{
          width: 920,
          fontFamily:
            "-apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif",
          background: bg,
          color: ink,
          padding: 28,
          boxSizing: "border-box",
        }}
      >
        {/* 头部 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: `1px solid ${border}`,
            paddingBottom: 14,
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: gold }}>
              {profile.name || (zh ? "本命盘" : "Natal Chart")}
            </div>
            <div style={{ fontSize: 13, color: muted, marginTop: 4 }}>
              {birthLine1}
            </div>
            <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
              {birthLine2}
            </div>
          </div>
          <div
            style={{
              fontSize: 13,
              color: gold,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            AstrologyWiki
          </div>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {/* 左：行星表 + 元素/模式 */}
          <div style={{ width: 360, flexShrink: 0 }}>
            <div
              style={{
                background: panel,
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: "10px 12px",
              }}
            >
              {planets.map((p) => {
                const dig = getEssentialDignity(p.name, p.sign);
                return (
                  <div
                    key={p.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "5px 0",
                      borderBottom: `1px solid ${border}55`,
                      fontSize: 14,
                    }}
                  >
                    <span style={{ width: 20, fontSize: 16, color: gold }}>
                      {planetGlyph(p.name)}
                    </span>
                    <span style={{ width: 18, fontSize: 15, color: muted }}>
                      {signGlyph(p.sign)}
                    </span>
                    <span style={{ width: 70 }}>
                      {p.degree}°{String(p.minute ?? 0).padStart(2, "0")}'
                    </span>
                    <span style={{ width: 30, color: muted, fontSize: 12 }}>
                      {p.isRetrograde ? "℞" : ""}
                    </span>
                    <span style={{ width: 34, color: muted, fontSize: 12 }}>
                      {p.house ? (zh ? `${p.house}宫` : `${p.house}H`) : ""}
                    </span>
                    {dig && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 12,
                          color: DIGNITY_TONE[dig],
                          fontWeight: 600,
                        }}
                      >
                        {zh ? DIGNITY_LABEL[dig].zh : DIGNITY_LABEL[dig].en}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 元素 / 模式 */}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <div
                style={{
                  flex: 1,
                  background: panel,
                  border: `1px solid ${border}`,
                  borderRadius: 12,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: muted,
                    letterSpacing: 1.5,
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                >
                  {zh ? "元素" : "Elements"}
                </div>
                {ELEMENTS.map((e) => (
                  <div
                    key={e}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      padding: "2px 0",
                    }}
                  >
                    <span>
                      {zh ? ELEMENT_LABEL[e].zh : ELEMENT_LABEL[e].en}
                    </span>
                    <span style={{ color: gold, fontWeight: 600 }}>
                      {elemCount[e]}
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  flex: 1,
                  background: panel,
                  border: `1px solid ${border}`,
                  borderRadius: 12,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: muted,
                    letterSpacing: 1.5,
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                >
                  {zh ? "模式" : "Modality"}
                </div>
                {MODALITIES.map((m) => (
                  <div
                    key={m}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      padding: "2px 0",
                    }}
                  >
                    <span>
                      {zh ? MODALITY_LABEL[m].zh : MODALITY_LABEL[m].en}
                    </span>
                    <span style={{ color: gold, fontWeight: 600 }}>
                      {modCount[m]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右：轮盘 */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ width: "100%" }}>
              <AstroChart type="natal" profile={profile} scale={1} />
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            textAlign: "center",
            fontSize: 11,
            color: muted,
            letterSpacing: 1,
          }}
        >
          AstrologyWiki.com
        </div>
      </div>
    );
  },
);

ChartShareCard.displayName = "ChartShareCard";

export default ChartShareCard;
