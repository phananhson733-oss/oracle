import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useLanguage, useTheme } from "../UIComponents";
import { useAuth } from "../../contexts/AuthContext";
import { trackEvent } from "../../services/analytics";
import { getLandingUtm } from "../../services/landingUtm";
import { BIRTH_CHART_ANCHOR_ID } from "../../hooks/useScrollToBirthChart";

const WikiChartCTA: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || isAuthenticated) return null;

  const wiki = t.wiki;
  // Anon high-intent CTA → embedded free birth-chart tool on the landing page
  // (with #birth-chart-tool so it scrolls/focuses on arrival) instead of the
  // /auth login wall. Closes the wiki→tool funnel break (backlog #6);
  // LandingPage's useBirthChartHashScroll handles the post-nav scroll.
  const toolHref = `/landing-v2/${language === "zh" ? "zh" : "en"}/#${BIRTH_CHART_ANCHOR_ID}`;

  const handleClick = () => {
    trackEvent("wiki_cta_clicked", {
      source: "article_bottom",
      destination: "birth_chart_tool",
      ...getLandingUtm(),
    });
  };

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border p-8 text-center ${
        theme === "dark"
          ? "border-gold-500/20 bg-gradient-to-br from-space-800/80 to-space-900/80"
          : "border-gold-500/30 bg-gradient-to-br from-paper-100 to-paper-200"
      }`}
    >
      <div className="relative z-10 space-y-4">
        <div className="inline-flex items-center gap-2 text-gold-500">
          <Sparkles size={20} />
          <span className="text-xs font-bold uppercase tracking-[0.2em]">
            {wiki?.cta_kicker || "Personal Chart"}
          </span>
          <Sparkles size={20} />
        </div>
        <h3 className="text-xl font-serif font-semibold">
          {wiki?.cta_title || "Curious what this means in your birth chart?"}
        </h3>
        <p
          className={`text-sm max-w-md mx-auto ${
            theme === "dark" ? "text-star-400" : "text-paper-500"
          }`}
        >
          {wiki?.cta_description ||
            "Enter your birth details and get an AI-powered personalized natal chart reading."}
        </p>
        <Link
          to={toolHref}
          onClick={handleClick}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 text-space-950 font-bold text-sm hover:from-gold-500 hover:to-gold-400 transition-all shadow-lg shadow-gold-500/20"
        >
          {wiki?.cta_button || "Get Started Free"}
        </Link>
      </div>
    </section>
  );
};

export default WikiChartCTA;
