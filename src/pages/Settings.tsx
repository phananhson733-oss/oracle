import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import clsx from 'clsx'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { user, updateUser } = useStore()
  const [isDirty, setIsDirty] = useState(false)

  const handleLanguageChange = (lang: 'en' | 'zh') => {
    i18n.changeLanguage(lang)
    updateUser({ language: lang })
    setIsDirty(true)
  }

  const handleSave = () => {
    setIsDirty(false)
    // Would sync to Supabase here
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-light text-white">{t('settings.title')}</h1>
        <button
          onClick={handleSave}
          className={clsx(
            'btn-primary',
            isDirty ? 'animate-glow-pulse' : 'opacity-50'
          )}
        >
          {t('settings.save')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left: Identity */}
        <div className="card">
          <h2 className="text-lg font-medium text-white mb-6">{t('settings.identity')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-muted text-sm mb-2">Name</label>
              <input type="text" value={user?.name || ''} disabled className="input opacity-60" />
            </div>
            <div>
              <label className="block text-muted text-sm mb-2">Birth Date</label>
              <input
                type="text"
                value={user?.birthDate || ''}
                disabled
                className="input font-mono opacity-60"
              />
            </div>
            <div>
              <label className="block text-muted text-sm mb-2">Birth Time</label>
              <input
                type="text"
                value={user?.birthTime || ''}
                disabled
                className="input font-mono opacity-60"
              />
            </div>
            <div>
              <label className="block text-muted text-sm mb-2">Birth Place</label>
              <input
                type="text"
                value={user?.birthPlace || ''}
                disabled
                className="input opacity-60"
              />
            </div>
            <p className="text-dim text-xs">
              Birth data cannot be modified. Contact support to reset your account.
            </p>
          </div>
        </div>

        {/* Right: Preferences */}
        <div className="card">
          <h2 className="text-lg font-medium text-white mb-6">Cosmic Configuration</h2>
          <div className="space-y-6">
            {/* Language */}
            <div>
              <label className="block text-muted text-sm mb-3">{t('settings.language')}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={clsx(
                    'flex-1 py-3 rounded-lg text-sm font-medium transition-all',
                    i18n.language === 'en'
                      ? 'bg-gold text-void'
                      : 'bg-void-lighter text-muted hover:text-white'
                  )}
                >
                  English
                </button>
                <button
                  onClick={() => handleLanguageChange('zh')}
                  className={clsx(
                    'flex-1 py-3 rounded-lg text-sm font-medium transition-all',
                    i18n.language === 'zh'
                      ? 'bg-gold text-void'
                      : 'bg-void-lighter text-muted hover:text-white'
                  )}
                >
                  中文
                </button>
              </div>
            </div>

            {/* House System - Disabled */}
            <div>
              <label className="block text-muted text-sm mb-3">House System</label>
              <div className="flex gap-2">
                <button className="flex-1 py-3 rounded-lg text-sm font-medium bg-gold text-void">
                  Placidus
                </button>
                <button
                  disabled
                  className="flex-1 py-3 rounded-lg text-sm font-medium bg-void-lighter text-dim cursor-not-allowed"
                >
                  Whole Sign
                </button>
              </div>
              <p className="text-dim text-xs mt-2">Whole Sign coming soon</p>
            </div>

            {/* Coordinates */}
            <div>
              <label className="block text-muted text-sm mb-2">Coordinates</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={`${user?.latitude?.toFixed(2) || '0'}°N`}
                  disabled
                  className="input font-mono text-center opacity-60"
                />
                <input
                  type="text"
                  value={`${user?.longitude?.toFixed(2) || '0'}°E`}
                  disabled
                  className="input font-mono text-center opacity-60"
                />
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-muted text-sm mb-2">Timezone</label>
              <input
                type="text"
                value={user?.timezone || 'UTC'}
                disabled
                className="input font-mono opacity-60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="card border-friction/20">
        <h2 className="text-lg font-medium text-white mb-4">Account</h2>
        <div className="flex gap-4">
          <button className="btn-secondary text-sm">Export Data</button>
          <button className="btn-secondary text-sm text-friction border-friction/50 hover:border-friction">
            Delete Account
          </button>
        </div>
      </div>
    </motion.div>
  )
}
