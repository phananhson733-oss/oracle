// INPUT: Entitlement context, auth context, purchase history API.
// OUTPUT: Credits usage page showing balance, plan info, and purchase history.
// POS: Credits usage page component; 若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Container, Card, Section, ActionButton, useTheme, useLanguage } from '../components/UIComponents';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEntitlement } from '../contexts/EntitlementContext';
import { getPurchasesV2, type PurchaseRecord } from '../services/entitlementClientV2';
import { FREE_MODE, LOGIN_GATE_MODE } from '../constants';

const CreditsUsagePage: React.FC = () => {
    const { theme } = useTheme();
    const { language } = useLanguage();
    const { isAuthenticated, openLoginModal, openUpgradeModal, openCreditsModal } = useAuth();
    const { entitlements } = useEntitlement();
    const navigate = useNavigate();
    const [records, setRecords] = useState<PurchaseRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const balance = entitlements?.credits ?? 0;
    const isSubscriber = entitlements?.isSubscriber ?? false;

    const translations = {
        zh: {
            title: '使用情况',
            subtitle: '积分余额与消费记录',
            plan: '当前方案',
            plan_free: '免费',
            plan_pro: '订阅',
            upgrade: '升级',
            topup: '充值积分',
            balance: '积分余额',
            bonus: '订阅赠送积分（每次）',
            records: '积分记录',
            detail: '详情',
            date: '日期',
            change: '积分变更',
            empty: '暂无积分记录',
            login: '登录后查看积分',
            load_error: '加载记录失败',
        },
        en: {
            title: 'Usage',
            subtitle: 'Credits balance and history',
            plan: 'Plan',
            plan_free: 'Free',
            plan_pro: 'Subscriber',
            upgrade: 'Upgrade',
            topup: 'Add Credits',
            balance: 'Credits balance',
            bonus: 'Subscription bonus (per payment)',
            records: 'Credits history',
            detail: 'Detail',
            date: 'Date',
            change: 'Change',
            empty: 'No records yet',
            login: 'Sign in to view credits',
            load_error: 'Failed to load history',
        },
    };

    const tr = language === 'zh' ? translations.zh : translations.en;

    useEffect(() => {
        if (!isAuthenticated) return;
        setLoading(true);
        setLoadError(null);
        getPurchasesV2()
            .then((res) => setRecords(res.purchases))
            .catch((err) => setLoadError(err instanceof Error ? err.message : tr.load_error))
            .finally(() => setLoading(false));
    }, [isAuthenticated, tr.load_error]);

    const isCreditTopUp = (record: PurchaseRecord) =>
        record.featureType === 'gm_credit' || record.featureType === 'credits';

    const formatLabel = (record: PurchaseRecord) => {
        const map: Record<string, { zh: string; en: string }> = {
            gm_credit: { zh: '积分充值/赠送', en: 'Credits top-up' },
            credits: { zh: '积分充值/赠送', en: 'Credits top-up' },
            dimension: { zh: '心理维度', en: 'Dimension' },
            core_theme: { zh: '核心主题', en: 'Core theme' },
            detail: { zh: '详情解锁', en: 'Detail unlock' },
            daily_script: { zh: '今日剧本', en: 'Daily script' },
            daily_transit: { zh: '星象详情', en: 'Transit detail' },
            synastry: { zh: '合盘', en: 'Synastry' },
            synastry_detail: { zh: '合盘详情', en: 'Synastry detail' },
            ask: { zh: 'Ask 问答', en: 'Ask question' },
            cbt_stats: { zh: 'CBT 统计', en: 'CBT stats' },
            synthetica: { zh: 'Synthetica', en: 'Synthetica' },
            report: { zh: '付费报告', en: 'Report' },
        };
        const label = map[record.featureType];
        return label ? (language === 'zh' ? label.zh : label.en) : record.featureType;
    };

    const getPointsChange = (record: PurchaseRecord) => {
        if (isCreditTopUp(record)) {
            return record.quantity ?? 0;
        }
        return record.priceCents ? -record.priceCents : 0;
    };

    if (!isAuthenticated) {
        return (
            <>
            <SEO title="Credits & Usage" robots="noindex,nofollow" />
            <Container>
                <Card className="text-center py-12">
                    <div className="text-sm opacity-70 mb-4">{tr.login}</div>
                    <ActionButton onClick={() => openLoginModal(tr.login)}>{tr.login}</ActionButton>
                </Card>
            </Container>
            </>
        );
    }

    return (
        <>
        <SEO title="Credits & Usage" robots="noindex,nofollow" />
        <Container>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-space-900/60 hover:bg-gold-500/20 hover:text-gold-400' : 'bg-paper-200 border border-paper-300 hover:bg-paper-300'}`}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif font-medium">{tr.title}</h1>
                        <p className="text-sm opacity-70">{tr.subtitle}</p>
                    </div>
                </div>
                {!FREE_MODE && !LOGIN_GATE_MODE && !isSubscriber && (
                    <ActionButton variant="outline" onClick={() => openUpgradeModal()}>
                        {tr.upgrade}
                    </ActionButton>
                )}
            </div>

            <Section title={tr.balance}>
                <Card className="mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">{tr.plan}</div>
                            <div className="text-lg font-medium">{isSubscriber ? tr.plan_pro : tr.plan_free}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">{tr.balance}</div>
                            <div className="text-2xl font-semibold text-gold-500">{balance}</div>
                        </div>
                    </div>
                    <div className="mt-4 text-xs opacity-70">
                        {tr.bonus}：500
                    </div>
                    {/* 充值和升级按钮 */}
                    {!FREE_MODE && !LOGIN_GATE_MODE && <div className="mt-4 flex gap-2">
                        <ActionButton
                            size="sm"
                            onClick={() => openCreditsModal()}
                            className="flex-1"
                        >
                            {tr.topup}
                        </ActionButton>
                        {!isSubscriber && (
                            <ActionButton
                                size="sm"
                                variant="outline"
                                onClick={() => openUpgradeModal()}
                                className="flex-1"
                            >
                                {tr.upgrade}
                            </ActionButton>
                        )}
                    </div>}
                </Card>
            </Section>

            <Section title={tr.records}>
                <Card>
                    <div className="grid grid-cols-[1.4fr_0.9fr_0.6fr] text-xs uppercase tracking-widest opacity-60 pb-3 border-b border-current/10">
                        <span>{tr.detail}</span>
                        <span>{tr.date}</span>
                        <span className="text-right">{tr.change}</span>
                    </div>
                    {loading && (
                        <div className="py-6 text-sm opacity-70 text-center">{language === 'zh' ? '加载中...' : 'Loading...'}</div>
                    )}
                    {loadError && (
                        <div className="py-6 text-sm text-center text-danger">{loadError}</div>
                    )}
                    {!loading && !loadError && records.length === 0 && (
                        <div className="py-6 text-sm opacity-70 text-center">{tr.empty}</div>
                    )}
                    {!loading && !loadError && records.length > 0 && (
                        <div className="divide-y divide-current/5">
                            {records.map((record) => {
                                const change = getPointsChange(record);
                                if (!change) return null;
                                const changeColor = change > 0 ? 'text-success' : 'text-danger';
                                return (
                                    <div key={record.id} className="grid grid-cols-[1.4fr_0.9fr_0.6fr] py-3 text-sm">
                                        <div>
                                            <div className="font-medium">{formatLabel(record)}</div>
                                        </div>
                                        <div className="text-xs opacity-70">
                                            {new Date(record.createdAt).toLocaleString()}
                                        </div>
                                        <div className={`text-right font-semibold ${changeColor}`}>
                                            {change > 0 ? `+${change}` : `${change}`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </Section>
        </Container>
        </>
    );
};

export default CreditsUsagePage;
