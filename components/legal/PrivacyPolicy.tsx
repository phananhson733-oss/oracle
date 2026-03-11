import React from "react";
import { Container, useTheme } from "../UIComponents";
import { SEO } from "../SEO";
import { useLangPath } from "../../hooks/useLangPath";

const LAST_UPDATED = "February 26, 2026";
const COMPANY_NAME = "AstrologyWiki";
const PRODUCT_NAME = "AstroMind";
const SITE_URL = "https://www.astrologywiki.com";
const CONTACT_EMAIL = "support@astrologywiki.com";

const PrivacyPolicy: React.FC = () => {
  const { theme } = useTheme();
  const { langPath } = useLangPath();

  const headingClass = theme === "dark" ? "text-gold-500" : "text-gold-700";
  const textClass = theme === "dark" ? "text-star-200" : "text-paper-600";
  const strongClass = theme === "dark" ? "text-star-50" : "text-paper-900";
  const linkClass =
    theme === "dark"
      ? "text-gold-400 hover:text-gold-300 underline"
      : "text-gold-700 hover:text-gold-600 underline";
  const listClass = `list-disc pl-6 space-y-1 ${textClass}`;
  const sectionClass = "mb-10";

  return (
    <Container>
      <SEO
        title="Privacy Policy"
        description={`${PRODUCT_NAME} Privacy Policy - Learn how we collect, use, and protect your personal information.`}
      />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className={`text-3xl font-bold mb-2 ${strongClass}`}>
          Privacy Policy
        </h1>
        <p className={`text-sm mb-8 ${textClass}`}>
          Last updated: {LAST_UPDATED}
        </p>

        {/* Introduction */}
        <div className={sectionClass}>
          <p className={textClass}>
            Welcome to {PRODUCT_NAME} (operated by {COMPANY_NAME}). Your privacy
            is important to us. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our
            website at{" "}
            <a href={SITE_URL} className={linkClass}>
              {SITE_URL}
            </a>{" "}
            and our associated services (collectively, the "Service").
          </p>
          <p className={`mt-4 ${textClass}`}>
            By accessing or using the Service, you agree to the collection and
            use of information in accordance with this Privacy Policy. If you do
            not agree with the terms of this Privacy Policy, please do not
            access or use the Service.
          </p>
          <p className={`mt-4 text-sm italic ${textClass}`}>
            Note: This privacy policy is provided as a compliance template. We
            recommend consulting with a qualified legal professional before
            relying on it for production use.
          </p>
        </div>

        {/* 1. Information We Collect */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>
            1. Information We Collect
          </h2>

          <h3 className={`text-lg font-medium mb-2 ${strongClass}`}>
            1.1 Information You Provide Directly
          </h3>
          <ul className={listClass}>
            <li>
              <span className={strongClass}>Account Information:</span> When you
              register for an account, we collect your name, email address, and
              authentication credentials. You may also sign in through
              third-party providers (Google or Apple), in which case we receive
              your basic profile information from those services.
            </li>
            <li>
              <span className={strongClass}>Birth Data:</span> To generate your
              astrological chart, we collect your date of birth, time of birth
              (if known), and place of birth. This information is used solely
              for astrological calculations and personalized readings.
            </li>
            <li>
              <span className={strongClass}>User Content:</span> Questions,
              messages, and other content you submit through the Service,
              including interactions with our AI-powered features.
            </li>
          </ul>

          <h3 className={`text-lg font-medium mb-2 mt-6 ${strongClass}`}>
            1.2 Information Collected Automatically
          </h3>
          <ul className={listClass}>
            <li>
              <span className={strongClass}>Usage Data:</span> We automatically
              collect information about how you interact with the Service,
              including pages visited, features used, session duration, and
              navigation patterns.
            </li>
            <li>
              <span className={strongClass}>Device Information:</span> Browser
              type and version, operating system, device type, screen
              resolution, and language preferences.
            </li>
            <li>
              <span className={strongClass}>Log Data:</span> IP address, access
              timestamps, referring URLs, and error logs.
            </li>
            <li>
              <span className={strongClass}>
                Cookies and Similar Technologies:
              </span>{" "}
              We use cookies, pixels, and similar tracking technologies. See our{" "}
              <a href={langPath("/cookies")} className={linkClass}>
                Cookie Policy
              </a>{" "}
              for details.
            </li>
          </ul>

          <h3 className={`text-lg font-medium mb-2 mt-6 ${strongClass}`}>
            1.3 Information from Third Parties
          </h3>
          <ul className={listClass}>
            <li>
              <span className={strongClass}>Authentication Providers:</span> If
              you sign in via Google or Apple, we receive your basic profile
              information (name, email, profile picture) as authorized by you.
            </li>
            <li>
              <span className={strongClass}>Payment Processors:</span> Our
              payment processors (Airwallex, PayPal, and Stripe) may share
              transaction-level information with us. We do not store your full
              payment card details; these are handled directly by the payment
              processor.
            </li>
          </ul>
        </div>

        {/* 2. How We Use Your Information */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>
            2. How We Use Your Information
          </h2>
          <p className={`mb-3 ${textClass}`}>
            We use the information we collect to:
          </p>
          <ul className={listClass}>
            <li>
              Provide, maintain, and improve the Service, including personalized
              astrological readings and AI-powered features.
            </li>
            <li>
              Create and manage your account and authenticate your identity.
            </li>
            <li>Process transactions and manage subscriptions.</li>
            <li>
              Send you service-related communications (e.g., account
              verification, subscription confirmations, security alerts).
            </li>
            <li>Respond to your inquiries and provide customer support.</li>
            <li>
              Analyze usage patterns to improve user experience and develop new
              features.
            </li>
            <li>
              Detect, prevent, and address fraud, abuse, and security issues.
            </li>
            <li>
              Comply with legal obligations and enforce our terms of service.
            </li>
          </ul>
        </div>

        {/* 3. Data Sharing and Disclosure */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>
            3. Data Sharing and Disclosure
          </h2>
          <p className={`mb-4 font-medium ${strongClass}`}>
            We do NOT sell your personal information to third parties.
          </p>
          <p className={`mb-3 ${textClass}`}>
            We may share your information with the following categories of third
            parties:
          </p>

          <h3 className={`text-lg font-medium mb-2 mt-4 ${strongClass}`}>
            3.1 Service Providers
          </h3>
          <ul className={listClass}>
            <li>
              <span className={strongClass}>Analytics:</span> Google Analytics 4
              and Google Tag Manager to understand how users interact with the
              Service. Google may collect information about your use of the
              Service through cookies. See{" "}
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
              <span className={strongClass}>Payment Processing:</span>{" "}
              Airwallex, PayPal, and Stripe process payments on our behalf.
              These providers have their own privacy policies governing the
              information they collect. We do not have access to or store your
              full credit card numbers.
            </li>
            <li>
              <span className={strongClass}>Authentication:</span> Google and
              Apple provide sign-in services. Their use of your information is
              governed by their respective privacy policies.
            </li>
            <li>
              <span className={strongClass}>AI Services:</span> We use
              third-party AI providers to power our astrological analysis
              features. Information sent to these providers is used solely for
              generating responses and is not retained by them for training
              purposes.
            </li>
          </ul>

          <h3 className={`text-lg font-medium mb-2 mt-6 ${strongClass}`}>
            3.2 Legal Requirements
          </h3>
          <p className={textClass}>
            We may disclose your information if required to do so by law or in
            response to valid requests by public authorities (e.g., a court
            order or government agency), or when we believe in good faith that
            disclosure is necessary to protect our rights, your safety or the
            safety of others, investigate fraud, or respond to a government
            request.
          </p>

          <h3 className={`text-lg font-medium mb-2 mt-6 ${strongClass}`}>
            3.3 Business Transfers
          </h3>
          <p className={textClass}>
            In the event of a merger, acquisition, reorganization, bankruptcy,
            or other similar event, your personal information may be transferred
            as part of the business assets. We will notify you of any such
            change in ownership or control of your personal information.
          </p>
        </div>

        {/* 4. Data Retention */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>
            4. Data Retention
          </h2>
          <p className={textClass}>
            We retain your personal information for as long as your account is
            active or as needed to provide you with the Service. If you delete
            your account, we will delete or anonymize your personal information
            within 30 days, except where we are required to retain it for legal,
            regulatory, or legitimate business purposes (such as resolving
            disputes, enforcing agreements, or complying with legal
            obligations).
          </p>
          <p className={`mt-3 ${textClass}`}>
            Usage data and analytics information may be retained in an
            aggregated and anonymized form for longer periods for analytical
            purposes.
          </p>
        </div>

        {/* 5. Your Rights */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>
            5. Your Rights
          </h2>

          <h3 className={`text-lg font-medium mb-2 ${strongClass}`}>
            5.1 Rights Under the General Data Protection Regulation (GDPR)
          </h3>
          <p className={`mb-3 ${textClass}`}>
            If you are a resident of the European Economic Area (EEA), the
            United Kingdom, or Switzerland, you have the following rights:
          </p>
          <ul className={listClass}>
            <li>
              <span className={strongClass}>Right of Access:</span> You have the
              right to request a copy of the personal information we hold about
              you.
            </li>
            <li>
              <span className={strongClass}>Right to Rectification:</span> You
              have the right to request correction of inaccurate or incomplete
              personal information.
            </li>
            <li>
              <span className={strongClass}>Right to Erasure:</span> You have
              the right to request deletion of your personal information,
              subject to certain exceptions.
            </li>
            <li>
              <span className={strongClass}>Right to Restriction:</span> You
              have the right to request that we restrict the processing of your
              personal information in certain circumstances.
            </li>
            <li>
              <span className={strongClass}>Right to Data Portability:</span>{" "}
              You have the right to receive your personal information in a
              structured, commonly used, and machine-readable format.
            </li>
            <li>
              <span className={strongClass}>Right to Object:</span> You have the
              right to object to processing of your personal information for
              direct marketing or where we rely on legitimate interests.
            </li>
            <li>
              <span className={strongClass}>Right to Withdraw Consent:</span>{" "}
              Where processing is based on your consent, you may withdraw it at
              any time without affecting the lawfulness of prior processing.
            </li>
          </ul>
          <p className={`mt-3 ${textClass}`}>
            To exercise any of these rights, please contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
              {CONTACT_EMAIL}
            </a>
            . We will respond to your request within 30 days.
          </p>

          <h3 className={`text-lg font-medium mb-2 mt-6 ${strongClass}`}>
            5.2 Rights Under the California Consumer Privacy Act (CCPA)
          </h3>
          <p className={`mb-3 ${textClass}`}>
            If you are a California resident, the CCPA grants you the following
            rights:
          </p>
          <ul className={listClass}>
            <li>
              <span className={strongClass}>Right to Know:</span> You have the
              right to know what personal information we collect, use, disclose,
              and sell about you.
            </li>
            <li>
              <span className={strongClass}>Right to Delete:</span> You have the
              right to request deletion of your personal information, subject to
              certain exceptions.
            </li>
            <li>
              <span className={strongClass}>Right to Opt-Out of Sale:</span> You
              have the right to opt out of the sale of your personal
              information. As noted above, we do not sell personal information.
            </li>
            <li>
              <span className={strongClass}>Right to Non-Discrimination:</span>{" "}
              We will not discriminate against you for exercising your CCPA
              rights.
            </li>
          </ul>
          <p className={`mt-3 ${textClass}`}>
            To exercise your CCPA rights, please contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
              {CONTACT_EMAIL}
            </a>{" "}
            or use our online request form. We will verify your identity before
            fulfilling any request.
          </p>
        </div>

        {/* 6. Do Not Sell My Personal Information */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>
            6. "Do Not Sell My Personal Information"
          </h2>
          <p className={textClass}>
            {PRODUCT_NAME} does not sell, rent, or trade your personal
            information to third parties for monetary or other valuable
            consideration. We do not engage in the "sale" of personal
            information as defined under the CCPA or any other applicable
            privacy law. If our practices change in the future, we will update
            this Privacy Policy and provide you with an opportunity to opt out.
          </p>
        </div>

        {/* 7. Children's Privacy */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>
            7. Children's Privacy
          </h2>
          <p className={textClass}>
            The Service is not intended for children under the age of 13. We do
            not knowingly collect personal information from children under 13.
            If you are a parent or guardian and believe your child has provided
            us with personal information, please contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
              {CONTACT_EMAIL}
            </a>
            . If we become aware that we have collected personal information
            from a child under 13 without verification of parental consent, we
            will take steps to delete that information promptly.
          </p>
        </div>

        {/* 8. International Data Transfers */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>
            8. International Data Transfers
          </h2>
          <p className={textClass}>
            Your information may be transferred to and processed in countries
            other than the country in which you reside. These countries may have
            data protection laws that differ from the laws of your country. By
            using the Service, you consent to the transfer of your information
            to the United States and other jurisdictions where we or our service
            providers operate.
          </p>
          <p className={`mt-3 ${textClass}`}>
            Where required by applicable law, we implement appropriate
            safeguards for international data transfers, such as Standard
            Contractual Clauses approved by the European Commission or other
            legally recognized transfer mechanisms.
          </p>
        </div>

        {/* 9. Data Security */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>
            9. Data Security
          </h2>
          <p className={textClass}>
            We implement appropriate technical and organizational measures to
            protect your personal information against unauthorized access,
            alteration, disclosure, or destruction. These measures include
            encryption of data in transit (TLS/SSL), secure authentication
            mechanisms, access controls, and regular security assessments.
          </p>
          <p className={`mt-3 ${textClass}`}>
            However, no method of transmission over the Internet or electronic
            storage is 100% secure. While we strive to protect your personal
            information, we cannot guarantee its absolute security.
          </p>
        </div>

        {/* 10. Changes to This Policy */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>
            10. Changes to This Privacy Policy
          </h2>
          <p className={textClass}>
            We may update this Privacy Policy from time to time to reflect
            changes in our practices, technology, legal requirements, or other
            factors. When we make material changes, we will notify you by
            updating the "Last updated" date at the top of this page and, where
            required by law, by providing additional notice (such as an email
            notification or a prominent notice on the Service).
          </p>
          <p className={`mt-3 ${textClass}`}>
            Your continued use of the Service after any changes to this Privacy
            Policy constitutes your acceptance of the updated policy.
          </p>
        </div>

        {/* 11. Contact Us */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>
            11. Contact Us
          </h2>
          <p className={textClass}>
            If you have any questions, concerns, or requests regarding this
            Privacy Policy or our data practices, please contact us:
          </p>
          <ul className={`mt-3 space-y-2 ${textClass}`}>
            <li>
              <span className={strongClass}>Email:</span>{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <span className={strongClass}>Website:</span>{" "}
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
        <div
          className={`border-t pt-6 mt-12 ${theme === "dark" ? "border-star-400/20" : "border-paper-600/20"}`}
        >
          <p className={`text-sm ${textClass}`}>
            Related:{" "}
            <a href={langPath("/terms")} className={linkClass}>
              Terms of Service
            </a>
            {" | "}
            <a href={langPath("/cookies")} className={linkClass}>
              Cookie Policy
            </a>
          </p>
        </div>
      </div>
    </Container>
  );
};

export default PrivacyPolicy;
