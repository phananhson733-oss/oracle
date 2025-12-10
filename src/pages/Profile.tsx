import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Sparkles, Heart, BookOpen, Target, ChevronRight } from 'lucide-react'
import AstrologyChart from '../components/AstrologyChart'
import clsx from 'clsx'

const TABS = ['natal', 'updates'] as const

// Mock insights
const mockInsights = {
  themes: ['Transformation through crisis', 'Emotional depth', 'Power dynamics'],
  emotional: 'Deep emotional sensitivity with protective instincts. Nurturing nature combined with intense inner world.',
  gifts: ['Intuitive understanding', 'Emotional resilience', 'Transformative power'],
  lessons: ['Releasing control', 'Trusting vulnerability', 'Balancing intensity'],
}

// Mock planet placements
const PLACEMENTS = [
  { planet: 'Sun', sign: 'Scorpio', degree: '8°42\'', house: '4th' },
  { planet: 'Moon', sign: 'Cancer', degree: '15°18\'', house: '12th' },
  { planet: 'Mercury', sign: 'Scorpio', degree: '20°05\'', house: '4th' },
  { planet: 'Venus', sign: 'Libra', degree: '15°30\'', house: '3rd' },
  { planet: 'Mars', sign: 'Taurus', degree: '15°00\'', house: '10th' },
  { planet: 'Jupiter', sign: 'Capricorn', degree: '10°22\'', house: '6th' },
  { planet: 'Saturn', sign: 'Virgo', degree: '15°45\'', house: '2nd' },
]

export default function Profile() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'updates' ? 'updates' : 'natal'
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>(initialTab)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-8 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'pb-3 text-sm font-medium transition-colors relative',
              activeTab === tab ? 'text-white' : 'text-muted hover:text-white'
            )}
          >
            {t(`profile.${tab}`)}
            {activeTab === tab && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
              />
            )}
          </button>
        ))}
      </div>

      {/* Natal Chart Tab */}
      {activeTab === 'natal' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Chart */}
          <div className="col-span-7">
            <div className="card">
              <AstrologyChart size={500} showTransit={false} />
            </div>
          </div>

          {/* Right: Insights */}
          <div className="col-span-5 space-y-4">
            <InsightCard
              icon={Target}
              title={t('profile.themes')}
              items={mockInsights.themes}
              color="gold"
            />
            <InsightCard
              icon={Heart}
              title={t('profile.emotional')}
              content={mockInsights.emotional}
              color="neutral"
            />
            <InsightCard
              icon={Sparkles}
              title={t('profile.gifts')}
              items={mockInsights.gifts}
              color="harmony"
            />
            <InsightCard
              icon={BookOpen}
              title={t('profile.lessons')}
              items={mockInsights.lessons}
              color="warning"
            />
          </div>

          {/* Placements Table */}
          <div className="col-span-12">
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">Planet Placements</h3>
              <div className="grid grid-cols-4 gap-4">
                {PLACEMENTS.map(({ planet, sign, degree, house }) => (
                  <div key={planet} className="flex items-center justify-between p-3 bg-void rounded-lg">
                    <span className="text-white font-medium">{planet}</span>
                    <span className="text-muted text-sm">{sign} {degree}</span>
                    <span className="text-dim text-xs">{house}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cosmic Updates Tab */}
      {activeTab === 'updates' && (
        <div className="space-y-6">
          {/* Timeline */}
          <div className="flex gap-2 justify-center">
            {[-3, -2, -1, 0, 1, 2, 3].map((offset) => (
              <button
                key={offset}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm transition-all',
                  offset === 0
                    ? 'bg-gold text-void font-medium'
                    : 'bg-void-light text-muted hover:text-white'
                )}
              >
                {offset === 0 ? 'Today' : offset > 0 ? `+${offset}` : offset}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7">
              <div className="card">
                <AstrologyChart size={450} />
              </div>
            </div>
            <div className="col-span-5 space-y-4">
              <DimensionCard title="Emotion" summary="Heightened sensitivity today" intensity={4} />
              <DimensionCard title="Interaction" summary="Good for deep conversations" intensity={3} />
              <DimensionCard title="Work" summary="Focus on details" intensity={2} />
              <DimensionCard title="Karma" summary="Past patterns resurface" intensity={5} />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function InsightCard({ icon: Icon, title, items, content, color }: {
  icon: React.ElementType
  title: string
  items?: string[]
  content?: string
  color: string
}) {
  return (
    <div className={`card border-l-4 border-l-${color}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className={`text-${color}`} />
        <h4 className="text-white font-medium">{title}</h4>
      </div>
      {content && <p className="text-muted text-sm">{content}</p>}
      {items && (
        <ul className="text-muted text-sm space-y-1">
          {items.map((item, i) => (
            <li key={i}>• {item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DimensionCard({ title, summary, intensity }: { title: string; summary: string; intensity: number }) {
  return (
    <div className="card hover:border-gold transition-colors cursor-pointer group">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-white font-medium mb-1">{title}</h4>
          <p className="text-muted text-sm">{summary}</p>
        </div>
        <ChevronRight size={18} className="text-muted group-hover:text-gold transition-colors" />
      </div>
      <div className="flex gap-1 mt-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={clsx('h-1 flex-1 rounded', i <= intensity ? 'bg-gold' : 'bg-border')}
          />
        ))}
      </div>
    </div>
  )
}
