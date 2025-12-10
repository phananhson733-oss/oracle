import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

export default function Onboarding() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const setUser = useStore((s) => s.setUser)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
  })

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      // Create user and navigate
      setUser({
        id: crypto.randomUUID(),
        name: form.name,
        birthDate: form.birthDate,
        birthTime: form.birthTime,
        birthPlace: form.birthPlace,
        latitude: 27.7, // Mock - would use geocoding API
        longitude: 111.9,
        timezone: 'Asia/Shanghai',
        language: 'en',
      })
      navigate('/dashboard')
    }
  }

  const canProceed = () => {
    if (step === 1) return form.name.trim().length > 0
    if (step === 2) return form.birthDate && form.birthTime
    if (step === 3) return form.birthPlace.trim().length > 0
    return false
  }

  return (
    <div className="relative min-h-screen bg-void flex items-center justify-center">
      <div className="absolute inset-0 bg-stars opacity-50" />

      {/* Progress Indicator */}
      <div className="absolute top-8 left-8 font-mono text-xs text-muted">
        {t('onboarding.step')} {step} / 3
      </div>

      {/* Form Container */}
      <div className="relative z-10 w-full max-w-md px-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <h2 className="text-2xl font-light text-white mb-12">{t('onboarding.step1.title')}</h2>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('onboarding.step1.placeholder')}
                className="input-large py-4"
                autoFocus
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <h2 className="text-2xl font-light text-white mb-12">{t('onboarding.step2.title')}</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-muted text-sm mb-2">{t('onboarding.step2.date')}</label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    className="input font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-muted text-sm mb-2">{t('onboarding.step2.time')}</label>
                  <input
                    type="time"
                    value={form.birthTime}
                    onChange={(e) => setForm({ ...form, birthTime: e.target.value })}
                    className="input font-mono text-center"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center"
            >
              <h2 className="text-2xl font-light text-white mb-12">{t('onboarding.step3.title')}</h2>
              <input
                type="text"
                value={form.birthPlace}
                onChange={(e) => setForm({ ...form, birthPlace: e.target.value })}
                placeholder={t('onboarding.step3.placeholder')}
                className="input-large py-4"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-16 text-center"
        >
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="btn-primary min-w-[200px]"
          >
            {step === 3 ? t('onboarding.seal') : t('onboarding.proceed')}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
