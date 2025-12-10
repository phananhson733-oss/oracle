import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

export default function Landing() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="relative min-h-screen bg-void overflow-hidden flex items-center justify-center">
      {/* Star Background */}
      <div className="absolute inset-0 bg-stars animate-twinkle" />

      {/* Orbital Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] border border-border/30 rounded-full animate-spin-slow" />
        <div className="absolute w-[700px] h-[700px] border border-border/20 rounded-full animate-spin-slower" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="relative z-10 text-center"
      >
        {/* Logo Frame */}
        <motion.div
          initial={{ borderColor: 'transparent' }}
          animate={{ borderColor: 'rgba(212, 175, 55, 0.3)' }}
          transition={{ duration: 2, delay: 0.5 }}
          className="border rounded-lg p-12 mb-8"
        >
          <h1 className="text-6xl font-light tracking-[0.3em] text-white mb-4">
            {t('landing.title')}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="text-muted text-lg tracking-wide"
          >
            {t('landing.subtitle')}
          </motion.p>
        </motion.div>

        {/* Enter Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          onClick={() => navigate('/onboarding')}
          className="btn-primary text-lg tracking-wider animate-glow-pulse"
        >
          {t('landing.enter')}
        </motion.button>
      </motion.div>

      {/* Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
    </div>
  )
}
