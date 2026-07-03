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
  rearmTcfListener,
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

  // TODO(temporary, flag-on 后按字段数据处理): [PR3-B5 CLS] format=auto 响应单元实际高度常 >280，
  //   min-height 会长高下推内容产生 CLS；激活后用真实数据在 adPlacements 按断点调 minHeight
  //   （min-height 本身是 Google 推荐的响应式 CLS 缓解手段）。门控#1 结构化(B4)已由
  //   components/ads/adEligibility.ts 的 isAdEligibleArticle 收口。

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

  useEffect(() => {
    // EEA 重臂 TCF 监听（评审 L4）：GDPR 区【且 AdSense 已配置】时重置轮询预算再试，防"CMP 迟到
    // → 首次轮询放弃 → 整会话无 EEA 广告"。已注册则 no-op。未配置(flag off/无 client)不空转轮询
    // （PR3 #8）。WikiArticleDetailPage 给 AdSlot 加 key={slug}，使文章间导航 remount 触发重臂（#7）。
    if (region.isGdpr === true && isAdsenseConfigured()) rearmTcfListener();
  }, [region.isGdpr]);

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
