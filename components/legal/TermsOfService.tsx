import React from 'react';
import { Container, useTheme } from '../UIComponents';
import { SEO } from '../SEO';

const LAST_UPDATED = 'February 26, 2026';
const COMPANY_NAME = 'AstrologyWiki';
const PRODUCT_NAME = 'AstroMind';
const SITE_URL = 'https://www.astrologywiki.com';
const CONTACT_EMAIL = 'support@astrologywiki.com';

const TermsOfService: React.FC = () => {
  const { theme } = useTheme();

  const headingClass = theme === 'dark' ? 'text-gold-500' : 'text-gold-700';
  const textClass = theme === 'dark' ? 'text-star-200' : 'text-paper-600';
  const strongClass = theme === 'dark' ? 'text-star-50' : 'text-paper-900';
  const linkClass = theme === 'dark'
    ? 'text-gold-400 hover:text-gold-300 underline'
    : 'text-gold-700 hover:text-gold-600 underline';
  const listClass = `list-disc pl-6 space-y-1 ${textClass}`;
  const sectionClass = 'mb-10';

  return (
    <Container>
      <SEO
        title="Terms of Service"
        description={`${PRODUCT_NAME} Terms of Service - Read our terms and conditions for using the service.`}
      />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className={`text-3xl font-bold mb-2 ${strongClass}`}>Terms of Service</h1>
        <p className={`text-sm mb-8 ${textClass}`}>Last updated: {LAST_UPDATED}</p>

        {/* Introduction */}
        <div className={sectionClass}>
          <p className={textClass}>
            Welcome to {PRODUCT_NAME}. These Terms of Service ("Terms") govern your access to and use of the{' '}
            {PRODUCT_NAME} website located at{' '}
            <a href={SITE_URL} className={linkClass}>
              {SITE_URL}
            </a>
            , and any related services, features, or content offered by {COMPANY_NAME} ("we," "us," or "our")
            (collectively, the "Service").
          </p>
          <p className={`mt-4 ${textClass}`}>
            Please read these Terms carefully before using the Service. By accessing or using the Service, you
            agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use the
            Service.
          </p>
          <p className={`mt-4 text-sm italic ${textClass}`}>
            Note: These terms of service are provided as a compliance template. We recommend consulting with a
            qualified legal professional before relying on them for production use.
          </p>
        </div>

        {/* 1. Acceptance of Terms */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>1. Acceptance of Terms</h2>
          <p className={textClass}>
            By creating an account, making a purchase, or otherwise using the Service, you acknowledge that you
            have read, understood, and agree to be bound by these Terms, as well as our{' '}
            <a href="/privacy" className={linkClass}>
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="/cookies" className={linkClass}>
              Cookie Policy
            </a>
            , which are incorporated herein by reference. We reserve the right to modify these Terms at any time,
            and your continued use of the Service after such modifications constitutes acceptance of the updated
            Terms.
          </p>
        </div>

        {/* 2. Eligibility */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>2. Eligibility</h2>
          <p className={textClass}>
            You must be at least 13 years of age to use the Service. If you are between the ages of 13 and 18 (or
            the age of legal majority in your jurisdiction), you may only use the Service under the supervision of
            a parent or legal guardian who agrees to be bound by these Terms. By using the Service, you represent
            and warrant that you meet these eligibility requirements.
          </p>
        </div>

        {/* 3. Account Registration */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>3. Account Registration</h2>
          <p className={`mb-3 ${textClass}`}>
            To access certain features of the Service, you may be required to create an account. When creating an
            account, you agree to:
          </p>
          <ul className={listClass}>
            <li>Provide accurate, current, and complete information during the registration process.</li>
            <li>Maintain and promptly update your account information to keep it accurate and current.</li>
            <li>Maintain the security and confidentiality of your account credentials.</li>
            <li>Accept responsibility for all activities that occur under your account.</li>
            <li>
              Notify us immediately at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
                {CONTACT_EMAIL}
              </a>{' '}
              if you suspect any unauthorized use of your account.
            </li>
          </ul>
          <p className={`mt-3 ${textClass}`}>
            You may register using your email address or through third-party authentication providers (Google or
            Apple). We reserve the right to refuse registration or terminate accounts at our discretion.
          </p>
        </div>

        {/* 4. Subscription and Payments */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>4. Subscription and Payments</h2>

          <h3 className={`text-lg font-medium mb-2 ${strongClass}`}>4.1 Subscription Plans</h3>
          <p className={textClass}>
            {PRODUCT_NAME} offers both free and paid subscription plans. Paid plans are available on a monthly or
            yearly basis. Details of current plan offerings, including pricing and included features, are displayed
            on the Service at the time of purchase.
          </p>

          <h3 className={`text-lg font-medium mb-2 mt-6 ${strongClass}`}>4.2 Auto-Renewal</h3>
          <p className={textClass}>
            Paid subscriptions automatically renew at the end of each billing cycle (monthly or yearly) unless you
            cancel your subscription before the renewal date. You will be charged the then-current subscription
            rate at the time of renewal.
          </p>

          <h3 className={`text-lg font-medium mb-2 mt-6 ${strongClass}`}>4.3 Payment Methods</h3>
          <p className={textClass}>
            Payments are processed through third-party payment providers, including Airwallex, PayPal, and Stripe.
            By providing payment information, you authorize us (and our payment processors) to charge your
            selected payment method for the applicable fees. All payment processing is subject to the terms and
            privacy policies of the respective payment providers.
          </p>

          <h3 className={`text-lg font-medium mb-2 mt-6 ${strongClass}`}>4.4 Cancellation</h3>
          <p className={textClass}>
            You may cancel your subscription at any time through your account settings. Cancellation will take
            effect at the end of the current billing period. You will continue to have access to paid features
            until the end of your paid period. No partial refunds are provided for unused portions of a
            subscription period.
          </p>

          <h3 className={`text-lg font-medium mb-2 mt-6 ${strongClass}`}>4.5 Refunds</h3>
          <p className={textClass}>
            Refund eligibility depends on the payment method used and the policies of the applicable payment
            provider. Generally, we do not offer refunds for subscription fees already charged. If you believe you
            are entitled to a refund due to a billing error or technical issue, please contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
              {CONTACT_EMAIL}
            </a>{' '}
            and we will review your request on a case-by-case basis.
          </p>

          <h3 className={`text-lg font-medium mb-2 mt-6 ${strongClass}`}>4.6 Credits</h3>
          <p className={textClass}>
            Certain features of the Service may require credits. Credits may be earned through subscription plans,
            purchased separately, or awarded as bonuses. Credits are non-transferable, non-refundable, and have no
            cash value. We reserve the right to modify the credit system, including pricing and allocation, at any
            time.
          </p>
        </div>

        {/* 5. Acceptable Use */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>5. Acceptable Use</h2>
          <p className={`mb-3 ${textClass}`}>You agree not to:</p>
          <ul className={listClass}>
            <li>Use the Service for any unlawful purpose or in violation of any applicable laws or regulations.</li>
            <li>
              Attempt to gain unauthorized access to the Service, other users' accounts, or our systems and
              networks.
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the Service, including through the
              introduction of malware, viruses, or harmful code.
            </li>
            <li>
              Use automated means (bots, scrapers, crawlers) to access or collect data from the Service without
              our prior written consent.
            </li>
            <li>Impersonate any person or entity, or falsely represent your affiliation with any person or entity.</li>
            <li>
              Reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code or
              underlying algorithms of the Service.
            </li>
            <li>
              Use the Service to harass, abuse, threaten, or harm other users or any third party.
            </li>
            <li>
              Circumvent, disable, or otherwise interfere with security-related features of the Service, including
              features that prevent or restrict use or copying of content.
            </li>
            <li>
              Share, resell, or redistribute your account access or any content generated through the Service for
              commercial purposes without our prior written consent.
            </li>
          </ul>
        </div>

        {/* 6. Intellectual Property */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>6. Intellectual Property</h2>
          <p className={textClass}>
            The Service and its original content (excluding user-generated content), features, and functionality
            are and will remain the exclusive property of {COMPANY_NAME} and its licensors. The Service is
            protected by copyright, trademark, and other intellectual property laws. Our trademarks, trade names,
            logos, and service marks may not be used without our prior written consent.
          </p>
          <p className={`mt-3 ${textClass}`}>
            You retain ownership of any content you submit through the Service. By submitting content, you grant
            us a non-exclusive, worldwide, royalty-free license to use, store, and process that content solely for
            the purpose of providing and improving the Service.
          </p>
        </div>

        {/* 7. Disclaimer */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>7. Disclaimer</h2>
          <p className={`font-medium mb-3 ${strongClass}`}>
            IMPORTANT: The astrological content, readings, and AI-generated insights provided through the Service
            are intended for entertainment and self-reflection purposes only.
          </p>
          <p className={textClass}>
            The Service does NOT provide and should NOT be considered as a substitute for:
          </p>
          <ul className={`mt-3 ${listClass}`}>
            <li>
              <span className={strongClass}>Medical advice:</span> The Service is not a healthcare provider and
              does not diagnose, treat, cure, or prevent any disease or medical condition.
            </li>
            <li>
              <span className={strongClass}>Legal advice:</span> The Service does not provide legal counsel or
              representation.
            </li>
            <li>
              <span className={strongClass}>Financial advice:</span> The Service does not provide investment,
              financial planning, or tax advice.
            </li>
            <li>
              <span className={strongClass}>Psychological or therapeutic advice:</span> While the Service draws on
              psychological frameworks for self-reflection, it is not a substitute for licensed therapy,
              counseling, or psychological treatment.
            </li>
          </ul>
          <p className={`mt-4 ${textClass}`}>
            THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
            ERROR-FREE, OR COMPLETELY SECURE.
          </p>
        </div>

        {/* 8. Limitation of Liability */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>8. Limitation of Liability</h2>
          <p className={textClass}>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL {COMPANY_NAME.toUpperCase()}, ITS
            DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS,
            DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </p>
          <ul className={`mt-3 ${listClass}`}>
            <li>Your access to or use of (or inability to access or use) the Service.</li>
            <li>Any conduct or content of any third party on the Service.</li>
            <li>Any content obtained from the Service.</li>
            <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
            <li>Any decisions made or actions taken based on information provided through the Service.</li>
          </ul>
          <p className={`mt-4 ${textClass}`}>
            IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THE SERVICE
            EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE
            TO THE CLAIM, OR ONE HUNDRED U.S. DOLLARS ($100), WHICHEVER IS GREATER.
          </p>
        </div>

        {/* 9. Indemnification */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>9. Indemnification</h2>
          <p className={textClass}>
            You agree to indemnify, defend, and hold harmless {COMPANY_NAME}, its officers, directors, employees,
            agents, and affiliates from and against any and all claims, damages, obligations, losses, liabilities,
            costs, and expenses (including reasonable attorneys' fees) arising from: (a) your use of the Service;
            (b) your violation of these Terms; (c) your violation of any third-party right, including any
            intellectual property or privacy right; or (d) any claim that your content or actions caused damage to
            a third party.
          </p>
        </div>

        {/* 10. Termination */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>10. Termination</h2>
          <p className={textClass}>
            We may terminate or suspend your account and access to the Service immediately, without prior notice or
            liability, for any reason, including but not limited to a breach of these Terms. Upon termination, your
            right to use the Service will immediately cease.
          </p>
          <p className={`mt-3 ${textClass}`}>
            You may terminate your account at any time by contacting us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
              {CONTACT_EMAIL}
            </a>{' '}
            or through your account settings. Upon account termination, your personal data will be handled in
            accordance with our{' '}
            <a href="/privacy" className={linkClass}>
              Privacy Policy
            </a>
            .
          </p>
          <p className={`mt-3 ${textClass}`}>
            The following sections shall survive termination: Intellectual Property, Disclaimer, Limitation of
            Liability, Indemnification, Governing Law, and any other provisions that by their nature should
            survive.
          </p>
        </div>

        {/* 11. Governing Law */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>11. Governing Law</h2>
          <p className={textClass}>
            These Terms shall be governed by and construed in accordance with the laws of the State of Delaware,
            United States of America, without regard to its conflict of law provisions. Any disputes arising out of
            or relating to these Terms or the Service shall be resolved exclusively in the state or federal courts
            located in the State of Delaware, and you consent to the personal jurisdiction and venue of such courts.
          </p>
          <p className={`mt-3 ${textClass}`}>
            If you are a consumer in the European Union, you may also be entitled to bring proceedings in the
            courts of your country of residence. Nothing in these Terms shall limit any rights you may have under
            applicable consumer protection laws in your jurisdiction.
          </p>
        </div>

        {/* 12. Dispute Resolution */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>12. Dispute Resolution</h2>
          <p className={textClass}>
            Before filing a legal claim, you agree to first attempt to resolve any dispute informally by
            contacting us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
              {CONTACT_EMAIL}
            </a>
            . We will make reasonable efforts to resolve the dispute within 30 days. If the dispute cannot be
            resolved informally, either party may pursue legal remedies as described in the Governing Law section
            above.
          </p>
        </div>

        {/* 13. Changes to Terms */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>13. Changes to These Terms</h2>
          <p className={textClass}>
            We reserve the right to modify or replace these Terms at any time at our sole discretion. If a
            revision is material, we will provide at least 30 days' notice prior to the new terms taking effect,
            either through the Service interface or via email. What constitutes a "material change" will be
            determined at our sole discretion.
          </p>
          <p className={`mt-3 ${textClass}`}>
            Your continued use of the Service after the effective date of the revised Terms constitutes your
            acceptance of the updated Terms. If you do not agree to the new Terms, you must stop using the Service.
          </p>
        </div>

        {/* 14. Severability */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>14. Severability</h2>
          <p className={textClass}>
            If any provision of these Terms is held to be unenforceable or invalid, that provision will be
            modified and interpreted to accomplish the objectives of that provision to the greatest extent possible
            under applicable law, and the remaining provisions will continue in full force and effect.
          </p>
        </div>

        {/* 15. Contact Information */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>15. Contact Information</h2>
          <p className={textClass}>
            If you have any questions about these Terms, please contact us:
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
            <a href="/privacy" className={linkClass}>
              Privacy Policy
            </a>
            {' | '}
            <a href="/cookies" className={linkClass}>
              Cookie Policy
            </a>
          </p>
        </div>
      </div>
    </Container>
  );
};

export default TermsOfService;
