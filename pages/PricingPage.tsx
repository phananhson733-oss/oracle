// INPUT: useLanguage/useTheme + UI primitives (UIComponents), SEO, useAuth (login/upgrade modals), static pricing from data/pricing.
// OUTPUT: Default-exported PricingPage — the public, indexable /:lang/pricing marketing page (plans, credits, free-vs-pro, CTA).
// POS: Top-level route page. Renders prices synchronously from data/pricing (static-first, no API on first paint) so the hydrated DOM matches the prerendered SEO stub and avoids soft-404. Registered in App.tsx (isPricingPath/isPublicRoute + routes), hooks/useLangPath PUBLIC_PREFIXED_PATHS, and scripts/generate-seo-pages.mjs. Update those + docs/PRD.md §2.14 on change.

import React, { useMemo } from "react";
import {
  Card,
  Container,
  Section,
  ActionButton,
  useLanguage,
  useTheme,
} from "../components/UIComponents";
import { SEO } from "../components/SEO";
import { useAuth } from "../contexts/AuthContext";
import {
  SUBSCRIPTION_DISPLAY_PRICING,
  CREDIT_PACKS_DISPLAY,
  YEARLY_SAVE_PERCENT,
  TRIAL_DAYS,
  formatDisplayPrice,
  displayCurrencyFor,
} from "../data/pricing";

const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined) ||
  "https://www.astrologywiki.com";

interface CompareRow {
  feature: string;
  free: string;
  pro: string;
}

const PricingPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { isAuthenticated, openLoginModal, openUpgradeModal } = useAuth();

  const lang: "en" | "zh" = language === "zh" ? "zh" : "en";
  const isDark = theme === "dark";

  const p = t.pricing;
  const currency = displayCurrencyFor(lang);
  const sub = SUBSCRIPTION_DISPLAY_PRICING[lang];
  const monthlyPrice = formatDisplayPrice(
    sub.monthly.amount,
    sub.monthly.currency,
  );
  const yearlyPrice = formatDisplayPrice(
    sub.yearly.amount,
    sub.yearly.currency,
  );

  const proBenefits: string[] = Array.isArray(t.subscription?.benefits)
    ? (t.subscription.benefits as string[])
    : [];
  const compareRows: CompareRow[] = Array.isArray(p?.compare_rows)
    ? (p!.compare_rows as CompareRow[])
    : [];

  const saveBadge = (p?.save_badge || "Save {percent}%").replace(
    "{percent}",
    String(YEARLY_SAVE_PERCENT),
  );
  const trialNote = (
    p?.trial || "{days}-day Pro trial after payment setup"
  ).replace("{days}", String(TRIAL_DAYS));

  // Anonymous CTA opens the login modal (never a 500); signed-in users get the
  // upgrade modal directly.
  const handleCta = () => {
    if (isAuthenticated) openUpgradeModal("pricing_page");
    else openLoginModal("pricing_page");
  };

  const canonicalUrl = `${SITE_URL}/${lang}/pricing`;
  const alternateLanguages = useMemo(
    () => [
      { hrefLang: "en", href: `${SITE_URL}/en/pricing` },
      { hrefLang: "zh", href: `${SITE_URL}/zh/pricing` },
      { hrefLang: "x-default", href: `${SITE_URL}/en/pricing` },
    ],
    [],
  );

  const seoTitle = p?.title || "Pricing";
  const seoDescription =
    p?.seo_description ||
    "AstrologyWiki pricing — start free, or activate a 7-day Pro trial with payment details before auto-renewal.";
  const schema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${seoTitle} | AstrologyWiki`,
      description: seoDescription,
      url: canonicalUrl,
      inLanguage: lang,
      isPartOf: {
        "@type": "WebSite",
        name: "AstrologyWiki",
        url: `${SITE_URL}/${lang}/`,
      },
    }),
    [seoTitle, seoDescription, canonicalUrl, lang],
  );

  const mutedText = isDark ? "text-star-400" : "text-paper-500";
  const highlightClass = isDark ? "text-gold-400" : "text-gold-600";
  const borderColor = isDark ? "border-gold-500/20" : "border-paper-200";

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={canonicalUrl}
        alternateLanguages={alternateLanguages}
        schema={schema}
      />

      <Container>
        {/* Header */}
        <div className="text-center py-12 md:py-16">
          <h1 className="text-4xl md:text-6xl font-serif font-semibold mb-4">
            {p?.title || "Pricing"}
          </h1>
          <p className={`text-lg max-w-2xl mx-auto ${mutedText}`}>
            {p?.subtitle || "Start free. Upgrade when you're ready."}
          </p>
        </div>

        {/* Plans */}
        <Section title={p?.plans_title || "Plans"}>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <Card className="p-6 flex flex-col">
              <h3 className="text-xl font-semibold mb-1">
                {p?.free_title || "Free"}
              </h3>
              <div className="text-3xl font-bold mb-2">
                {p?.free_price || "$0"}
              </div>
              <p className={`text-sm mb-6 ${mutedText}`}>
                {p?.free_desc ||
                  "Core charts, wiki, and the CBT journal to explore."}
              </p>
              <div className="mt-auto">
                <ActionButton
                  variant="outline"
                  className="w-full"
                  onClick={handleCta}
                >
                  {p?.cta_get_started || "Get started free"}
                </ActionButton>
              </div>
            </Card>

            {/* Pro Monthly */}
            <Card className="p-6 flex flex-col">
              <h3 className="text-xl font-semibold mb-1">
                {p?.pro_title || "Pro"} · {p?.monthly_label || "Monthly"}
              </h3>
              <div className="text-3xl font-bold mb-1">
                {monthlyPrice}
                <span className={`text-base font-normal ${mutedText}`}>
                  {p?.per_month || "/mo"}
                </span>
              </div>
              <p className={`text-sm mb-6 ${mutedText}`}>
                {p?.billing_note || "Cancel anytime"}
              </p>
              <div className="mt-auto">
                <ActionButton
                  variant="secondary"
                  className="w-full"
                  onClick={handleCta}
                >
                  {p?.cta_go_pro || "Go Pro"}
                </ActionButton>
              </div>
            </Card>

            {/* Pro Yearly (highlighted) */}
            <Card className={`p-6 flex flex-col border ${borderColor}`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-semibold">
                  {p?.pro_title || "Pro"} · {p?.yearly_label || "Yearly"}
                </h3>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full bg-gradient-primary text-space-950`}
                >
                  {p?.pro_badge || "Best value"}
                </span>
              </div>
              <div className="text-3xl font-bold mb-1">
                {yearlyPrice}
                <span className={`text-base font-normal ${mutedText}`}>
                  {p?.per_year || "/yr"}
                </span>
              </div>
              <p className={`text-sm mb-1 ${highlightClass}`}>{saveBadge}</p>
              <p className={`text-sm mb-6 ${mutedText}`}>
                {p?.first_discount || "50% off your first subscription"}
              </p>
              <div className="mt-auto">
                <ActionButton
                  variant="primary"
                  className="w-full"
                  onClick={handleCta}
                >
                  {p?.cta_go_pro || "Go Pro"}
                </ActionButton>
              </div>
            </Card>
          </div>
          <p className={`text-sm mt-4 text-center ${mutedText}`}>{trialNote}</p>
        </Section>

        {/* Pro includes */}
        {proBenefits.length > 0 && (
          <Section title={p?.pro_includes_title || "Pro includes"}>
            <div className="grid sm:grid-cols-2 gap-3">
              {proBenefits.map((benefit, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-xl p-3 border ${borderColor}`}
                >
                  <span className={highlightClass} aria-hidden="true">
                    ✓
                  </span>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Free vs Pro */}
        {compareRows.length > 0 && (
          <Section title={p?.compare_title || "Free vs Pro"}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dashed border-current/20">
                    <th className="text-left py-3 px-4">
                      {p?.col_feature || "Feature"}
                    </th>
                    <th className="text-center py-3 px-4">
                      {p?.col_free || "Free"}
                    </th>
                    <th className={`text-center py-3 px-4 ${highlightClass}`}>
                      {p?.col_pro || "Pro"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-dashed border-current/10"
                    >
                      <td className="py-3 px-4 font-medium">{row.feature}</td>
                      <td className={`text-center py-3 px-4 ${mutedText}`}>
                        {row.free}
                      </td>
                      <td className="text-center py-3 px-4">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Credit packs */}
        <Section title={p?.credits_title || "Credit packs"}>
          <p className={`text-sm mb-6 ${mutedText}`}>
            {p?.credits_subtitle ||
              "Prefer pay-as-you-go? One-time credits for Ask, synastry, and Synthetica."}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CREDIT_PACKS_DISPLAY.map((pack) => (
              <div
                key={pack.credits}
                className={`rounded-2xl p-5 border ${borderColor} text-center`}
              >
                <div className="text-2xl font-bold mb-1">
                  {pack.credits.toLocaleString()}
                </div>
                <div
                  className={`text-xs uppercase tracking-wider mb-3 ${mutedText}`}
                >
                  {p?.credits_suffix || "credits"}
                </div>
                <div className="text-lg font-semibold">
                  {formatDisplayPrice(
                    currency === "CNY" ? pack.cny : pack.usd,
                    currency,
                  )}
                </div>
                {pack.savePercent ? (
                  <div className={`text-xs mt-1 ${highlightClass}`}>
                    {(p?.save_badge || "Save {percent}%").replace(
                      "{percent}",
                      String(pack.savePercent),
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Section>

        {/* CTA */}
        <div className="text-center py-12">
          <ActionButton size="lg" onClick={handleCta}>
            {p?.cta_get_started || "Get started free"}
          </ActionButton>
          <p className={`text-xs mt-6 max-w-2xl mx-auto ${mutedText}`}>
            {p?.footnote ||
              "Prices in USD. EUR, GBP, and CNY supported at checkout. Payments processed securely by Airwallex."}
          </p>
          <p className={`text-xs mt-2 max-w-2xl mx-auto ${mutedText}`}>
            {p?.disclaimer ||
              "AstrologyWiki is an educational tool, not a substitute for professional advice."}
          </p>
        </div>
      </Container>
    </>
  );
};

export default PricingPage;
