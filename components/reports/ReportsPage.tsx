// INPUT: React、报告客户端与 UI 组件依赖（含报告卡片左侧强调样式调整）。
// OUTPUT: 导出报告列表页面组件（含统一左侧色带的卡片布局）。
// POS: 报告列表页面组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, useLanguage, Container, Card, ActionButton } from '../UIComponents';
import {
  getAvailableReports,
  getUserReports,
  checkReportAccess,
  purchaseReport,
  ReportType,
  ReportInfo,
  Report,
  REPORT_DISPLAY,
} from '../../services/reportClient';
import { formatPrice } from '../../services/paymentClient';
import { FileText, Lock, Check, ChevronRight, Crown, Sparkles } from 'lucide-react';

const ReportsPage: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isAuthenticated, entitlements, openLoginModal, openUpgradeModal } = useAuth();

  const [availableReports, setAvailableReports] = useState<ReportInfo[]>([]);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingType, setPurchasingType] = useState<ReportType | null>(null);

  const isDark = theme === 'dark';
  const isSubscriber = entitlements?.isSubscriber;
  const discount = entitlements?.discount || 0;

  const translations = {
    zh: {
      title: '星象报告',
      subtitle: '深度解读您的命盘',
      available: '可用报告',
      myReports: '我的报告',
      noReports: '暂无已购报告',
      purchase: '购买',
      view: '查看',
      generate: '生成',
      subscriberDiscount: '订阅用户专享折扣',
      loginRequired: '登录后购买',
      purchased: '已购买',
    },
    en: {
      title: 'Astro Reports',
      subtitle: 'Deep insights into your chart',
      available: 'Available Reports',
      myReports: 'My Reports',
      noReports: 'No purchased reports yet',
      purchase: 'Purchase',
      view: 'View',
      generate: 'Generate',
      subscriberDiscount: 'Subscriber discount',
      loginRequired: 'Sign in to purchase',
      purchased: 'Purchased',
    },
  };

  const lang = t === translations.zh ? 'zh' : 'en';
  const tr = translations[lang] || translations.zh;

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [available, user] = await Promise.all([
        getAvailableReports(),
        isAuthenticated ? getUserReports() : Promise.resolve({ reports: [] }),
      ]);
      setAvailableReports(available.reports);
      setUserReports(user.reports);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (reportType: ReportType) => {
    if (!isAuthenticated) {
      openLoginModal('purchase reports');
      return;
    }

    setPurchasingType(reportType);
    try {
      const currentUrl = window.location.href;
      const successUrl = `${window.location.origin}/#/reports?purchased=${reportType}`;
      const { url } = await purchaseReport(reportType, successUrl, currentUrl);
      window.location.href = url;
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setPurchasingType(null);
    }
  };

  const handleView = (reportId: string) => {
    navigate(`/reports/${reportId}`);
  };

  const getDisplayPrice = (price: number): { original: number; discounted: number | null } => {
    if (isSubscriber && discount > 0) {
      return {
        original: price,
        discounted: Math.round(price * (1 - discount)),
      };
    }
    return { original: price, discounted: null };
  };

  const isReportPurchased = (reportType: ReportType): boolean => {
    return userReports.some(r => r.type === reportType);
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className={`text-3xl md:text-4xl font-serif font-bold mb-3 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
          {tr.title}
        </h1>
        <p className={`text-lg ${isDark ? 'text-star-300' : 'text-paper-500'}`}>
          {tr.subtitle}
        </p>
      </div>

      {/* Subscriber discount banner */}
      {isSubscriber && (
        <div className={`mb-8 p-4 rounded-xl flex items-center justify-center gap-3 ${
          isDark ? 'bg-gold-500/10 border border-gold-500/30' : 'bg-gold-50 border border-gold-200'
        }`}>
          <Crown className="w-5 h-5 text-gold-500" />
          <span className="text-gold-500 font-medium">
            {tr.subscriberDiscount}: {Math.round(discount * 100)}% off
          </span>
        </div>
      )}

      {/* My Reports Section */}
      {userReports.length > 0 && (
        <div className="mb-12">
          <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-star-100' : 'text-paper-800'}`}>
            {tr.myReports}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userReports.map(report => {
              const display = REPORT_DISPLAY[report.type];
              return (
                <Card
                  key={report.id}
                  onClick={() => handleView(report.id)}
                  className="cursor-pointer hover:scale-[1.02] transition-transform border-l-2 border-l-gold-500/50"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${display.color} flex items-center justify-center text-2xl`}>
                      {display.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${isDark ? 'text-star-100' : 'text-paper-800'}`}>
                        {lang === 'zh' ? display.nameZh : display.nameEn}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
                        Generated {new Date(report.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${isDark ? 'text-star-400' : 'text-paper-400'}`} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Reports */}
      <div>
        <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-star-100' : 'text-paper-800'}`}>
          {tr.available}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {availableReports.map(report => {
            const display = REPORT_DISPLAY[report.type];
            const purchased = isReportPurchased(report.type);
            const { original, discounted } = getDisplayPrice(report.price);
            const isPurchasing = purchasingType === report.type;

            return (
              <Card key={report.type} className="overflow-hidden border-l-2 border-l-gold-500/50">
                {/* Header with gradient */}
                <div className={`-m-6 mb-4 p-6 bg-gradient-to-br ${display.color} bg-opacity-10`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{display.icon}</span>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
                          {lang === 'zh' ? display.nameZh : display.nameEn}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-star-300' : 'text-paper-600'}`}>
                          {lang === 'zh' ? display.descZh : display.descEn}
                        </p>
                      </div>
                    </div>
                    {purchased && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/20 text-success text-xs font-medium">
                        <Check className="w-3 h-3" />
                        {tr.purchased}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="pt-4">
                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-4">
                    {discounted ? (
                      <>
                        <span className={`text-2xl font-bold ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
                          {formatPrice(discounted)}
                        </span>
                        <span className={`text-sm line-through ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
                          {formatPrice(original)}
                        </span>
                      </>
                    ) : (
                      <span className={`text-2xl font-bold ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
                        {formatPrice(original)}
                      </span>
                    )}
                  </div>

                  {/* Action button */}
                  {purchased ? (
                    <ActionButton
                      variant="secondary"
                      onClick={() => {
                        const existingReport = userReports.find(r => r.type === report.type);
                        if (existingReport) handleView(existingReport.id);
                      }}
                      className="w-full"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" />
                        {tr.view}
                      </span>
                    </ActionButton>
                  ) : (
                    <ActionButton
                      variant="primary"
                      onClick={() => handlePurchase(report.type)}
                      disabled={isPurchasing}
                      className="w-full"
                    >
                      {isPurchasing ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          {!isAuthenticated ? (
                            <>
                              <Lock className="w-4 h-4" />
                              {tr.loginRequired}
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              {tr.purchase}
                            </>
                          )}
                        </span>
                      )}
                    </ActionButton>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Upgrade prompt for non-subscribers */}
      {!isSubscriber && isAuthenticated && (
        <Card className="mt-12 text-center border-l-2 border-l-gold-500/50">
          <div className="py-4">
            <Crown className="w-12 h-12 mx-auto mb-4 text-gold-500" />
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-star-100' : 'text-paper-800'}`}>
              {lang === 'zh' ? '升级 Pro 享受 30% 折扣' : 'Upgrade to Pro for 30% off all reports'}
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-star-400' : 'text-paper-500'}`}>
              {lang === 'zh' ? '订阅用户购买所有报告均可享受七折优惠' : 'Pro subscribers get 30% off on all report purchases'}
            </p>
            <ActionButton variant="secondary" onClick={() => openUpgradeModal()}>
              {lang === 'zh' ? '了解 Pro' : 'Learn about Pro'}
            </ActionButton>
          </div>
        </Card>
      )}
    </Container>
  );
};

export default ReportsPage;
