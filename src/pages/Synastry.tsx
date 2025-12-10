import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Plus, Check, X, Heart, MessageCircle, Scale, Zap } from 'lucide-react'
import { useStore } from '../store'
import AstrologyChart from '../components/AstrologyChart'
import clsx from 'clsx'

interface Soul {
  id: string
  name: string
  birthDate: string
  isUser?: boolean
}

const MOCK_SOULS: Soul[] = [
  { id: '1', name: 'You', birthDate: '1989-10-31', isUser: true },
  { id: '2', name: 'Partner A', birthDate: '1992-03-15' },
  { id: '3', name: 'Friend B', birthDate: '1988-07-22' },
]

const TABS = ['snapshot', 'natal', 'a-to-b', 'b-to-a', 'composite'] as const

export default function Synastry() {
  const user = useStore((s) => s.user)
  const [selected, setSelected] = useState<string[]>([])
  const [showReport, setShowReport] = useState(false)
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('snapshot')
  const [showModal, setShowModal] = useState(false)

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id))
    } else if (selected.length < 2) {
      setSelected([...selected, id])
    }
  }

  const handleAnalyze = () => {
    if (selected.length === 2) setShowReport(true)
  }

  if (showReport) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-light text-white">Relationship Blueprint</h1>
          <button onClick={() => setShowReport(false)} className="text-muted hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'pb-3 px-2 text-sm font-medium whitespace-nowrap transition-colors relative',
                activeTab === tab ? 'text-white' : 'text-muted hover:text-white'
              )}
            >
              {tab.replace('-', ' → ').replace('a', 'A').replace('b', 'B')}
              {activeTab === tab && (
                <motion.div layoutId="synastry-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'snapshot' && (
          <div className="space-y-6">
            <div className="card border-l-4 border-l-gold">
              <p className="text-white">
                This connection carries deep karmic significance. Your charts reveal a powerful soul contract
                focused on transformation and emotional growth. The synastry suggests both challenge and
                profound potential for mutual evolution.
              </p>
              <p className="text-muted text-sm mt-2">🔒 Unlock full analysis</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ThemeCard icon={Heart} title="Intimacy" summary="Deep emotional bond" locked />
              <ThemeCard icon={MessageCircle} title="Communication" summary="Intuitive understanding" locked />
              <ThemeCard icon={Scale} title="Values" summary="Complementary priorities" locked />
              <ThemeCard icon={Zap} title="Power" summary="Dynamic tension" locked />
            </div>
          </div>
        )}

        {activeTab === 'natal' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-white font-medium mb-4">Person A</h3>
              <AstrologyChart size={300} showTransit={false} />
            </div>
            <div className="card">
              <h3 className="text-white font-medium mb-4">Person B</h3>
              <AstrologyChart size={300} showTransit={false} />
            </div>
          </div>
        )}

        {(activeTab === 'a-to-b' || activeTab === 'b-to-a') && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7 card">
              <AstrologyChart size={400} />
            </div>
            <div className="col-span-5 space-y-3">
              <h3 className="text-white font-medium">Key Influences</h3>
              <div className="card text-sm">
                <span className="text-gold">Sun conjunct Venus</span>
                <p className="text-muted mt-1">Strong attraction and appreciation</p>
              </div>
              <div className="card text-sm">
                <span className="text-friction">Mars square Saturn</span>
                <p className="text-muted mt-1">Friction around action and timing</p>
              </div>
              <div className="card text-sm">
                <span className="text-harmony">Moon trine Jupiter</span>
                <p className="text-muted mt-1">Emotional expansion and support</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'composite' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7 card">
              <h3 className="text-white font-medium mb-4">Composite Chart</h3>
              <AstrologyChart size={400} showTransit={false} />
            </div>
            <div className="col-span-5 space-y-4">
              <div className="card">
                <h4 className="text-white font-medium mb-2">Relationship Purpose</h4>
                <p className="text-muted text-sm">
                  Composite Sun in 7th house suggests this relationship is meant to teach both
                  parties about partnership, balance, and relating to others.
                </p>
              </div>
              <div className="card">
                <h4 className="text-white font-medium mb-2">Karmic Timeline</h4>
                <p className="text-muted text-sm">
                  North Node in 10th indicates shared destiny around public achievement and legacy.
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-2xl font-light text-white">Soul Matrix</h1>
      <p className="text-muted">Select 2 souls to analyze their cosmic connection</p>

      {/* Soul Grid */}
      <div className="grid grid-cols-3 gap-4">
        {MOCK_SOULS.map((soul) => (
          <button
            key={soul.id}
            onClick={() => toggleSelect(soul.id)}
            className={clsx(
              'card text-left transition-all relative',
              selected.includes(soul.id) && 'border-gold'
            )}
          >
            {selected.includes(soul.id) && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                <Check size={14} className="text-void" />
              </div>
            )}
            <div className="w-12 h-12 rounded-full bg-void-lighter flex items-center justify-center mb-3">
              <span className="text-gold text-lg">{soul.name[0]}</span>
            </div>
            <h3 className="text-white font-medium">{soul.name}</h3>
            <p className="text-muted text-sm font-mono">{soul.birthDate}</p>
          </button>
        ))}

        {/* Add Button */}
        <button
          onClick={() => setShowModal(true)}
          className="card border-dashed flex flex-col items-center justify-center text-muted hover:text-gold hover:border-gold transition-all"
        >
          <Plus size={24} />
          <span className="text-sm mt-2">Add Soul</span>
        </button>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-[72px] right-0 p-4 bg-void-light border-t border-border">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <div className="text-muted text-sm">
            {selected.length}/2 selected
          </div>
          <button
            onClick={handleAnalyze}
            disabled={selected.length !== 2}
            className="btn-primary"
          >
            Analyze Bond
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-white">Inscribe Soul</h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Name" className="input" />
              <input type="date" className="input" />
              <input type="time" className="input" />
              <input type="text" placeholder="Birth Place" className="input" />
              <button className="btn-primary w-full">Add to Matrix</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function ThemeCard({ icon: Icon, title, summary, locked }: {
  icon: React.ElementType
  title: string
  summary: string
  locked?: boolean
}) {
  return (
    <div className="card hover:border-gold transition-colors cursor-pointer">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="text-gold" />
        <h4 className="text-white font-medium">{title}</h4>
        {locked && <span className="text-xs text-muted ml-auto">🔒</span>}
      </div>
      <p className="text-muted text-sm">{summary}</p>
    </div>
  )
}
