import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Sun, Moon, ArrowUp, Zap, Anchor, AlertTriangle, Heart, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import AstrologyChart from '../components/AstrologyChart'

// Mock data
const mockInsights = {
  aphorism: 'The stars impel, they do not compel.',
  quadrants: [
    { key: 'power', icon: Zap, color: 'harmony', items: ['Mars Trine Saturn', 'Jupiter in 10th'] },
    { key: 'pressure', icon: Anchor, color: 'friction', items: ['Saturn Square Venus'] },
    { key: 'trouble', icon: AlertTriangle, color: 'warning', items: ['Mercury Retrograde'] },
    { key: 'enjoy', icon: Heart, color: 'gold', items: ['Venus in 5th House'] },
  ],
  dos: ['Start new projects', 'Have important conversations', 'Trust your intuition'],
  donts: ['Sign contracts', 'Make impulsive purchases', 'Ignore your health'],
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const user = useStore((s) => s.user)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">{t('dashboard.greeting')}</h1>
          <p className="text-muted font-mono text-sm">{today}</p>
        </div>
        <div className="text-right">
          <p className="text-white font-medium">{user?.name}</p>
          <div className="flex items-center gap-3 text-muted text-sm mt-1">
            <span className="flex items-center gap-1"><Sun size={14} className="text-gold" /> Scorpio</span>
            <span>|</span>
            <span className="flex items-center gap-1"><Moon size={14} /> Cancer</span>
            <span>|</span>
            <span className="flex items-center gap-1"><ArrowUp size={14} /> Leo</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Chart */}
        <div className="col-span-7">
          <div className="card relative">
            <div className="absolute top-4 left-4 text-xs text-muted">
              <span className="inline-block w-3 h-3 rounded-full bg-gold mr-2" /> Natal
              <span className="inline-block w-3 h-3 rounded-full bg-gray-400 ml-4 mr-2" /> Transit
            </div>
            <AstrologyChart size={450} />
            <button
              onClick={() => navigate('/profile?tab=updates')}
              className="absolute bottom-4 right-4 btn-secondary text-sm flex items-center gap-1"
            >
              {t('dashboard.viewDetails')} <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: Insights */}
        <div className="col-span-5 space-y-4">
          {/* Aphorism */}
          <div className="card border-l-4 border-l-gold">
            <p className="text-white italic">"{mockInsights.aphorism}"</p>
          </div>

          {/* Quadrants */}
          <div className="grid grid-cols-2 gap-3">
            {mockInsights.quadrants.map(({ key, icon: Icon, color, items }) => (
              <div key={key} className={`card border-l-4 border-l-${color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className={`text-${color}`} />
                  <span className="text-sm font-medium text-white">{t(`dashboard.quadrants.${key}`)}</span>
                </div>
                <ul className="text-xs text-muted space-y-1">
                  {items.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Do's & Don'ts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card bg-harmony/5 border-harmony/20">
              <h4 className="text-harmony text-sm font-medium mb-2">{t('dashboard.dos')}</h4>
              <ul className="text-xs text-muted space-y-1">
                {mockInsights.dos.map((item, i) => (
                  <li key={i}>✓ {item}</li>
                ))}
              </ul>
            </div>
            <div className="card bg-friction/5 border-friction/20">
              <h4 className="text-friction text-sm font-medium mb-2">{t('dashboard.donts')}</h4>
              <ul className="text-xs text-muted space-y-1">
                {mockInsights.donts.map((item, i) => (
                  <li key={i}>✗ {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
