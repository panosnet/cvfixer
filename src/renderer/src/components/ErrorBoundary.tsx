import { Component, ErrorInfo, ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CV Fixer crash:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💥</span>
            </div>
            <h2 className="text-white font-bold text-lg mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-2 leading-relaxed">
              {this.state.error.message}
            </p>
            <p className="text-slate-600 text-xs mb-6">
              Try reloading the app. If the issue persists, restart CV Fixer.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw size={14} /> Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
