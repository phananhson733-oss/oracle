// INPUT: i18n translations, apiClient.subscribeNewsletter, analytics.
// OUTPUT: Newsletter signup form — submits via shared apiClient (timeout +
//         code-only error mapping). Emits submit_attempt + submit_success /
//         _existed / _rate_limited / _error outcomes so the visit→subscribe
//         funnel is measurable end-to-end (was: only the attempt event).
// POS: Below-the-fold landing section for /landing-v2.
//      若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import React, { useCallback, useState } from "react";
import { useLanguage, useTheme } from "../../components/UIComponents";
import { trackEvent } from "../../services/analytics";
import { subscribeNewsletter } from "../../services/apiClient";
import { getLandingUtm } from "../../services/landingUtm";

type Status =
  | "idle"
  | "submitting"
  | "success"
  | "existed"
  | "rate_limited"
  | "error";

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
      setStatus("submitting");
      trackEvent("newsletter_submit_attempt", {
        location: "landing_v2_newsletter",
        lang: language,
      });

      const result = await subscribeNewsletter({
        email,
        honeypotWebsite: website,
      });

      // Fire stable outcome events so the funnel (visit → submit_attempt →
      // submit_success/_existed/_rate_limited/_error) is measurable. We never
      // include the raw email or server error.message — only the outcome
      // tag + optional error code (隐私红线 #1 + GA event-param hygiene).
      switch (result.outcome) {
        case "success":
          trackEvent("newsletter_submit_success", {
            location: "landing_v2_newsletter",
            lang: language,
            ...getLandingUtm(),
          });
          setStatus("success");
          break;
        case "existed":
          trackEvent("newsletter_submit_existed", {
            location: "landing_v2_newsletter",
            lang: language,
          });
          setStatus("existed");
          break;
        case "rate_limited":
          trackEvent("newsletter_submit_rate_limited", {
            location: "landing_v2_newsletter",
            lang: language,
          });
          setStatus("rate_limited");
          break;
        case "error":
          trackEvent("newsletter_submit_error", {
            location: "landing_v2_newsletter",
            lang: language,
            error_code: result.code ?? "unknown",
          });
          setStatus("error");
          break;
      }
    },
    [status, language, email, website],
  );

  // Outcome → localised copy. We never render the server's raw error string;
  // the i18n table owns every user-facing message.
  const message =
    status === "success"
      ? landing.newsletter_success || "You're on the list. Watch your inbox."
      : status === "existed"
        ? landing.newsletter_existed ||
          "You're already on the list — we'll keep the cosmos coming."
        : status === "rate_limited"
          ? landing.newsletter_rate_limited ||
            "Too many attempts. Please try again in a bit."
          : status === "error"
            ? landing.newsletter_error ||
              "Could not subscribe. Please try again."
            : "";

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className={`w-full py-24 scroll-mt-16 ${isDark ? "bg-space-950" : "bg-paper-100"}`}
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
          className={`font-mono font-medium text-2xl md:text-3xl leading-tight tracking-tight ${
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
            onChange={(e) => setEmail(e.target.value.trim())}
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
