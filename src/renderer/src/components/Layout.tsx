import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import { useStore } from '../store/appStore'

export default function Layout({ children }: { children: ReactNode }) {
  const store = useStore()
  const isMac = store.platform === 'darwin'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Traffic lights spacer on Mac */}
      {isMac && (
        <div className="drag-region fixed top-0 left-0 right-0 h-8 z-50 pointer-events-none" />
      )}
      <Sidebar />
      <main className={`flex-1 overflow-hidden flex flex-col ${isMac ? 'pt-8' : ''}`}>
        {children}
      </main>
    </div>
  )
}
