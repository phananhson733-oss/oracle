// INPUT: User profile, reset callback, auth/entitlement context.
// OUTPUT: Settings page with account info, preferences, GM tools, danger zone.
// POS: Settings page component; 若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Container, Card, Section, ActionButton, Modal, useTheme, useLanguage } from '../components/UIComponents';
import * as T from '../types';
import { FREE_MODE, LOGIN_GATE_MODE } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useEntitlement } from '../contexts/EntitlementContext';
import { deleteAccount, exportData } from '../services/authClient';
import { cancelSubscription } from '../services/paymentClient';

// --- Helper sub-components (only used by SettingsPage) ---

const SubscriptionExpiry: React.FC<{ expiresAt?: string; language: string }> = ({ expiresAt, language }) => {
  if (!expiresAt) return null;
  const d = new Date(expiresAt);
  if (isNaN(d.getTime())) return null;
  const label = language === 'zh'
    ? `有效期：${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`
    : `Valid until: ${d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`;
  return <div className="text-xs opacity-60 mt-0.5">{label}</div>;
};

const DangerZoneSection: React.FC<{ user: any; language: string; theme: string }> = ({ user, language, theme }) => {
    const { t } = useLanguage();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [exportLoading, setExportLoading] = useState(false);

    const s = t.settings as Record<string, any>;

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const blob = await exportData();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'astromind-data-export.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExportLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        setDeleteError(null);
        try {
            await deleteAccount(user?.provider === 'email' ? deletePassword : undefined);
            logout();
            navigate('/');
        } catch (err: any) {
            setDeleteError(err.message || 'Failed to delete account');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <Section title={s.danger_zone || 'Danger Zone'}>
            <Card className={`mb-4 border-l-4 border-l-red-500 ${theme === 'dark' ? 'bg-red-500/5' : 'bg-red-50'}`}>
                {/* Export Data */}
                <div className="mb-6">
                    <div className="font-bold text-sm mb-1">{s.export_data || 'Export My Data'}</div>
                    <div className="text-xs opacity-70 mb-3">{s.export_data_desc || 'Download all your personal data as a JSON file'}</div>
                    <ActionButton onClick={handleExport} disabled={exportLoading} size="sm" variant="outline" className="w-full">
                        {exportLoading ? (s.export_loading || 'Preparing export...') : (s.export_data || 'Export My Data')}
                    </ActionButton>
                </div>

                {/* Delete Account */}
                <div className={`pt-4 border-t ${theme === 'dark' ? 'border-red-500/20' : 'border-red-200'}`}>
                    <div className="font-bold text-sm text-red-500 mb-1">{s.delete_account || 'Delete Account'}</div>
                    <div className="text-xs opacity-70 mb-3">{s.delete_account_desc || 'Permanently delete your account and all associated data.'}</div>
                    <ActionButton
                        onClick={() => setShowDeleteModal(true)}
                        size="sm"
                        className="bg-red-600 border-red-600 text-white hover:bg-red-500 w-full"
                    >
                        {s.delete_account || 'Delete Account'}
                    </ActionButton>
                </div>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteError(null); setDeletePassword(''); }} title={s.delete_confirm_title || 'Delete Account?'}>
                <div className="space-y-4">
                    <p className={`text-sm ${theme === 'dark' ? 'text-star-200' : 'text-paper-600'}`}>
                        {s.delete_confirm_desc || 'This will permanently delete your account, subscription, and all data. This cannot be undone.'}
                    </p>
                    {user?.provider === 'email' && (
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1 block">
                                {s.delete_confirm_password || 'Enter your password to confirm'}
                            </label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className={`w-full rounded-lg px-3 py-2 text-sm border ${theme === 'dark' ? 'bg-space-900 border-space-700 text-star-50' : 'bg-white border-paper-300 text-paper-900'}`}
                                placeholder="••••••••"
                            />
                        </div>
                    )}
                    {deleteError && (
                        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                            {deleteError}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <ActionButton
                            onClick={() => { setShowDeleteModal(false); setDeleteError(null); setDeletePassword(''); }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                        >
                            {s.delete_cancel_btn || 'Cancel'}
                        </ActionButton>
                        <ActionButton
                            onClick={handleDelete}
                            disabled={deleteLoading || (user?.provider === 'email' && !deletePassword)}
                            size="sm"
                            className="flex-1 bg-red-600 border-red-600 text-white hover:bg-red-500"
                        >
                            {deleteLoading ? (s.delete_loading || 'Deleting...') : (s.delete_confirm_btn || 'Yes, Delete')}
                        </ActionButton>
                    </div>
                </div>
            </Modal>
        </Section>
    );
};

// --- Main SettingsPage component ---

const SettingsPage: React.FC<{ profile: T.UserProfile; onReset: () => void }> = ({ profile, onReset }) => {
    const { t, language, toggleLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const { refreshEntitlements: refreshLegacyEntitlements, user, logout, openUpgradeModal, openCreditsModal } = useAuth();
    const { refreshEntitlements: refreshV2Entitlements, isTrialing, trialDaysLeft, entitlements } = useEntitlement();
    const navigate = useNavigate();

    // Cancel subscription flow
    const [showCancelFlow, setShowCancelFlow] = useState(false);
    const [cancelStep, setCancelStep] = useState<'reason' | 'confirm'>('reason');
    const [cancelReason, setCancelReason] = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);

    const handleCancelSubscription = async () => {
        setCancelLoading(true);
        setCancelError(null);
        try {
            await cancelSubscription(cancelReason);
            await Promise.allSettled([refreshLegacyEntitlements(), refreshV2Entitlements()]);
            setShowCancelFlow(false);
            setCancelStep('reason');
            setCancelReason('');
        } catch (err) {
            setCancelError(err instanceof Error ? err.message : 'Failed to cancel');
        } finally {
            setCancelLoading(false);
        }
    };

    // Trial countdown state
    const [trialCountdown, setTrialCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    // Calculate and update trial countdown
    useEffect(() => {
        if (!isTrialing || !entitlements?.trialEndsAt) {
            setTrialCountdown(null);
            return;
        }

        const updateCountdown = () => {
            const now = Date.now();
            const trialEnd = new Date(entitlements.trialEndsAt!).getTime();
            const diff = trialEnd - now;

            if (diff <= 0) {
                setTrialCountdown(null);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTrialCountdown({ days, hours, minutes, seconds });
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);

        return () => clearInterval(timer);
    }, [isTrialing, entitlements?.trialEndsAt]);

    return (
        <>
        <SEO title="Settings" robots="noindex,nofollow" />
        <Container>
            <h1 className="text-3xl font-serif font-medium mb-8">{t.settings.title}</h1>

            <Section title={language === 'zh' ? '账号' : 'Account'}>
                <Card className="mb-4">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-gold-500/20" />
                            ) : (
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-2 border-gold-500/20 ${theme === 'dark' ? 'bg-space-800 text-star-500' : 'bg-paper-200 text-paper-500'}`}>
                                    {profile.name?.[0] || user?.email?.[0] || '?'}
                                </div>
                            )}
                            <div>
                                <div className="font-serif text-xl">{profile.name}</div>
                                <div className="text-sm opacity-60 font-mono">{user?.email}</div>
                            </div>
                        </div>

                        <div>
                            {entitlements?.isSubscriber ? (
                                <div className="text-right">
                                    <span className="font-bold text-gold-500 flex items-center gap-1">
                                        <span>✦</span> {language === 'zh' ? 'Pro 会员' : 'Pro Member'}
                                    </span>
                                    <SubscriptionExpiry expiresAt={entitlements?.subscription?.expiresAt} language={language} />
                                </div>
                            ) : (!FREE_MODE && !LOGIN_GATE_MODE) ? (
                                <ActionButton onClick={() => openUpgradeModal()} size="sm" className="shadow-glow px-6">
                                    {t.paywall?.unlock_unlimited_access || 'Unlock Unlimited'}
                                </ActionButton>
                            ) : null}
                        </div>
                    </div>

                    {/* Credits Section */}
                    {!FREE_MODE && !LOGIN_GATE_MODE && <div className={`py-4 my-4 border-y ${theme === 'dark' ? 'border-space-700' : 'border-paper-200'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-gold-500 text-xl">✦</span>
                                <div className="text-left">
                                    <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">
                                        {language === 'zh' ? '积分余额' : 'Credits Balance'}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold text-gold-500 min-w-[7ch] tabular-nums">
                                            {(entitlements?.credits ?? 0).toLocaleString()}
                                        </span>
                                        <ActionButton
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openCreditsModal()}
                                            className="border-gold-500/50 text-gold-500 hover:bg-gold-500/10"
                                        >
                                            {language === 'zh' ? '增加积分' : 'Add Credits'}
                                        </ActionButton>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/usage')}
                                className={`flex items-center gap-1 text-sm transition-colors ${theme === 'dark' ? 'text-star-400 hover:text-star-200' : 'text-paper-500 hover:text-paper-700'}`}
                            >
                                <span>{language === 'zh' ? '记录' : 'History'}</span>
                                <span>›</span>
                            </button>
                        </div>
                    </div>}

                    <ActionButton onClick={() => { logout(); navigate('/'); }} size="sm" variant="secondary" className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50">
                        {language === 'zh' ? '退出登录' : 'Log Out'}
                    </ActionButton>
                </Card>
            </Section>

            <Section title={t.settings.profile}>
                <Card className="mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{language === 'zh' ? '姓名' : 'Name'}</div>
                            <div>{profile.name || '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{language === 'zh' ? '出生日期' : 'Birth Date'}</div>
                            <div>{profile.birthDate || '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{language === 'zh' ? '出生时间' : 'Birth Time'}</div>
                            <div>{profile.birthTime || (profile.accuracyLevel === 'time_unknown' ? (language === 'zh' ? '未知' : 'Unknown') : '-')}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{language === 'zh' ? '出生地点' : 'Birth Place'}</div>
                            <div>{profile.birthCity || '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{language === 'zh' ? '时区' : 'Timezone'}</div>
                            <div>{profile.timezone || '-'}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{language === 'zh' ? '准确度' : 'Accuracy'}</div>
                            <div>{profile.accuracyLevel === 'exact' ? (language === 'zh' ? '精确' : 'Exact') : (language === 'zh' ? '时间未知' : 'Time Unknown')}</div>
                        </div>
                    </div>
                </Card>
            </Section>

            {!FREE_MODE && !LOGIN_GATE_MODE && isTrialing && trialDaysLeft !== null && trialDaysLeft > 0 && (
                <Section title={t.settings.trial_title}>
                    <Card className={`mb-4 border-l-4 border-l-amber-500 ${theme === 'dark' ? 'bg-amber-500/5' : 'bg-amber-50'}`}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <div className="text-sm text-amber-600 mb-3">
                                    {t.settings.trial_desc.replace('{days}', String(trialDaysLeft))}
                                </div>
                                {/* Countdown Timer */}
                                {trialCountdown && (
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs uppercase tracking-widest ${theme === 'dark' ? 'text-star-400' : 'text-paper-500'}`}>
                                            {language === 'zh' ? '剩余时间' : 'Time Left'}
                                        </span>
                                        <div className="flex items-center gap-1 font-mono">
                                            <span className={`px-2 py-1 rounded ${theme === 'dark' ? 'bg-space-800 text-amber-400' : 'bg-amber-100 text-amber-700'} text-sm font-bold`}>
                                                {String(trialCountdown.days).padStart(2, '0')}
                                            </span>
                                            <span className="text-amber-500">:</span>
                                            <span className={`px-2 py-1 rounded ${theme === 'dark' ? 'bg-space-800 text-amber-400' : 'bg-amber-100 text-amber-700'} text-sm font-bold`}>
                                                {String(trialCountdown.hours).padStart(2, '0')}
                                            </span>
                                            <span className="text-amber-500">:</span>
                                            <span className={`px-2 py-1 rounded ${theme === 'dark' ? 'bg-space-800 text-amber-400' : 'bg-amber-100 text-amber-700'} text-sm font-bold`}>
                                                {String(trialCountdown.minutes).padStart(2, '0')}
                                            </span>
                                            <span className="text-amber-500">:</span>
                                            <span className={`px-2 py-1 rounded ${theme === 'dark' ? 'bg-space-800 text-amber-400' : 'bg-amber-100 text-amber-700'} text-sm font-bold`}>
                                                {String(trialCountdown.seconds).padStart(2, '0')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <ActionButton
                                onClick={() => openUpgradeModal()}
                                size="sm"
                                className="bg-amber-500 hover:bg-amber-400 text-space-950 border-amber-500 whitespace-nowrap"
                            >
                                {language === 'zh' ? '立即续期' : 'Renew Now'}
                            </ActionButton>
                        </div>
                    </Card>
                </Section>
            )}

            <Section title="Preferences">
                <Card className="mb-4 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-sm mb-1">{t.settings.language}</div>
                        <div className="text-xs opacity-70">{language === 'en' ? 'English' : '中文'}</div>
                    </div>
                    <ActionButton onClick={toggleLanguage} size="sm" variant="outline">
                        {language === 'en' ? 'Switch to 中文' : 'Switch to English'}
                    </ActionButton>
                </Card>
                 <Card className="mb-4 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-sm mb-1">{t.settings.theme}</div>
                        <div className="text-xs opacity-70">{theme === 'dark' ? t.settings.theme_dark : t.settings.theme_light}</div>
                    </div>
                    <ActionButton onClick={toggleTheme} size="sm" variant="outline">
                        {theme === 'dark' ? '☀ Light' : '☾ Dark'}
                    </ActionButton>
                </Card>
                <Card className="mb-4">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <div className="font-bold text-sm mb-1">{t.settings.zodiac_system}</div>
                            <div className="text-xs opacity-70">{t.settings.zodiac_tropical}</div>
                        </div>
                        <span className="text-xs font-mono opacity-40 uppercase">{t.settings.fixed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="font-bold text-sm mb-1">{t.settings.house_system}</div>
                            <div className="text-xs opacity-70">Placidus</div>
                        </div>
                        <span className="text-xs font-mono opacity-40 uppercase">{t.settings.fixed}</span>
                    </div>
                </Card>
            </Section>

            <Section title="Data">
                <Card className="border-l border-l-danger/40">
                    <div className="mb-4">
                        <div className="font-bold text-sm text-danger mb-1">{t.settings.reset}</div>
                        <div className="text-xs opacity-70">{t.settings.reset_desc}</div>
                    </div>
                    <ActionButton onClick={onReset} size="sm" className="bg-danger border-danger text-star-50 hover:bg-danger/80 w-full">
                        {t.settings.reset_btn}
                    </ActionButton>
                </Card>
            </Section>

            <DangerZoneSection user={user} language={language} theme={theme} />

            {/* Cancel Subscription — hidden in a small link after danger zone */}
            {entitlements?.isSubscriber && !entitlements?.isTrialing && entitlements?.subscription?.provider === 'airwallex' && (
                <div className="text-center mt-2 mb-6">
                    <button
                        onClick={() => { setShowCancelFlow(true); setCancelStep('reason'); setCancelError(null); }}
                        className={`text-xs underline opacity-40 hover:opacity-70 transition-opacity ${theme === 'dark' ? 'text-star-400' : 'text-paper-400'}`}
                    >
                        {language === 'zh' ? '取消订阅' : 'Cancel subscription'}
                    </button>
                </div>
            )}

            {/* Cancel subscription multi-step modal */}
            <Modal
                isOpen={showCancelFlow}
                onClose={() => { setShowCancelFlow(false); setCancelStep('reason'); setCancelReason(''); }}
                title={language === 'zh' ? '取消订阅' : 'Cancel Subscription'}
            >
                {cancelStep === 'reason' ? (
                    <div className="space-y-4">
                        <p className={`text-sm ${theme === 'dark' ? 'text-star-200' : 'text-paper-600'}`}>
                            {language === 'zh'
                                ? '我们很遗憾听到您想要取消。能告诉我们原因吗？这将帮助我们改进服务。'
                                : "We're sorry to see you go. Could you tell us why? This helps us improve."}
                        </p>
                        <div className="space-y-2">
                            {(language === 'zh'
                                ? ['功能不符合预期', '价格太高', '使用频率不高', '找到了更好的替代', '其他原因']
                                : ["Doesn't meet my needs", 'Too expensive', "Don't use it enough", 'Found a better alternative', 'Other']
                            ).map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => setCancelReason(reason)}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm border transition-all ${
                                        cancelReason === reason
                                            ? 'border-red-500/60 bg-red-500/10 text-red-500'
                                            : theme === 'dark'
                                                ? 'border-space-700 hover:border-space-600 text-star-300'
                                                : 'border-paper-200 hover:border-paper-300 text-paper-600'
                                    }`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <ActionButton
                                variant="secondary"
                                onClick={() => { setShowCancelFlow(false); setCancelReason(''); }}
                                className="flex-1"
                                size="sm"
                            >
                                {language === 'zh' ? '我再想想' : 'Never mind'}
                            </ActionButton>
                            <ActionButton
                                variant="secondary"
                                onClick={() => setCancelStep('confirm')}
                                disabled={!cancelReason}
                                className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10 disabled:opacity-30"
                                size="sm"
                            >
                                {language === 'zh' ? '继续取消' : 'Continue'}
                            </ActionButton>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'}`}>
                            <p className="text-sm font-medium text-amber-600 mb-2">
                                {language === 'zh' ? '取消后您将失去：' : "You'll lose access to:"}
                            </p>
                            <ul className="text-xs text-amber-600/80 space-y-1">
                                <li>• {language === 'zh' ? '无限详情解读（自我 / 今日 / 合盘）' : 'Unlimited detail access (Me / Today / Us)'}</li>
                                <li>• {language === 'zh' ? '每周额外 7 次 Ask 提问' : '7 extra Ask questions per week'}</li>
                                <li>• {language === 'zh' ? '每次续费赠送 100 积分' : '100 bonus credits per payment'}</li>
                                <li>• {language === 'zh' ? '报告享 8 折优惠' : '20% off all reports'}</li>
                            </ul>
                        </div>
                        {cancelError && (
                            <p className="text-sm text-red-500">{cancelError}</p>
                        )}
                        <div className="flex gap-3">
                            <ActionButton
                                variant="primary"
                                onClick={() => { setShowCancelFlow(false); setCancelStep('reason'); setCancelReason(''); }}
                                className="flex-1"
                                size="sm"
                            >
                                {language === 'zh' ? '保留订阅' : 'Keep Subscription'}
                            </ActionButton>
                            <ActionButton
                                variant="secondary"
                                onClick={handleCancelSubscription}
                                disabled={cancelLoading}
                                className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                                size="sm"
                            >
                                {cancelLoading
                                    ? (language === 'zh' ? '处理中...' : 'Cancelling...')
                                    : (language === 'zh' ? '确认取消' : 'Confirm Cancel')}
                            </ActionButton>
                        </div>
                    </div>
                )}
            </Modal>

        </Container>
        </>
    );
};

export default SettingsPage;
