import { ArrowRight, Zap, Shield, Globe, Palette, CheckCircle, Circle } from 'lucide-react'
import { useStore } from '../store/appStore'

const features = [
  {
    icon: Zap,
    title: 'AI-Powered Rewriting',
    desc: 'Claude, GPT-4o, Gemini, or local Ollama analyze your CV, match it to a job description, and rewrite every section with strong action verbs and quantified achievements.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    desc: 'Run 100% locally with Ollama — your CV never leaves your machine. Or choose a cloud model when quality matters most.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Globe,
    title: 'Multilingual',
    desc: 'Works in English, French, German, Spanish, Chinese, Japanese, Arabic, and 100+ more. Qwen 2.5 is especially strong for non-English CVs.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Palette,
    title: 'Visual CV Builder',
    desc: 'AI picks the right template, colors, and fonts for your industry. Fine-tune everything live, then export a beautiful A4 PDF.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
]

export default function Welcome() {
  const store = useStore()

  function getSmartCTA(): { label: string; page: typeof store.page } {
    if (!store.activeConfig) return { label: 'Choose AI Model', page: 'models' }
    if (!store.cvText) return { label: 'Upload Your CV', page: 'workspace' }
    if (!store.analysisResult) return { label: 'Analyze CV', page: 'workspace' }
    return { label: 'View Results & Export', page: 'builder' }
  }

  const cta = getSmartCTA()

  const steps = [
    { label: 'Choose AI Model', detail: store.activeConfig?.model, done: !!store.activeConfig, page: 'models' as const },
    { label: 'Upload Your CV', detail: store.cvFileName, done: !!store.cvText, page: 'workspace' as const },
    { label: 'Analyze & Rewrite', detail: store.analysisResult ? `Score: ${store.analysisResult.score}/100` : null, done: !!store.analysisResult, page: 'workspace' as const },
    { label: 'Export PDF', detail: store.pdfExported ? 'Exported ✓' : null, done: store.pdfExported, page: 'builder' as const, disabled: !store.currentCV },
  ]

  const hasProgress = steps.some((s) => s.done)

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="text-center mb-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-violet-300 text-sm mb-6">
          <Zap size={14} />
          <span>AI-Powered CV Optimization</span>
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
          Transform your CV with{' '}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            AI
          </span>
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed">
          Upload your CV, paste a job description (or a URL), and get a professionally
          rewritten CV with ATS keywords, cover letter opener, and beautiful visual design.
        </p>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-2 gap-4 mb-10 max-w-2xl w-full">
        {features.map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Quick-start checklist (only when user has started) */}
      {hasProgress && (
        <div className="max-w-sm w-full mb-8 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">Your Progress</div>
          <div className="space-y-2.5">
            {steps.map((step, i) => (
              <button
                key={i}
                onClick={() => !step.disabled && store.setPage(step.page)}
                disabled={!!step.disabled}
                className={`w-full flex items-center gap-3 text-left transition-colors ${
                  step.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-800 rounded-lg px-2 py-1 -mx-2'
                }`}
              >
                {step.done
                  ? <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                  : <Circle size={15} className="text-slate-600 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${step.done ? 'text-emerald-300' : 'text-slate-400'}`}>{step.label}</div>
                  {step.detail && <div className="text-xs text-slate-500 truncate">{step.detail}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex gap-3">
        <button
          onClick={() => store.setPage(cta.page)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-violet-900/50"
        >
          <span>{cta.label}</span>
          <ArrowRight size={16} />
        </button>
        {store.activeConfig && cta.page !== 'workspace' && (
          <button
            onClick={() => store.setPage('workspace')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors border border-slate-700"
          >
            Workspace <ArrowRight size={16} />
          </button>
        )}
      </div>

      {store.ollamaRunning && (
        <div className="mt-6 flex items-center gap-2 text-emerald-400 text-sm">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Ollama is running locally
        </div>
      )}
    </div>
  )
}
