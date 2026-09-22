import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useStore } from '../store/appStore'

export default function ToastContainer() {
  const store = useStore()
  if (!store.toasts.length) return null

  return (
    <div className="fixed top-10 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {store.toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl pointer-events-auto ${
            toast.type === 'error'
              ? 'bg-red-950/95 border-red-500/40 text-red-100'
              : toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100'
              : 'bg-slate-800/98 border-slate-600/60 text-slate-100'
          }`}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'error' && <AlertCircle size={15} className="text-red-400" />}
            {toast.type === 'success' && <CheckCircle size={15} className="text-emerald-400" />}
            {toast.type === 'info' && <Info size={15} className="text-blue-400" />}
          </div>
          <p className="text-sm flex-1 leading-relaxed">{toast.message}</p>
          <button
            onClick={() => store.removeToast(toast.id)}
            className="opacity-50 hover:opacity-100 shrink-0 transition-opacity mt-0.5"
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
