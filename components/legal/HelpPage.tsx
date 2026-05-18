import React, { useEffect } from 'react';
import { Container, useTheme, Accordion } from '../UIComponents';
import { SEO } from '../SEO';
import { Link } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
  {
    title: 'Account & Privacy',
    items: [
      {
        question: 'How do I create an account?',
        answer:
          'You can sign up using your Google account, Apple account, or email address. Simply tap the profile icon and choose your preferred registration method.',
      },
      {
        question: 'How do I delete my account?',
        answer:
          'Go to Settings, scroll down to the Danger Zone section, and tap "Delete Account." This will permanently remove all your data from our servers.',
      },
      {
        question: 'How do I export my data?',
        answer:
          'Navigate to Settings, find the Danger Zone section, and tap "Export My Data." You will receive a downloadable file containing all your personal data.',
      },
      {
        question: 'Is my birth data private?',
        answer:
          'Yes. Your birth data is encrypted at rest and in transit. We never share your personal information with third parties. You can review our full Privacy Policy for details.',
      },
    ],
  },
  {
    title: 'Subscription & Payments',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept PayPal and all major credit/debit cards (Visa, Mastercard, American Express) processed securely through Airwallex.',
      },
      {
        question: 'How do I cancel my subscription?',
        answer:
          'Go to Settings and find the Account section. You can cancel your subscription there at any time. Alternatively, contact our support team for assistance.',
      },
      {
        question: 'Do you offer refunds?',
        answer:
          'Yes. If you are unsatisfied, contact our support team within 7 days of your purchase and we will process a refund.',
      },
      {
        question: 'What are credits?',
        answer:
          'Credits are an in-app currency that lets you unlock individual features without a full subscription. You can purchase credit packs and spend them on specific readings or reports.',
      },
    ],
  },
  {
    title: 'Features',
    items: [
      {
        question: 'What is a natal chart?',
        answer:
          'A natal chart (or birth chart) is a map of the sky at the exact moment and location of your birth. It shows the positions of the Sun, Moon, planets, and other celestial bodies across the twelve zodiac signs and houses.',
      },
      {
        question: 'How accurate are the readings?',
        answer:
          'Our planetary calculations use the Swiss Ephemeris, which is based on NASA JPL data and is accurate to arc-second precision. The interpretive layer is powered by AI trained on established astrological literature.',
      },
      {
        question: 'What is synastry?',
        answer:
          'Synastry is a relationship compatibility analysis that compares two birth charts. It examines how the planets in one chart interact with the planets in another, revealing dynamics of attraction, challenge, and growth between two people.',
      },
      {
        question: 'What is CBT Journal?',
        answer:
          'The CBT Journal is a unique tool that combines Cognitive Behavioral Therapy techniques with astrological insights. It helps you identify thought patterns, reframe negative thinking, and leverage your astrological profile for personal growth.',
      },
    ],
  },
  {
    title: 'Technical',
    items: [
      {
        question: 'Which browsers are supported?',
        answer:
          'AstrologyWiki works best on modern browsers including the latest versions of Chrome, Firefox, Safari, and Edge. We recommend keeping your browser up to date for the best experience.',
      },
      {
        question: 'Is there a mobile app?',
        answer:
          'AstrologyWiki is currently a web application optimized for mobile browsers. You can add it to your home screen for an app-like experience. A dedicated mobile app may be available in the future.',
      },
      {
        question: 'How do I change the language?',
        answer:
          'Go to Settings, find the Preferences section, and select your preferred language. We currently support English and Chinese.',
      },
    ],
  },
];

const HelpPage: React.FC = () => {
  const { theme } = useTheme();

  const headingClass = theme === 'dark' ? 'text-gold-500' : 'text-gold-700';
  const textClass = theme === 'dark' ? 'text-star-200' : 'text-paper-600';
  const strongClass = theme === 'dark' ? 'text-star-50' : 'text-paper-900';
  const linkClass = theme === 'dark'
    ? 'text-gold-400 hover:text-gold-300 underline'
    : 'text-gold-700 hover:text-gold-600 underline';
  const sectionClass = 'mb-10';

  // Inject FAQPage JSON-LD schema
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const allItems = FAQ_DATA.flatMap((cat) => cat.items);
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: allItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(faqSchema);
    script.setAttribute('data-astro-faq-schema', 'true');
    document.head.appendChild(script);

    return () => {
      document.querySelectorAll('[data-astro-faq-schema]').forEach((el) => el.remove());
    };
  }, []);

  return (
    <Container>
      <SEO
        title="Help & FAQ"
        description="Frequently asked questions about AstrologyWiki - accounts, subscriptions, features, and technical support."
      />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className={`text-3xl font-bold mb-2 ${strongClass}`}>Help & FAQ</h1>
        <p className={`text-sm mb-10 ${textClass}`}>
          Find answers to common questions about AstrologyWiki.
        </p>

        {FAQ_DATA.map((category) => (
          <div key={category.title} className={sectionClass}>
            <h2 className={`text-xl font-semibold mb-4 ${headingClass}`}>{category.title}</h2>
            <div className="space-y-2">
              {category.items.map((item) => (
                <Accordion key={item.question} title={item.question}>
                  <p className={`text-sm leading-relaxed ${textClass}`}>{item.answer}</p>
                </Accordion>
              ))}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div className={`mt-12 pt-8 border-t ${theme === 'dark' ? 'border-star-50/10' : 'border-paper-200'}`}>
          <h2 className={`text-xl font-semibold mb-3 ${headingClass}`}>Still need help?</h2>
          <p className={textClass}>
            If you could not find the answer you were looking for, feel free to reach out to our support team at{' '}
            <a href="mailto:support@astrologywiki.com" className={linkClass}>
              support@astrologywiki.com
            </a>
            .
          </p>
        </div>

        {/* Back link */}
        <div className={`mt-8 pt-6 border-t ${theme === 'dark' ? 'border-star-50/10' : 'border-paper-200'}`}>
          <Link to="/" className={`text-sm ${linkClass}`}>
            &larr; Back to AstrologyWiki
          </Link>
        </div>
      </div>
    </Container>
  );
};

export default HelpPage;
