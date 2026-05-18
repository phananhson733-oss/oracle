// INPUT: i18n translations.
// OUTPUT: STUB — Newsletter signup form shell. Will POST to /api/newsletter/subscribe (Lane 2 builds the API).
//         Honeypot field included per A4 anti-spam decision.
// POS: Below-the-fold landing section for /landing-v2.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useCallback, useState } from "react";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { trackEvent } from "../../services/analytics";

type Status = "idle" | "submitting" | "success" | "existed" | "error";

const NewsletterSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const landing = t.landing;
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (status === "submitting") return;
      // TODO(landing-v2): Wire to POST /api/newsletter/subscribe (Lane 2 dependency).
      // Expected request: { email, lang: language, source: 'landing_v2_homepage', website (honeypot) }.
      // Expected response: { success: true, existed?: boolean }.
      // For now, simulate optimistic success so the form is interactive at the visual level.
      setStatus("submitting");
      trackEvent("newsletter_submit", {
        location: "landing_v2_newsletter",
        lang: language,
      });
      window.setTimeout(() => {
        if (website.trim().length > 0) {
          // Honeypot triggered — pretend success per A4.
          setStatus("success");
        } else {
          setStatus("success");
        }
      }, 400);
    },
    [status, language, website],
  );

  const message =
    status === "success"
      ? landing.newsletter_success || "You're on the list. Watch your inbox."
      : status === "existed"
        ? landing.newsletter_existed ||
          "You're already on the list — we'll keep the cosmos coming."
        : status === "error"
          ? landing.newsletter_error ||
            "Could not subscribe. Please try again."
          : "";

  return (
    <section
      aria-labelledby="newsletter-heading"
      className={`w-full py-24 ${isDark ? "bg-space-950" : "bg-paper-100"}`}
    >
      <div className="max-w-2xl mx-auto px-6 text-center">
        <p
          className={`mb-4 text-xs uppercase tracking-[0.18em] ${
            isDark ? "text-star-400" : "text-paper-600"
          }`}
        >
          {landing.newsletter_kicker || "Newsletter"}
        </p>
        <h2
          id="newsletter-heading"
          className={`font-serif font-semibold text-3xl md:text-4xl leading-tight tracking-tight ${
            isDark ? "text-star-50" : "text-paper-900"
          }`}
        >
          {landing.newsletter_title || "Weekly cosmic insights, no spam."}
        </h2>
        <p
          className={`mt-4 text-base md:text-lg leading-relaxed ${
            isDark ? "text-star-200" : "text-paper-700"
          }`}
        >
          {landing.newsletter_subtitle ||
            "A short letter on the week's transits and one psychology lens to use them with. Unsubscribe anytime."}
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-8 flex flex-col sm:flex-row gap-3"
        >
          {/* Honeypot: hidden from real users and assistive tech */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="sr-only"
          />
          <label htmlFor="newsletter-email" className="sr-only">
            {landing.newsletter_placeholder || "your@email.com"}
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={landing.newsletter_placeholder || "your@email.com"}
            className={`flex-1 min-h-[44px] px-5 py-3 rounded-full outline-none transition-all duration-300 ease-in-out text-sm focus-visible:ring-2 focus-visible:ring-accent ${
              isDark
                ? "bg-space-900/70 border border-gold-500/15 text-star-50 placeholder:text-star-400"
                : "bg-paper-100 border border-paper-300 text-paper-900 placeholder:text-paper-400"
            }`}
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className={`inline-flex items-center justify-center rounded-full bg-accent text-paper-100 px-7 py-3 text-sm font-medium tracking-tight transition-all duration-300 ease-out hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
              isDark
                ? "focus-visible:ring-offset-space-950"
                : "focus-visible:ring-offset-paper-100"
            }`}
          >
            {landing.newsletter_button || "Subscribe"}
          </button>
        </form>

        {message && (
          <p
            role="status"
            className={`mt-4 text-sm ${
              status === "error"
                ? "text-danger"
                : isDark
                  ? "text-star-200"
                  : "text-paper-700"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </section>
  );
};

export default NewsletterSection;
