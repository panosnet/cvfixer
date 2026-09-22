import { FileText, Cpu, Key, Wand2, Layout, CheckCircle, Circle, AlertCircle } from 'lucide-react'
import { useStore } from '../store/appStore'

const nav = [
  { id: 'welcome', label: 'Home', icon: FileText },
  { id: 'models', label: 'AI Models', icon: Cpu },
  { id: 'apikeys', label: 'API Keys', icon: Key },
  { id: 'workspace', label: 'Analyze CV', icon: Wand2 },
  { id: 'builder', label: 'CV Builder', icon: Layout },
] as const

export default function Sidebar() {
  const store = useStore()

  function getStatus(id: string) {
    if (id === 'models') {
      // Green = an active model is configured; amber = nothing configured
      return store.activeConfig ? 'ok' : 'neutral'
    }
    if (id === 'apikeys') {
      // Green = active paid model (so a key is in use); neutral otherwise
      if (store.activeConfig && store.activeConfig.provider !== 'ollama') return 'ok'
      return 'neutral'
    }
    if (id === 'workspace') {
      if (!store.activeConfig) return 'warn'
      if (store.analysisResult) return 'ok'
      return 'neutral'
    }
    if (id === 'builder') {
      return store.currentCV ? 'ok' : 'neutral'
    }
    return 'neutral'
  }

  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col pt-12 pb-4">
      {/* Logo */}
      <div className="px-4 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">CV Fixer</div>
            <div className="text-slate-500 text-xs">AI-Powered</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1">
        {nav.map(({ id, label, icon: Icon }) => {
          const active = store.page === id
          const status = getStatus(id)
          return (
            <button
              key={id}
              onClick={() => store.setPage(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              <span className="flex-1 text-left font-medium">{label}</span>
              {status === 'ok' && <CheckCircle size={12} className="text-emerald-400 shrink-0" />}
              {status === 'warn' && <AlertCircle size={12} className="text-amber-400 shrink-0" />}
              {status === 'neutral' && <Circle size={12} className="text-slate-600 shrink-0" />}
            </button>
          )
        })}
      </nav>

      {/* Active model badge */}
      {store.activeConfig && (
        <div className="mx-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
          <div className="text-xs text-slate-500 mb-1">Active Model</div>
          <div className="text-xs text-white font-medium truncate">{store.activeConfig.model}</div>
          <div className="text-xs text-slate-500 mt-0.5 capitalize">{store.activeConfig.provider}</div>
        </div>
      )}
    </aside>
  )
}
