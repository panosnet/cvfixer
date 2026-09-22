import { useEffect } from 'react'
import { useStore, getState, actions } from './store/appStore'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import ToastContainer from './components/Toast'
import Welcome from './pages/Welcome'
import ModelManager from './pages/ModelManager'
import ApiKeys from './pages/ApiKeys'
import CVWorkspace from './pages/CVWorkspace'
import CVBuilder from './pages/CVBuilder'
import type { AppState } from './store/appStore'

function ActivePage({ page }: { page: AppState['page'] }) {
  switch (page) {
    case 'welcome':   return <Welcome />
    case 'models':    return <ModelManager />
    case 'apikeys':   return <ApiKeys />
    case 'workspace': return <CVWorkspace />
    case 'builder':   return <CVBuilder />
    default:          return <Welcome />
  }
}

export default function App() {
  const store = useStore()

  useEffect(() => {
    async function fetchSystemInfo() {
      try {
        const info = await window.api.system.info()
        if (info) actions.setSystemInfo(info)
      } catch {}
    }

    async function fetchOllamaStatus() {
      try {
        const status = await window.api.ollama.status()
        actions.setOllamaStatus(status)
      } catch {
        actions.setOllamaStatus({ running: false, installed: false, ram: 0, platform: window.api.platform })
      }
    }

    async function init() {
      // Fetch both in parallel on startup
      await Promise.all([fetchSystemInfo(), fetchOllamaStatus()])

      // Smart initial navigation based on persisted session
      const s = getState()
      if (s.currentCV && s.design && s.analysisResult) {
        actions.setPage('builder')
      } else if (s.cvText && s.activeConfig) {
        actions.setPage('workspace')
      }
    }
    init()

    // Poll RAM every 5s — free RAM changes as other apps open/close
    const ramPoll = setInterval(fetchSystemInfo, 5_000)
    // Poll Ollama status every 30s
    const ollamaPoll = setInterval(fetchOllamaStatus, 30_000)

    return () => { clearInterval(ramPoll); clearInterval(ollamaPoll) }
  }, [])

  return (
    <>
      <Layout>
        <ErrorBoundary key={store.page}>
          <div className="page-transition h-full">
            <ActivePage page={store.page} />
          </div>
        </ErrorBoundary>
      </Layout>
      <ToastContainer />
    </>
  )
}
