import React from 'react';
import { Container, useTheme } from '../UIComponents';
import { SEO } from '../SEO';
import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'support@astrologywiki.com';

const AboutPage: React.FC = () => {
  const { theme } = useTheme();

  const headingClass = theme === 'dark' ? 'text-gold-500' : 'text-gold-700';
  const textClass = theme === 'dark' ? 'text-star-200' : 'text-paper-600';
  const strongClass = theme === 'dark' ? 'text-star-50' : 'text-paper-900';
  const linkClass = theme === 'dark'
    ? 'text-gold-400 hover:text-gold-300 underline'
    : 'text-gold-700 hover:text-gold-600 underline';
  const cardClass = theme === 'dark'
    ? 'bg-space-900/50 border border-star-50/10 rounded-xl p-6'
    : 'bg-white border border-paper-200 rounded-xl p-6';
  const sectionClass = 'mb-10';

  return (
    <Container>
      <SEO
        title="About"
        description="About AstroMind - Modern astrology meets psychology. Empowerment over fatalism."
        robots="noindex"
      />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className={`text-3xl font-bold mb-2 ${strongClass}`}>About AstroMind</h1>
        <p className={`text-sm mb-8 ${textClass}`}>Where modern astrology meets psychology</p>

        {/* Mission */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>Our Mission</h2>
          <p className={textClass}>
            We believe in empowerment over fatalism. AstroMind uses the wisdom of the stars as a mirror
            for self-discovery, not a fixed destiny. By combining time-honored astrological traditions
            with modern psychological insights, we help you understand yourself more deeply and navigate
            life with greater clarity.
          </p>
        </div>

        {/* Our Approach */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>Our Approach</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: 'Psychological Astrology',
                desc: 'Rooted in Carl Jung\'s archetypal psychology, we interpret celestial patterns as reflections of your inner world.',
              },
              {
                title: 'CBT Integration',
                desc: 'Our CBT Journal uniquely combines Cognitive Behavioral Therapy techniques with astrological self-awareness.',
              },
              {
                title: 'AI-Powered Insights',
                desc: 'Personalized readings powered by advanced AI, using Swiss Ephemeris data for astronomical precision.',
              },
              {
                title: 'Privacy-First Design',
                desc: 'Your birth data is encrypted and never shared with third parties. You own your data, always.',
              },
            ].map((item) => (
              <div key={item.title} className={cardClass}>
                <h3 className={`text-base font-semibold mb-2 ${strongClass}`}>{item.title}</h3>
                <p className={`text-sm ${textClass}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className={sectionClass}>
          <h2 className={`text-2xl font-semibold mb-4 ${headingClass}`}>Contact Us</h2>
          <p className={textClass}>
            Have questions, feedback, or just want to say hello? We would love to hear from you.
          </p>
          <p className={`mt-3 ${textClass}`}>
            Email:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        {/* Back link */}
        <div className="mt-12 pt-6 border-t border-star-50/10">
          <Link to="/" className={`text-sm ${linkClass}`}>
            &larr; Back to AstroMind
          </Link>
        </div>
      </div>
    </Container>
  );
};

export default AboutPage;
