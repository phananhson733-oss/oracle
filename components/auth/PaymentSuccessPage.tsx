// INPUT: React、认证上下文与 UI 组件依赖（含卡片左侧强调样式调整）。
// OUTPUT: 导出支付成功页面组件（含统一左侧色带的卡片布局）。
// POS: 支付成功页面组件；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, useLanguage, Container, Card, ActionButton } from '../UIComponents';
import { CheckCircle, Crown, Sparkles } from 'lucide-react';

const PaymentSuccessPage: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshEntitlements } = useAuth();

  const isDark = theme === 'dark';
  const sessionId = searchParams.get('session_id');

  // Refresh entitlements after successful payment
  useEffect(() => {
    refreshEntitlements();
  }, [refreshEntitlements]);

  const translations = {
    zh: {
      title: '支付成功！',
      subtitle: '欢迎成为 Pro 会员',
      description: '您现在可以无限制地使用所有高级功能。开始探索您的星象之旅吧！',
      features: [
        '无限问答次数',
        '无限详细解读',
        '无限深度合盘分析',
        '无限 CBT 日记分析',
        '所有单次购买 7 折优惠',
      ],
      goToDashboard: '开始探索',
      viewSubscription: '查看订阅详情',
    },
    en: {
      title: 'Payment Successful!',
      subtitle: 'Welcome to Pro',
      description: 'You now have unlimited access to all premium features. Start exploring your astrological journey!',
      features: [
        'Unlimited Ask questions',
        'Unlimited detail readings',
        'Unlimited deep synastry analysis',
        'Unlimited CBT journal analysis',
        '30% off all one-time purchases',
      ],
      goToDashboard: 'Start Exploring',
      viewSubscription: 'View Subscription',
    },
  };

  const lang = t === translations.zh ? 'zh' : 'en';
  const tr = translations[lang] || translations.zh;

  return (
    <Container>
      <div className="max-w-lg mx-auto text-center py-12">
        {/* Success animation */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 animate-ping opacity-30">
            <div className="w-24 h-24 rounded-full bg-gold-500" />
          </div>
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className={`text-3xl font-serif font-bold mb-2 ${isDark ? 'text-star-50' : 'text-paper-900'}`}>
          {tr.title}
        </h1>

        {/* Subtitle with badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Crown className="w-5 h-5 text-gold-500" />
          <span className="text-xl font-medium text-gold-500">{tr.subtitle}</span>
          <Sparkles className="w-5 h-5 text-gold-500" />
        </div>

        {/* Description */}
        <p className={`mb-8 ${isDark ? 'text-star-300' : 'text-paper-500'}`}>
          {tr.description}
        </p>

        {/* Features card */}
        <Card className="mb-8 text-left border-l-2 border-l-gold-500/50">
          <ul className="space-y-3">
            {tr.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-success" />
                </div>
                <span className={isDark ? 'text-star-200' : 'text-paper-700'}>{feature}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <ActionButton
            variant="primary"
            onClick={() => navigate('/dashboard')}
            className="w-full"
          >
            {tr.goToDashboard}
          </ActionButton>

          <ActionButton
            variant="secondary"
            onClick={() => navigate('/settings')}
            className="w-full"
          >
            {tr.viewSubscription}
          </ActionButton>
        </div>

        {/* Session ID for reference */}
        {sessionId && (
          <p className={`mt-8 text-xs ${isDark ? 'text-star-400' : 'text-paper-400'}`}>
            Reference: {sessionId.substring(0, 20)}...
          </p>
        )}
      </div>
    </Container>
  );
};

export default PaymentSuccessPage;
