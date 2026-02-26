import React from 'react';
import { Container, useTheme } from '../UIComponents';
import { SEO } from '../SEO';

const LAST_UPDATED = 'February 26, 2026';
const COMPANY_NAME = 'AstrologyWiki';
const PRODUCT_NAME = 'AstroMind';
const SITE_URL = 'https://www.astrologywiki.com';
const CONTACT_EMAIL = 'support@astrologywiki.com';

const CookiePolicy: React.FC = () => {
  const { theme } = useTheme();

  const headingClass = theme === 'dark' ? 'text-gold-500' : 'text-gold-700';
  const textClass = theme === 'dark' ? 'text-star-200' : 'text-paper-600';
  const strongClass = theme === 'dark' ? 'text-star-50' : 'text-paper-900';
  const linkClass = theme === 'dark'
    ? 'text-gold-400 hover:text-gold-300 underline'
    : 'text-gold-700 hover:text-gold-600 underline';
  const listClass = `list-disc pl-6 space-y-1 ${textClass}`;
  const sectionClass = 'mb-10';
  const tableHeaderClass = theme === 'dark'
    ? 'bg-space-900 text-star-50'
    : 'bg-paper-200 text-paper-900';
  const tableCellClass = theme === 'dark'
    ? 'border-star-400/20 text-star-200'
    : 'border-paper-600/20 text-paper-600';
  const tableBorderClass = theme === 'dark' ? 'border-star-400/20' : 'border-paper-600/20';

  return (
    <Container>
      <SEO
        title="Cookie Policy"
        description={`${PRODUCT_NAME} Cookie Policy - Learn about how we use cookies and similar technologies.`}
        robots="noindex"
      />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className={`text-3xl font-bold mb-2 ${strongClass}`}>Cookie Policy</h1>
        <p className={`text-sm mb-8 ${textClass}`}>Last updated: {LAST_UPDATED}</p>

        {/* Introduction */}
        <div className={sectionClass}>
          <p className={textClass}>
            This Cookie Policy explains how {PRODUCT_NAME} (operated by {COMPANY_NAME}) uses cookies and similar
            tracking technologies when you visit our website at{' '}
            <a href={SITE_URL} className={linkClass}>
              {SITE_URL}
            </a>{' '}
            (the "Service"). It explains what these technologies are, why we use them, and your rights to control
            our use of them.
          </p>
          <p className={`mt-4 text-sm italic ${textClass}`}>
            Note: This cookie policy is provided as a compliance template. We recommend consulting with a
            qualified legal professional before relying on it for production use.
          </p>
        </div>

        {/* 1. What Are Cookies */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>1. What Are Cookies</h2>
          <p className={textClass}>
            Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when
            you visit a website. They are widely used to make websites work more efficiently, provide a better user
            experience, and supply information to the owners of the site. Cookies can be "persistent" (remaining
            on your device for a set period or until you delete them) or "session-based" (deleted when you close
            your browser).
          </p>
          <p className={`mt-3 ${textClass}`}>
            In addition to cookies, we may also use similar technologies such as pixels, web beacons, and local
            storage to collect and store information.
          </p>
        </div>

        {/* 2. Types of Cookies We Use */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>2. Types of Cookies We Use</h2>

          <div className="overflow-x-auto mt-4">
            <table className={`w-full border-collapse border ${tableBorderClass} text-sm`}>
              <thead>
                <tr className={tableHeaderClass}>
                  <th className={`border ${tableBorderClass} px-4 py-3 text-left font-semibold`}>Category</th>
                  <th className={`border ${tableBorderClass} px-4 py-3 text-left font-semibold`}>Purpose</th>
                  <th className={`border ${tableBorderClass} px-4 py-3 text-left font-semibold`}>Consent</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`border ${tableBorderClass} px-4 py-3 font-medium ${strongClass}`}>Essential</td>
                  <td className={`border ${tableBorderClass} px-4 py-3 ${tableCellClass}`}>
                    Required for the Service to function. These include session management, authentication tokens,
                    language preferences, and theme settings.
                  </td>
                  <td className={`border ${tableBorderClass} px-4 py-3 ${tableCellClass}`}>
                    <span className={strongClass}>Always active</span> - cannot be disabled
                  </td>
                </tr>
                <tr>
                  <td className={`border ${tableBorderClass} px-4 py-3 font-medium ${strongClass}`}>Analytics</td>
                  <td className={`border ${tableBorderClass} px-4 py-3 ${tableCellClass}`}>
                    Help us understand how visitors interact with the Service. We use Google Analytics 4 and Google
                    Tag Manager to collect anonymized usage data including page views, session duration, and user
                    navigation patterns.
                  </td>
                  <td className={`border ${tableBorderClass} px-4 py-3 ${tableCellClass}`}>
                    <span className={strongClass}>Opt-in</span> - requires your consent
                  </td>
                </tr>
                <tr>
                  <td className={`border ${tableBorderClass} px-4 py-3 font-medium ${strongClass}`}>Marketing</td>
                  <td className={`border ${tableBorderClass} px-4 py-3 ${tableCellClass}`}>
                    Used to deliver relevant advertisements and track ad campaign performance. We do not currently
                    use marketing cookies, but this category is reserved for future use.
                  </td>
                  <td className={`border ${tableBorderClass} px-4 py-3 ${tableCellClass}`}>
                    <span className={strongClass}>Opt-in</span> - requires your consent (not currently active)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2.1 Essential Cookies */}
          <h3 className={`text-lg font-medium mb-2 mt-8 ${strongClass}`}>2.1 Essential Cookies</h3>
          <p className={`mb-3 ${textClass}`}>
            These cookies are strictly necessary for the Service to operate. Without these cookies, certain
            features of the Service would not be available. Essential cookies include:
          </p>
          <ul className={listClass}>
            <li>
              <span className={strongClass}>Session Management:</span> Cookies that maintain your session state
              as you navigate between pages, ensuring you remain logged in and your preferences persist.
            </li>
            <li>
              <span className={strongClass}>Authentication:</span> Cookies that identify you as a logged-in user
              and authorize access to protected features. This includes tokens for email-based authentication and
              third-party sign-in (Google, Apple).
            </li>
            <li>
              <span className={strongClass}>User Preferences:</span> Cookies that store your selected language
              (English or Chinese) and theme preference (dark or light mode).
            </li>
            <li>
              <span className={strongClass}>Cookie Consent:</span> A cookie that records your consent choices for
              non-essential cookies.
            </li>
          </ul>

          {/* 2.2 Analytics Cookies */}
          <h3 className={`text-lg font-medium mb-2 mt-8 ${strongClass}`}>2.2 Analytics Cookies</h3>
          <p className={`mb-3 ${textClass}`}>
            We use analytics cookies to understand how the Service is being used so we can improve it. These
            cookies collect information in an aggregated and anonymized form. Specifically:
          </p>
          <ul className={listClass}>
            <li>
              <span className={strongClass}>Google Analytics 4 (GA4):</span> Collects anonymized data about page
              views, session duration, user interactions, traffic sources, and device information. GA4 uses
              first-party cookies and does not collect personally identifiable information by default. Data is
              processed in accordance with{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Google's Privacy Policy
              </a>
              .
            </li>
            <li>
              <span className={strongClass}>Google Tag Manager (GTM):</span> A tag management system that enables
              us to manage and deploy analytics and measurement tags on the Service. GTM itself does not collect
              personal data but facilitates the operation of other analytics tools.
            </li>
          </ul>

          {/* 2.3 Marketing Cookies */}
          <h3 className={`text-lg font-medium mb-2 mt-8 ${strongClass}`}>2.3 Marketing Cookies</h3>
          <p className={textClass}>
            We do not currently use marketing or advertising cookies on the Service. If we introduce marketing
            cookies in the future, this policy will be updated and your consent will be requested before any
            marketing cookies are set.
          </p>
        </div>

        {/* 3. Third-Party Cookies */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>3. Third-Party Cookies</h2>
          <p className={`mb-3 ${textClass}`}>
            In addition to our own cookies, the following third parties may set cookies on your device when you
            use the Service:
          </p>
          <ul className={listClass}>
            <li>
              <span className={strongClass}>Google:</span> Through Google Analytics 4, Google Tag Manager, and
              Google Sign-In. These cookies are governed by{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Google's Privacy Policy
              </a>
              .
            </li>
            <li>
              <span className={strongClass}>Payment Providers:</span> When you make a payment, our payment
              processors (Airwallex, PayPal, Stripe) may set cookies on their own payment pages to process
              transactions securely and prevent fraud. These cookies are governed by each provider's respective
              privacy policy.
            </li>
            <li>
              <span className={strongClass}>Apple:</span> If you use "Sign in with Apple," Apple may set cookies
              for authentication purposes, governed by{' '}
              <a
                href="https://www.apple.com/legal/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Apple's Privacy Policy
              </a>
              .
            </li>
          </ul>
        </div>

        {/* 4. Managing Cookies */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>4. Managing Your Cookie Preferences</h2>

          <h3 className={`text-lg font-medium mb-2 ${strongClass}`}>4.1 Our Consent Tool</h3>
          <p className={textClass}>
            When you first visit the Service, a consent banner will appear allowing you to accept or decline
            non-essential cookies. You can change your preferences at any time by clicking the "Cookie Settings"
            link in the footer of any page.
          </p>

          <h3 className={`text-lg font-medium mb-2 mt-6 ${strongClass}`}>4.2 Browser Settings</h3>
          <p className={`mb-3 ${textClass}`}>
            Most web browsers allow you to control cookies through their settings. You can typically find these
            settings in the "Options," "Preferences," or "Privacy" menu of your browser. Here are links to cookie
            management instructions for common browsers:
          </p>
          <ul className={listClass}>
            <li>
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Google Chrome
              </a>
            </li>
            <li>
              <a
                href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a
                href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Apple Safari
              </a>
            </li>
            <li>
              <a
                href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Microsoft Edge
              </a>
            </li>
          </ul>
          <p className={`mt-3 ${textClass}`}>
            Please note that disabling cookies may affect the functionality of the Service. Essential cookies
            cannot be disabled as they are necessary for the Service to function properly.
          </p>

          <h3 className={`text-lg font-medium mb-2 mt-6 ${strongClass}`}>4.3 Google Analytics Opt-Out</h3>
          <p className={textClass}>
            You can opt out of Google Analytics tracking by installing the{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Google Analytics Opt-out Browser Add-on
            </a>
            , which prevents Google Analytics JavaScript from sharing information with Google Analytics about visit
            activity.
          </p>
        </div>

        {/* 5. Do Not Track */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>5. Do Not Track Signals</h2>
          <p className={textClass}>
            Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you do not want to
            be tracked. At this time, there is no universally accepted standard for how to respond to DNT signals.
            We currently do not respond to DNT signals, but we respect your cookie consent choices made through our
            consent banner.
          </p>
        </div>

        {/* 6. Updates to This Policy */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>6. Updates to This Cookie Policy</h2>
          <p className={textClass}>
            We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or
            our data practices. When we make material changes, we will update the "Last updated" date at the top
            of this page and, where appropriate, notify you through the Service or request renewed consent.
          </p>
        </div>

        {/* 7. Contact */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>7. Contact Us</h2>
          <p className={textClass}>
            If you have any questions about our use of cookies or this Cookie Policy, please contact us:
          </p>
          <ul className={`mt-3 space-y-2 ${textClass}`}>
            <li>
              <span className={strongClass}>Email:</span>{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <span className={strongClass}>Website:</span>{' '}
              <a href={SITE_URL} className={linkClass}>
                {SITE_URL}
              </a>
            </li>
            <li>
              <span className={strongClass}>Company:</span> {COMPANY_NAME}
            </li>
          </ul>
        </div>

        {/* Related Links */}
        <div className={`border-t pt-6 mt-12 ${theme === 'dark' ? 'border-star-400/20' : 'border-paper-600/20'}`}>
          <p className={`text-sm ${textClass}`}>
            Related:{' '}
            <a href="/#/privacy" className={linkClass}>
              Privacy Policy
            </a>
            {' | '}
            <a href="/#/terms" className={linkClass}>
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </Container>
  );
};

export default CookiePolicy;
