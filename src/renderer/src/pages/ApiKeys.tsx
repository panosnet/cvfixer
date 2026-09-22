import { useState } from 'react'
import { Key, Eye, EyeOff, CheckCircle, Shield, X } from 'lucide-react'
import { useStore } from '../store/appStore'
import type { ProviderKey } from '../types'

const providers: Array<{
  id: ProviderKey
  name: string
  emoji: string
  placeholder: string
  hint: string
  models: string[]
  recommended: boolean
}> = [
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    emoji: '🟣',
    placeholder: 'sk-ant-api03-...',
    hint: 'console.anthropic.com → API Keys',
    models: ['claude-sonnet-4-5', 'claude-opus-4-5'],
    recommended: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    emoji: '🟢',
    placeholder: 'sk-proj-...',
    hint: 'platform.openai.com → API Keys',
    models: ['gpt-4o', 'gpt-4o-mini'],
    recommended: false,
  },
  {
    id: 'google',
    name: 'Google AI',
    emoji: '🔵',
    placeholder: 'AIzaSy...',
    hint: 'aistudio.google.com → Get API Key',
    models: ['gemini-1.5-pro'],
    recommended: false,
  },
]

export default function ApiKeys() {
  const store = useStore()
  const [drafts, setDrafts] = useState<Record<string, string>>({
    anthropic: store.apiKeys.anthropic,
    openai: store.apiKeys.openai,
    google: store.apiKeys.google,
  })
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [formatWarning, setFormatWarning] = useState<Record<string, string>>({})

  const KEY_PREFIXES: Record<ProviderKey, string> = {
    anthropic: 'sk-ant-',
    openai: 'sk-',
    google: 'AIzaSy',
  }

  function toggle(id: string) {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleSave(id: ProviderKey) {
    const key = drafts[id]
    const prefix = KEY_PREFIXES[id]
    if (key && !key.startsWith(prefix)) {
      setFormatWarning((prev) => ({ ...prev, [id]: `Unexpected format — expected key starting with "${prefix}"` }))
    } else {
      setFormatWarning((prev) => ({ ...prev, [id]: '' }))
    }
    store.setApiKey(id, key)
    setSaved((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => setSaved((prev) => ({ ...prev, [id]: false })), 2000)
  }

  function handleClear(id: ProviderKey) {
    setDrafts((prev) => ({ ...prev, [id]: '' }))
    store.setApiKey(id, '')
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">API Keys</h1>
        <p className="text-slate-400 text-sm">Add API keys for cloud models. Keys are stored locally only — never sent to any server except the AI provider.</p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6">
        <Shield size={16} className="text-emerald-400 mt-0.5 shrink-0" />
        <div>
          <div className="text-emerald-300 font-medium text-sm">Stored on your device only</div>
          <div className="text-emerald-400/70 text-xs mt-0.5">
            Keys are saved in the app's local storage — not synced, not logged, not transmitted anywhere.
          </div>
        </div>
      </div>

      <div className="space-y-4 max-w-xl">
        {providers.map((provider) => {
          const currentKey = store.apiKeys[provider.id]
          const isSaved = saved[provider.id]
          const isVis = visible[provider.id]
          const draft = drafts[provider.id]
          const isDirty = draft !== currentKey

          const warning = formatWarning[provider.id]

          return (
            <div key={provider.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{provider.emoji}</span>
                <span className="text-white font-semibold text-sm">{provider.name}</span>
                {provider.recommended && (
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
                {currentKey && !isDirty && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 ml-auto">
                    <CheckCircle size={11} /> Saved
                  </span>
                )}
              </div>

              <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  <input
                    type={isVis ? 'text' : 'password'}
                    value={draft}
                    onChange={(e) => setDrafts((p) => ({ ...p, [provider.id]: e.target.value }))}
                    placeholder={provider.placeholder}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500 pr-20 font-mono"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button onClick={() => toggle(provider.id)} className="text-slate-500 hover:text-slate-300 p-0.5">
                      {isVis ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    {currentKey && (
                      <button onClick={() => handleClear(provider.id)} className="text-slate-500 hover:text-red-400 p-0.5">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleSave(provider.id)}
                  disabled={!draft || !isDirty}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 ${
                    isSaved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-violet-600 hover:bg-violet-500 text-white'
                  }`}
                >
                  {isSaved ? '✓ Saved' : 'Save'}
                </button>
              </div>

              {warning && (
                <div className="mt-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
                  ⚠ {warning}
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-600">Models: {provider.models.join(', ')}</span>
                <span className="text-xs text-slate-600">{provider.hint}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => store.setPage('models')}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          ← Back to Models
        </button>
        <button
          onClick={() => store.setPage('workspace')}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Continue to Workspace →
        </button>
      </div>
    </div>
  )
}
