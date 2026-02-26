// INPUT: i18n translations, router navigation, analytics tracking.
// OUTPUT: Landing page with hero section, CTA button, and SEO schema.
// POS: Landing page component; 若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, ActionButton, useLanguage } from '../components/UIComponents';
import { SEO } from '../components/SEO';
import { trackEvent } from '../services/analytics';

const LandingPage: React.FC = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://www.astrologywiki.com';
    const lang = language === 'en' ? 'en' : 'zh';
    const canonicalUrl = `${siteUrl}/${lang}/`;
    const alternateLanguages = [
        { hrefLang: 'zh', href: `${siteUrl}/zh/` },
        { hrefLang: 'en', href: `${siteUrl}/en/` },
        { hrefLang: 'x-default', href: `${siteUrl}/en/` },
    ];

    const webSiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'AstrologyWiki',
        url: canonicalUrl,
        inLanguage: lang,
        potentialAction: {
            '@type': 'SearchAction',
            target: `${siteUrl}/${lang}/wiki?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    };

    const softwareAppSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'AstroMind',
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web',
        description: 'AI-powered astrology app for natal charts, daily forecasts, and psychological self-discovery.',
        url: siteUrl,
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
    };

    const handleStart = async () => {
        trackEvent('cta_clicked', {
            cta_text: t.app.landing_btn,
            location: 'landing_hero',
        });
        navigate('/onboarding');
    };

    return (
        <>
            <SEO
                description={t.app.sub_tagline}
                url={canonicalUrl}
                alternateLanguages={alternateLanguages}
                schema={[webSiteSchema, softwareAppSchema]}
                type="website"
            />
            <Container className="flex items-center justify-center !pt-0 text-center relative overflow-hidden">
                <div className="max-w-md relative z-10 animate-fade-in">
                    <div className="text-6xl md:text-8xl mb-8 mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-500 font-serif">☾</div>
                    <h1 className="text-5xl md:text-6xl font-serif font-medium mb-6 leading-tight tracking-tight">{t.app.name}</h1>
                    <p className="text-lg opacity-80 mb-10 leading-relaxed font-light px-4">{t.app.tagline}</p>

                    <ActionButton onClick={handleStart} size="lg" className="mx-auto max-w-xs shadow-glow">
                        {t.app.landing_btn}
                    </ActionButton>

                    <p className="mt-8 text-xs opacity-70 font-mono tracking-widest uppercase">
                        Psychology × Astrology
                    </p>
                </div>
            </Container>
        </>
    );
};

export default LandingPage;
