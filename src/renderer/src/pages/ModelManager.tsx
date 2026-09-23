import { useState, useEffect } from 'react'
import {
  Cpu, Download, Trash2, CheckCircle, AlertTriangle,
  RefreshCw, ExternalLink, Zap, Globe, Star, MemoryStick,
  ThumbsUp, ThumbsDown, Minus, Monitor, Activity
} from 'lucide-react'
import { useStore } from '../store/appStore'
import type { OllamaModelDef, PaidModelDef } from '../types'

const OLLAMA_MODELS: OllamaModelDef[] = [
  {
    id: 'qwen2.5:14b',
    name: 'Qwen 2.5 14B',
    size: '~9 GB',
    ramRequired: '16 GB',
    ramGB: 16,
    description: 'Best multilingual model. Exceptional for non-English CVs (Chinese, Japanese, Arabic, French, German and 100+ languages). Excellent English too.',
    languages: ['English', 'Chinese', 'Japanese', 'Arabic', 'French', 'German', '100+ languages'],
    quality: 'Excellent',
    speed: 'Medium',
    recommended: true,
    tag: 'Best Multilingual',
    tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'llama3.1:8b',
    name: 'Llama 3.1 8B',
    size: '~5 GB',
    ramRequired: '8 GB',
    ramGB: 8,
    description: 'Fast and efficient. Great for most English CVs. Best balance of quality and speed for machines with 8-16 GB RAM.',
    languages: ['English', 'Multi-language basic'],
    quality: 'Good',
    speed: 'Fast',
    recommended: false,
    tag: 'Best Balanced',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'llama3.1:70b',
    name: 'Llama 3.1 70B',
    size: '~40 GB',
    ramRequired: '32 GB',
    ramGB: 32,
    description: 'Best quality local model. Exceptional CV analysis depth. Requires a powerful machine with 32+ GB RAM.',
    languages: ['English', 'Multi-language good'],
    quality: 'Excellent',
    speed: 'Slow',
    recommended: false,
    tag: 'Best Quality Local',
    tagColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  },
  {
    id: 'mistral:7b',
    name: 'Mistral 7B',
    size: '~4 GB',
    ramRequired: '8 GB',
    ramGB: 8,
    description: 'Fast European model. Great for French, Spanish, Italian, German, Portuguese CVs. Good English too.',
    languages: ['English', 'French', 'Spanish', 'Italian', 'German', 'Portuguese'],
    quality: 'Good',
    speed: 'Fast',
    recommended: false,
    tag: 'European Languages',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'phi3.5:mini',
    name: 'Phi 3.5 Mini',
    size: '~2 GB',
    ramRequired: '4 GB',
    ramGB: 4,
    description: "Microsoft's lightweight model. Basic CV improvements on low-spec machines or for quick feedback.",
    languages: ['English'],
    quality: 'Basic',
    speed: 'Very Fast',
    recommended: false,
    tag: 'Ultra Light',
    tagColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  },
]

const PAID_MODELS: PaidModelDef[] = [
  {
    provider: 'anthropic',
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    description: 'Best overall CV fixer. Exceptional at professional writing, tone, ATS optimization, and tailoring to job requirements. Recommended for best results.',
    costInfo: '$3 / $15 per M tokens',
    quality: 'Exceptional',
    recommended: true,
    keyName: 'anthropic',
  },
  {
    provider: 'anthropic',
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    description: 'Most capable Claude model. Best for complex CV transformations, executive-level CVs, and senior leadership roles.',
    costInfo: '$15 / $75 per M tokens',
    quality: 'Best',
    recommended: false,
    keyName: 'anthropic',
  },
  {
    provider: 'openai',
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Excellent CV analysis. Very strong at ATS keyword extraction, structured rewriting, and gap analysis.',
    costInfo: '$5 / $15 per M tokens',
    quality: 'Excellent',
    recommended: false,
    keyName: 'openai',
  },
  {
    provider: 'openai',
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and affordable. Good for basic CV improvements and quick iterations.',
    costInfo: '$0.15 / $0.60 per M tokens',
    quality: 'Good',
    recommended: false,
    keyName: 'openai',
  },
  {
    provider: 'google',
    id: 'gemini-2.0-pro',
    name: 'Gemini 2.0 Pro',
    description: "Google's flagship. Strong multilingual support, long context window.",
    costInfo: '$1.25 / $5 per M tokens',
    quality: 'Excellent',
    recommended: false,
    keyName: 'google',
  },
]

// Known model families and their CV-quality ratings
const MODEL_RATINGS: Array<{
  match: RegExp
  verdict: 'excellent' | 'good' | 'ok' | 'weak'
  note: string
}> = [
  { match: /llama3\.?[12].*70b/i,   verdict: 'excellent', note: 'Excellent for CV writing — large, capable model' },
  { match: /llama3\.?[12].*8b/i,    verdict: 'good',      note: 'Good for CV writing — fast and capable' },
  { match: /llama3\.?[12]/i,        verdict: 'good',      note: 'Good — Llama 3.x family works well for CVs' },
  { match: /qwen2?\.?5.*72b/i,      verdict: 'excellent', note: 'Excellent — best multilingual CV model' },
  { match: /qwen2?\.?5.*14b/i,      verdict: 'excellent', note: 'Excellent — strong multilingual support' },
  { match: /qwen2?\.?5.*7b/i,       verdict: 'good',      note: 'Good — solid multilingual model' },
  { match: /qwen/i,                  verdict: 'good',      note: 'Good — Qwen family handles CVs well' },
  { match: /mistral.*7b/i,           verdict: 'good',      note: 'Good — especially for European language CVs' },
  { match: /mistral.*nemo/i,         verdict: 'good',      note: 'Good — Mistral Nemo is capable' },
  { match: /mixtral/i,               verdict: 'excellent', note: 'Excellent — MoE architecture, very capable' },
  { match: /mistral/i,               verdict: 'good',      note: 'Good — Mistral models work well for CVs' },
  { match: /deepseek.*r1/i,          verdict: 'excellent', note: 'Excellent reasoning — great for detailed CV analysis' },
  { match: /deepseek.*v3/i,          verdict: 'excellent', note: 'Excellent — DeepSeek V3 is highly capable' },
  { match: /deepseek.*67b/i,         verdict: 'excellent', note: 'Excellent — large, capable model' },
  { match: /deepseek.*33b/i,         verdict: 'good',      note: 'Good — solid DeepSeek model' },
  { match: /deepseek/i,              verdict: 'good',      note: 'Good — DeepSeek works well for CVs' },
  { match: /gemma.*27b/i,            verdict: 'good',      note: 'Good — larger Gemma is capable' },
  { match: /gemma.*9b/i,             verdict: 'ok',        note: 'OK — adequate for basic CV improvements' },
  { match: /gemma/i,                 verdict: 'ok',        note: 'OK — Gemma is decent but better options exist' },
  { match: /phi3?\.?5.*mini/i,       verdict: 'ok',        note: 'OK — very fast but limited for complex CVs' },
  { match: /phi3?\.?5/i,             verdict: 'ok',        note: 'OK — lightweight, use for quick feedback only' },
  { match: /phi/i,                   verdict: 'ok',        note: 'OK — lightweight model, limited capability' },
  { match: /orca/i,                  verdict: 'ok',        note: 'OK — fine-tuned for chat, decent for CVs' },
  { match: /solar/i,                 verdict: 'good',      note: 'Good — Solar models work well for writing' },
  { match: /command-r/i,             verdict: 'excellent', note: 'Excellent — Cohere Command R is great for RAG/writing tasks' },
  { match: /wizard/i,                verdict: 'good',      note: 'Good — WizardLM is strong at instruction following' },
  { match: /vicuna/i,                verdict: 'ok',        note: 'OK — older model, limited CV writing quality' },
  { match: /codellama/i,             verdict: 'weak',      note: 'Weak — code model, not suited for CV writing' },
  { match: /starcoder/i,             verdict: 'weak',      note: 'Weak — code model, not suited for CV writing' },
  { match: /stable-?code/i,          verdict: 'weak',      note: 'Weak — code model, not suited for CV writing' },
  { match: /nomic-embed/i,           verdict: 'weak',      note: 'Weak — embedding model only, cannot generate text' },
  { match: /mxbai/i,                 verdict: 'weak',      note: 'Weak — embedding model only' },
  { match: /all-minilm/i,            verdict: 'weak',      note: 'Weak — embedding model only' },
]

function rateModel(modelName: string): { verdict: 'excellent' | 'good' | 'ok' | 'weak' | 'unknown'; note: string } {
  for (const rule of MODEL_RATINGS) {
    if (rule.match.test(modelName)) {
      return { verdict: rule.verdict, note: rule.note }
    }
  }
  return { verdict: 'unknown', note: 'Unknown model — may work, try it and see' }
}

const VERDICT_STYLES = {
  excellent: { label: 'Excellent for CVs', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400', icon: ThumbsUp },
  good:      { label: 'Good for CVs',      color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       dot: 'bg-blue-400',    icon: ThumbsUp },
  ok:        { label: 'OK for CVs',        color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     dot: 'bg-amber-400',   icon: Minus },
  weak:      { label: 'Not recommended',   color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         dot: 'bg-red-400',     icon: ThumbsDown },
  unknown:   { label: 'Unknown quality',   color: 'text-slate-400',   bg: 'bg-slate-700/50 border-slate-600',        dot: 'bg-slate-500',   icon: Minus },
}

interface InstalledModel {
  name: string
  size: number
  modified_at: string
}

interface DownloadState {
  [key: string]: { status: string; percent: number; downloading: boolean }
}

// Check if an installed model matches a predefined model ID.
// "llama3.1:8b-instruct-q4_K_M" should match predefined "llama3.1:8b"
// but "qwen2.5:8b" must NOT match "llama3.1:8b".
function matchesPredefined(installed: string, predefined: string): boolean {
  if (installed.toLowerCase() === predefined.toLowerCase()) return true
  const [predBase, predTag = ''] = predefined.toLowerCase().split(':')
  const [instBase, instTag = ''] = installed.toLowerCase().split(':')
  return instBase === predBase && instTag.startsWith(predTag)
}

export default function ModelManager() {
  const store = useStore()
  const [installedModels, setInstalledModels] = useState<InstalledModel[]>([])
  const [downloads, setDownloads] = useState<DownloadState>({})
  const [ollamaInstalling, setOllamaInstalling] = useState(false)
  const [installLog, setInstallLog] = useState<string[]>([])
  const [tab, setTab] = useState<'local' | 'paid'>(
    store.activeConfig && store.activeConfig.provider !== 'ollama' ? 'paid' : 'local'
  )
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  useEffect(() => {
    checkOllamaAndModels()

    const unsubProgress = window.api.ollama.onPullProgress((data) => {
      setDownloads((prev) => ({
        ...prev,
        [data.modelName]: { status: data.status, percent: data.percent, downloading: true },
      }))
      if (data.status === 'success') {
        setDownloads((prev) => ({
          ...prev,
          [data.modelName]: { ...prev[data.modelName], downloading: false },
        }))
        loadInstalledModels()
      }
    })

    const unsubInstall = window.api.ollama.onInstallProgress((msg) => {
      setInstallLog((prev) => [...prev.slice(-20), msg])
    })

    return () => {
      unsubProgress()
      unsubInstall()
    }
  }, [])

  async function checkOllamaAndModels() {
    const status = await window.api.ollama.status()
    store.setOllamaStatus(status)
    if (status.running) loadInstalledModels()
  }

  async function loadInstalledModels() {
    try {
      const models = await window.api.ollama.listModels()
      setInstalledModels(models)
    } catch {}
  }

  async function handleStartOllama() {
    const result = await window.api.ollama.start()
    if (result.success) {
      await checkOllamaAndModels()
    } else {
      store.addToast(`Failed to start Ollama: ${result.error}`, 'error')
    }
  }

  async function handleInstallLinux() {
    setOllamaInstalling(true)
    setInstallLog([])
    const result = await window.api.ollama.installLinux()
    setOllamaInstalling(false)
    if (result.success) {
      await handleStartOllama()
    } else {
      store.addToast(`Install failed: ${result.error}`, 'error')
    }
  }

  async function handlePull(modelId: string) {
    setDownloads((prev) => ({
      ...prev,
      [modelId]: { status: 'Starting...', percent: 0, downloading: true },
    }))
    const result = await window.api.ollama.pullModel(modelId)
    if (!result.success) {
      setDownloads((prev) => ({ ...prev, [modelId]: { ...prev[modelId], downloading: false } }))
      store.addToast(`Download failed: ${result.error}`, 'error')
    }
  }

  async function handleDelete(modelId: string) {
    // Use inline confirmation instead of window.confirm (disabled in Electron)
    setPendingDelete(modelId)
  }

  async function confirmDelete(modelId: string) {
    setPendingDelete(null)
    const result = await window.api.ollama.deleteModel(modelId)
    if (result.success) {
      loadInstalledModels()
      store.addToast(`Model "${modelId}" deleted`, 'success')
      // Clear activeConfig if we just deleted the active model
      if (store.activeConfig?.model === modelId) {
        store.setActiveConfig(null)
        store.addToast('Active model was deleted — please select a new one', 'info')
      }
    } else {
      store.addToast(`Delete failed: ${result.error}`, 'error')
    }
  }

  function selectModel(modelId: string) {
    store.setActiveConfig({ provider: 'ollama', model: modelId })
    store.addToast(`Model set to ${modelId}`, 'success')
  }

  function selectPaidModel(model: PaidModelDef) {
    const key = store.apiKeys[model.keyName]
    if (!key) {
      store.addToast(`Add your ${model.keyName.charAt(0).toUpperCase() + model.keyName.slice(1)} API key first`, 'info')
      store.setPage('apikeys')
      return
    }
    store.setActiveConfig({ provider: model.provider, model: model.id, apiKey: key })
    store.addToast(`Model set to ${model.name}`, 'success')
  }

  const installedNames = installedModels.map((m) => m.name)

  // Models that are installed but don't match any predefined entry
  const unknownInstalled = installedModels.filter(
    (m) => !OLLAMA_MODELS.some((p) => matchesPredefined(m.name, p.id))
  )

  const isActive = (id: string) => store.activeConfig?.model === id

  const formatSize = (bytes: number) => {
    if (!bytes) return ''
    const gb = bytes / 1024 / 1024 / 1024
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1024 / 1024).toFixed(0)} MB`
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">AI Models</h1>
        <p className="text-slate-400 text-sm">Choose between free local models (Ollama) or paid cloud APIs.</p>
      </div>

      {/* Hardware Dashboard */}
      <HardwareDashboard store={store} />

      {/* Ollama Status Banner */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${
        store.ollamaRunning
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-slate-800 border-slate-700'
      }`}>
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${store.ollamaRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
        <div className="flex-1">
          <span className={`font-medium text-sm ${store.ollamaRunning ? 'text-emerald-300' : 'text-slate-300'}`}>
            Ollama {store.ollamaRunning ? 'is running' : store.ollamaInstalled ? 'is installed but not running' : 'is not installed'}
          </span>
          {store.ollamaRunning && (
            <span className="text-slate-500 text-xs ml-2">
              localhost:11434 · {store.freeRAM.toFixed(1)} GB free / {store.systemRAM} GB · {installedModels.length} model{installedModels.length !== 1 ? 's' : ''} installed
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={checkOllamaAndModels} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
            <RefreshCw size={14} className="text-slate-400" />
          </button>
          {!store.ollamaRunning && store.ollamaInstalled && (
            <button onClick={handleStartOllama} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-medium transition-colors">
              Start Ollama
            </button>
          )}
          {!store.ollamaInstalled && store.platform === 'linux' && (
            <button onClick={handleInstallLinux} disabled={ollamaInstalling} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg font-medium transition-colors disabled:opacity-50">
              {ollamaInstalling ? 'Installing...' : 'Auto Install'}
            </button>
          )}
          {!store.ollamaInstalled && store.platform !== 'linux' && (
            <button onClick={() => window.api.ollama.openDownload()} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg font-medium transition-colors">
              Download Ollama <ExternalLink size={11} />
            </button>
          )}
        </div>
      </div>

      {installLog.length > 0 && (
        <div className="mb-6 p-3 bg-black rounded-xl font-mono text-xs text-emerald-400 max-h-32 overflow-y-auto">
          {installLog.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800 rounded-xl mb-6 w-fit">
        {(['local', 'paid'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'local' ? '🖥  Local (Free)' : '☁️  Cloud APIs (Paid)'}
          </button>
        ))}
      </div>

      {/* Local Models */}
      {tab === 'local' && (
        <div className="space-y-6">
          {/* ── Detected installed models ── */}
          {store.ollamaRunning && installedModels.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-white font-semibold text-sm">Your Installed Models</h2>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  {installedModels.length} found
                </span>
              </div>
              <div className="space-y-2">
                {installedModels.map((model) => {
                  const rating = rateModel(model.name)
                  const style = VERDICT_STYLES[rating.verdict]
                  const active = isActive(model.name)
                  const VerdictIcon = style.icon
                  // Warn based on AVAILABLE (free) RAM, not total
                  const modelGB = model.size / 1e9
                  const available = store.freeRAM > 0 ? store.freeRAM : store.systemRAM
                  const fitsComfortably = modelGB <= available * 0.8
                  const fitsTight = modelGB <= available * 1.05
                  const ramWarning = !fitsTight
                    ? `${modelGB.toFixed(1)} GB model, only ${available.toFixed(1)} GB free — will be extremely slow`
                    : !fitsComfortably
                    ? `${modelGB.toFixed(1)} GB model, ${available.toFixed(1)} GB free — may be slow`
                    : ''

                  return (
                    <div key={model.name} className={`p-3.5 rounded-xl border transition-all ${
                      active ? 'border-violet-500 bg-violet-500/10' :
                      ramWarning ? 'border-red-500/40 bg-red-500/5' :
                      'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-semibold text-sm font-mono">{model.name}</span>
                            {model.size > 0 && (
                              <span className="text-xs text-slate-500">{formatSize(model.size)}</span>
                            )}
                            {ramWarning && (
                              <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">
                                <AlertTriangle size={9} /> Too large for RAM
                              </span>
                            )}
                          </div>
                          <div className={`flex items-center gap-1.5 mt-1 text-xs ${style.color}`}>
                            <VerdictIcon size={11} />
                            <span className="font-medium">{style.label}</span>
                            <span className="text-slate-500">— {rating.note}</span>
                          </div>
                          {ramWarning && (
                            <div className="mt-1 text-xs text-red-400">{ramWarning}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {active ? (
                            <span className="flex items-center gap-1 text-xs text-violet-300 font-medium">
                              <CheckCircle size={12} /> Active
                            </span>
                          ) : (
                            <button
                              onClick={() => selectModel(model.name)}
                              disabled={!store.ollamaRunning || rating.verdict === 'weak'}
                              className={`px-3 py-1.5 disabled:opacity-40 text-white text-xs rounded-lg font-medium transition-colors ${
                                ramWarning ? 'bg-red-700 hover:bg-red-600' : 'bg-violet-600 hover:bg-violet-500'
                              }`}
                              title={rating.verdict === 'weak' ? rating.note : ramWarning}
                            >
                              {ramWarning ? '⚠ Use Anyway' : 'Use This'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(model.name)}
                            className="p-1.5 border border-slate-700 hover:border-red-500 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* No models installed but Ollama is running */}
          {store.ollamaRunning && installedModels.length === 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <div>
                <div className="text-amber-300 text-sm font-medium">No models installed yet</div>
                <div className="text-amber-400/70 text-xs mt-0.5">Download a model below to get started.</div>
              </div>
            </div>
          )}

          {/* ── Recommended models to download ── */}
          <div>
            <h2 className="text-white font-semibold text-sm mb-3">
              {installedModels.length > 0 ? 'Recommended Models to Download' : 'Available Models'}
            </h2>
            <div className="space-y-3">
              {OLLAMA_MODELS.map((model) => {
                const installed = installedNames.some((n) => matchesPredefined(n, model.id))
                const installedName = installedNames.find((n) => matchesPredefined(n, model.id))
                const active = installedName ? isActive(installedName) : false
                const dl = downloads[model.id]
                const availableRAM = store.freeRAM > 0 ? store.freeRAM : store.systemRAM
                const ramOk = availableRAM >= model.ramGB

                return (
                  <div key={model.id} className={`p-4 rounded-xl border transition-all ${
                    active ? 'border-violet-500 bg-violet-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-white font-semibold text-sm">{model.name}</span>
                          {model.recommended && <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full"><Star size={10} /> Recommended</span>}
                          <span className={`text-xs border px-2 py-0.5 rounded-full ${model.tagColor}`}>{model.tag}</span>
                          {installed && <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">✓ Installed</span>}
                          {!ramOk && <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full"><MemoryStick size={10} /> Needs {model.ramRequired}</span>}
                        </div>
                        <p className="text-slate-400 text-xs mb-2 leading-relaxed">{model.description}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Cpu size={10} /> {model.size}</span>
                          <span className="flex items-center gap-1"><MemoryStick size={10} /> {model.ramRequired} RAM</span>
                          <span className="flex items-center gap-1"><Zap size={10} /> {model.speed}</span>
                          <span className="flex items-center gap-1"><Globe size={10} /> {model.languages.slice(0, 3).join(', ')}{model.languages.length > 3 ? '...' : ''}</span>
                        </div>

                        {dl?.downloading && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>{dl.status}</span>
                              <span>{dl.percent}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full transition-all duration-300" style={{ width: `${dl.percent}%` }} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        {active && <span className="flex items-center gap-1 text-xs text-violet-300 font-medium"><CheckCircle size={12} /> Active</span>}
                        {installed ? (
                          <>
                            {!active && store.ollamaRunning && installedName && (
                              <button onClick={() => selectModel(installedName)} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg font-medium transition-colors">
                                Use This
                              </button>
                            )}
                            {!store.ollamaRunning && <span className="text-xs text-slate-500">Start Ollama first</span>}
                            <button onClick={() => handleDelete(installedName || model.id)} className="flex items-center gap-1 px-3 py-1.5 border border-slate-700 hover:border-red-500 text-slate-400 hover:text-red-400 text-xs rounded-lg transition-colors">
                              <Trash2 size={11} /> Delete
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handlePull(model.id)}
                            disabled={!store.ollamaRunning || dl?.downloading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs rounded-lg font-medium transition-colors"
                          >
                            <Download size={11} /> {dl?.downloading ? 'Downloading...' : 'Download'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Custom model input */}
          {store.ollamaRunning && (
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/50">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Use Any Ollama Model</div>
              <p className="text-slate-600 text-xs mb-3">Type any model name already installed in Ollama (e.g. <span className="font-mono text-slate-500">llama3.3:70b</span>).</p>
              <CustomModelInput onSelect={selectModel} />
            </div>
          )}
        </div>
      )}

      {/* Paid Models */}
      {tab === 'paid' && (
        <div className="space-y-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
            Paid models require an API key. Add your keys in the{' '}
            <button onClick={() => store.setPage('apikeys')} className="underline font-medium">API Keys</button> page.
          </div>
          {PAID_MODELS.map((model) => {
            const active = isActive(model.id)
            const hasKey = !!store.apiKeys[model.keyName]
            const providerEmoji = { anthropic: '🟣', openai: '🟢', google: '🔵' }[model.provider]
            return (
              <div key={model.id} className={`p-4 rounded-xl border transition-all ${
                active ? 'border-violet-500 bg-violet-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-semibold text-sm">{providerEmoji} {model.name}</span>
                      {model.recommended && <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full"><Star size={10} /> Recommended</span>}
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{model.quality}</span>
                    </div>
                    <p className="text-slate-400 text-xs mb-2 leading-relaxed">{model.description}</p>
                    <div className="text-xs text-slate-500">Cost: {model.costInfo} (in/out)</div>
                    {!hasKey && (
                      <button onClick={() => store.setPage('apikeys')} className="mt-2 text-xs text-violet-400 hover:text-violet-300 underline">
                        + Add {model.keyName.charAt(0).toUpperCase() + model.keyName.slice(1)} API key
                      </button>
                    )}
                  </div>
                  <div className="shrink-0">
                    {active ? (
                      <span className="flex items-center gap-1 text-xs text-violet-300 font-medium"><CheckCircle size={12} /> Active</span>
                    ) : (
                      <button
                        onClick={() => selectPaidModel(model)}
                        disabled={!hasKey}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs rounded-lg font-medium transition-colors"
                      >
                        {hasKey ? 'Use This' : 'Need API Key'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {store.activeConfig && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => store.setPage('workspace')}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Continue to Workspace →
          </button>
        </div>
      )}

      {/* Inline delete confirmation modal */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-white font-semibold text-base mb-2">Delete Model?</h3>
            <p className="text-slate-400 text-sm mb-1 font-mono">{pendingDelete}</p>
            <p className="text-slate-500 text-xs mb-6">This frees up disk space. You can download it again later.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(pendingDelete)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-xl font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CustomModelInput({ onSelect }: { onSelect: (name: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) { onSelect(value.trim()); setValue('') } }}
        placeholder="e.g. llama3.3:70b, deepseek-r1:8b"
        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-violet-500"
      />
      <button
        onClick={() => { if (value.trim()) { onSelect(value.trim()); setValue('') } }}
        disabled={!value.trim()}
        className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs rounded-lg font-medium transition-colors"
      >
        Use
      </button>
    </div>
  )
}

// ─── Hardware Dashboard ───────────────────────────────────────────────────────

type StoreSlice = ReturnType<typeof import('../store/appStore').useStore>

function HardwareDashboard({ store }: { store: StoreSlice }) {
  const { totalRAM, freeRAM, usedRAM, cpuModel, cpuCores, hasAppleSilicon } = {
    totalRAM: store.systemRAM,
    freeRAM: store.freeRAM,
    usedRAM: store.systemRAM - store.freeRAM,
    cpuModel: store.cpuModel,
    cpuCores: store.cpuCores,
    hasAppleSilicon: store.hasAppleSilicon,
  }

  if (totalRAM === 0) return null // not loaded yet

  const ramUsedPct = totalRAM > 0 ? (usedRAM / totalRAM) * 100 : 0
  const ramPressure = ramUsedPct > 85 ? 'high' : ramUsedPct > 65 ? 'medium' : 'low'
  const pressureColor = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' }[ramPressure]

  // Recommend model tier based on available RAM
  const tier = getModelTierLabel(freeRAM)

  return (
    <div className="mb-5 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <Monitor size={13} className="text-slate-400" />
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Hardware</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        {/* RAM */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <MemoryStick size={12} className="text-slate-400" />
              <span className="text-xs text-slate-400">Memory</span>
            </div>
            <span className="text-xs font-mono text-white">
              {freeRAM.toFixed(1)} <span className="text-slate-500">/ {totalRAM.toFixed(0)} GB free</span>
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${pressureColor}`}
              style={{ width: `${Math.min(100, ramUsedPct)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-600">Used: {usedRAM.toFixed(1)} GB</span>
            {ramPressure === 'high' && (
              <span className="text-xs text-red-400">⚠ High pressure</span>
            )}
            {ramPressure === 'medium' && (
              <span className="text-xs text-amber-400">Moderate</span>
            )}
            {ramPressure === 'low' && (
              <span className="text-xs text-emerald-400">Healthy</span>
            )}
          </div>
        </div>

        {/* CPU */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Cpu size={12} className="text-slate-400" />
            <span className="text-xs text-slate-400">Processor</span>
            {hasAppleSilicon && (
              <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded-full">Apple Silicon</span>
            )}
          </div>
          <div className="text-xs text-white font-medium truncate">{cpuModel || 'Detecting...'}</div>
          <div className="text-xs text-slate-500 mt-0.5">{cpuCores} threads</div>
        </div>
      </div>

      {/* Model recommendation */}
      <div className={`px-4 py-3 border-t border-slate-800 flex items-start gap-3 ${tier.bg}`}>
        <Activity size={13} className={`${tier.iconColor} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-semibold ${tier.textColor}`}>
            Best for your hardware right now: <span className="font-mono">{tier.label}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{tier.note}</div>
          {freeRAM < 6 && (
            <div className="text-xs text-amber-400 mt-1">
              💡 Close other apps to free RAM before running a local model
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getModelTierLabel(freeRAMGB: number) {
  if (freeRAMGB >= 35) return {
    label: '70B+ models (qwen2.5:72b, llama3.1:70b)',
    note: 'All models fit comfortably — excellent quality available',
    bg: 'bg-emerald-500/5', textColor: 'text-emerald-300', iconColor: 'text-emerald-400',
  }
  if (freeRAMGB >= 18) return {
    label: '27-32B models (qwen2.5:32b)',
    note: 'Large models run well — great quality and speed',
    bg: 'bg-blue-500/5', textColor: 'text-blue-300', iconColor: 'text-blue-400',
  }
  if (freeRAMGB >= 10) return {
    label: '14B models (qwen2.5:14b, llama3.1:13b)',
    note: 'Solid performance — excellent for CV analysis',
    bg: 'bg-violet-500/5', textColor: 'text-violet-300', iconColor: 'text-violet-400',
  }
  if (freeRAMGB >= 6) return {
    label: '7-8B models (llama3.1:8b, mistral:7b)',
    note: 'Fast and capable — good for most CVs',
    bg: 'bg-amber-500/5', textColor: 'text-amber-300', iconColor: 'text-amber-400',
  }
  if (freeRAMGB >= 3) return {
    label: 'Mini models (phi3.5:mini, llama3.2:3b)',
    note: 'Limited RAM — consider a paid API for best results',
    bg: 'bg-orange-500/5', textColor: 'text-orange-300', iconColor: 'text-orange-400',
  }
  return {
    label: 'Paid API recommended (Claude, GPT-4o)',
    note: 'Not enough free RAM for local models right now',
    bg: 'bg-red-500/5', textColor: 'text-red-300', iconColor: 'text-red-400',
  }
}
