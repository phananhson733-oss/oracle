// INPUT: contexts/AuthContext（useContext 直读，null-safe）、hooks/useRegion、hooks/useAdConsentVersion、services/adsense。
// OUTPUT: 导出 AdSlot —— 单个手动 AdSense 广告单元，四重门控全过才渲染 <ins>；否则返回 null（不占位/不请求）。订阅同意变化实时重算门控。
// POS: 广告展示组件；若更新此文件，务必更新 components/ads/FOLDER.md。

import React, { useContext, useEffect, useRef } from "react";
import AuthContext from "../../contexts/AuthContext";
import { useRegion } from "../../hooks/useRegion";
import { useAdConsentVersion } from "../../hooks/useAdConsentVersion";
import {
  isAdsenseConfigured,
  getAdsenseClientId,
  loadAdsense,
  pushAd,
  hasAdConsent,
} from "../../services/adsense";

export interface AdSlotProps {
  slot: string; // AdSense 广告单元 ID
  format?: string;
  minHeight?: number; // 预留高度（px），防 CLS
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  slot,
  format = "auto",
  minHeight = 280,
  className,
}) => {
  // useContext 直读（而非 useAuth 包装）：AdSlot 是叶子 UI，无 AuthProvider 时降级为
  // 匿名而非抛错（保证 WikiArticleDetailPage 可在无 Provider 的 SEO 测试中独立渲染）。
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const region = useRegion();
  // 订阅广告同意变化（marketing / Do-Not-Sell / TCF）：用户在当前页授予同意后重渲染，
  // gated 重算 → 立即出广告，不必等导航（评审 B2）。返回值仅用于触发重渲染。
  useAdConsentVersion();
  const pushedRef = useRef(false);

  // TODO(temporary, PR3 前处理): flag off 下休眠（对抗式评审，详见 spec §"评审 blockers"）：
  //   [PR3-B4 结构化门控] 门控#1(仅 wiki 文章、排除 embeddedTool 漏斗/psychAdjacent 心理页)只由
  //     调用方 WikiArticleDetailPage 保证；PR3 加更多广告位时漏抄即违反红线。修：抽 isAdEligibleArticle(article)
  //     共享 helper 或让 AdSlot 要求必填 eligible prop。
  //   [PR3-B5 CLS] format=auto 响应单元实际高度常 >280，min-height 会长高下推内容产生 CLS；
  //     激活后用字段数据在 adPlacements 按断点调 minHeight（min-height 本身是 Google 推荐缓解手段）。

  // 四重门控（全真才展示）：
  //   #4 配置就绪(flag+client) · slot 非空 · #2 匿名用户 · #3 地域相关广告同意
  // 门控#1（仅 wiki 文章页）由挂载点保证：AdSlot 只被 WikiArticleDetailPage 渲染。
  const gated =
    !isAdsenseConfigured() || !slot || isAuthenticated || !hasAdConsent(region);

  useEffect(() => {
    // gated 关闭 → 重置 pushedRef，使门控再次开启时新挂载的 <ins> 能重新填充
    // （评审 B2'：gated false→true→false 场景，如同页登录再登出）。
    if (gated) {
      pushedRef.current = false;
      return;
    }
    if (pushedRef.current) return; // 去重：防 React 重挂载/StrictMode 双推
    if (!loadAdsense()) return; // 单例注入 adsbygoogle.js（head-loader 已在时不重复）
    pushedRef.current = true;
    pushAd();
  }, [gated]);

  if (gated) return null;

  return (
    <div
      className={className}
      style={{
        minHeight,
        display: "block",
        textAlign: "center",
        overflow: "hidden",
      }}
      data-ad-container=""
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight }}
        data-ad-client={getAdsenseClientId()}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSlot;
