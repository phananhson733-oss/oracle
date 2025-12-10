import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ThumbsUp, ThumbsDown, X } from 'lucide-react'
import { useStore } from '../store'
import AstrologyChart from '../components/AstrologyChart'
import clsx from 'clsx'

type ViewState = 'idle' | 'loading' | 'result'

const CATEGORIES = ['self', 'love', 'career', 'karma', 'timing'] as const
const PROMPTS = [
  'What should I focus on this week?',
  'How can I improve my relationships?',
  'What career path suits me best?',
  'What past life patterns affect me?',
  'Is this a good time for change?',
]

const LOADING_TEXTS = [
  'Aligning planetary grids...',
  'Consulting the celestial archives...',
  'Decoding cosmic frequencies...',
  'Channeling stellar wisdom...',
]

export default function Oracle() {
  const { t } = useTranslation()
  const { oracleRemaining, decrementOracle } = useStore()
  const [viewState, setViewState] = useState<ViewState>('idle')
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('self')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0])

  const handleSubmit = async () => {
    if (!question.trim() || oracleRemaining <= 0) return

    setViewState('loading')
    decrementOracle()

    // Simulate loading with rotating text
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_TEXTS.length
      setLoadingText(LOADING_TEXTS[i])
    }, 2000)

    // Simulate API call
    await new Promise((r) => setTimeout(r, 4000))
    clearInterval(interval)

    setAnswer(
      `The cosmic energies surrounding your question reveal a period of transformation. Your natal Pluto in the 4th house suggests deep psychological work is needed. The current transit of Saturn through your 7th house indicates that relationships are being tested and restructured. Trust the process—what falls away was never truly aligned with your highest path. The stars suggest patience and introspection over the coming weeks.`
    )
    setViewState('result')
  }

  const handleReset = () => {
    setViewState('idle')
    setQuestion('')
    setAnswer('')
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <AnimatePresence mode="wait">
        {/* Idle State - Altar */}
        {viewState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-light text-white">{t('oracle.title')}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-harmony animate-pulse" />
                  <span className="text-muted text-sm">{t('oracle.online')}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-muted text-sm">{t('oracle.rituals')}</span>
                <span className="text-gold font-mono ml-2">{oracleRemaining}/3</span>
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm transition-all',
                    category === cat
                      ? 'bg-gold text-void font-medium'
                      : 'bg-void-light text-muted hover:text-white'
                  )}
                >
                  {t(`oracle.categories.${cat}`)}
                </button>
              ))}
            </div>

            {/* Inspiration Matrix */}
            <div className="grid grid-cols-2 gap-3">
              {PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setQuestion(prompt)}
                  className="card text-left text-sm text-muted hover:text-white hover:border-gold transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="relative">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={t('oracle.placeholder')}
                disabled={oracleRemaining <= 0}
                className="input pr-12"
              />
              <button
                onClick={handleSubmit}
                disabled={!question.trim() || oracleRemaining <= 0}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gold disabled:text-dim"
              >
                <Send size={20} />
              </button>
            </div>

            {oracleRemaining <= 0 && (
              <p className="text-center text-friction text-sm">
                You have used all free rituals. Upgrade to continue.
              </p>
            )}
          </motion.div>
        )}

        {/* Loading State - Ritual */}
        {viewState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh]"
          >
            <div className="relative">
              <div className="opacity-20">
                <AstrologyChart size={400} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin-slow w-32 h-32 border border-gold/30 rounded-full" />
              </div>
            </div>
            <motion.p
              key={loadingText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-muted mt-8 text-center"
            >
              {loadingText}
            </motion.p>
          </motion.div>
        )}

        {/* Result State - Revelation */}
        {viewState === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Close Button */}
            <button onClick={handleReset} className="absolute top-0 right-0 p-2 text-muted hover:text-white">
              <X size={24} />
            </button>

            {/* Question */}
            <div className="text-center">
              <p className="text-muted text-sm mb-2">Your Inquiry</p>
              <p className="text-white text-lg">"{question}"</p>
            </div>

            {/* Chart Snapshot */}
            <div className="flex justify-center opacity-50">
              <AstrologyChart size={300} />
            </div>

            {/* Answer */}
            <div className="card">
              <p className="text-white leading-relaxed first-letter:text-4xl first-letter:font-light first-letter:text-gold first-letter:float-left first-letter:mr-2">
                {answer}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button className="p-2 text-muted hover:text-harmony transition-colors">
                  <ThumbsUp size={20} />
                </button>
                <button className="p-2 text-muted hover:text-friction transition-colors">
                  <ThumbsDown size={20} />
                </button>
              </div>
              <button onClick={handleReset} className="btn-primary">
                {t('oracle.seal')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
