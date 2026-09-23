import React, { useState, useEffect, useRef } from 'react'
import {
  Upload, FileText, Briefcase, Wand2, AlertTriangle,
  ChevronRight, X, Loader2, TrendingUp, Target, Search,
  Link, Globe, Copy, Check, Lightbulb, ChevronDown, ChevronUp,
  RefreshCw, Info, Eye, Zap, MessageSquare, Award, Terminal, Settings2, Trash2
} from 'lucide-react'
import { useStore } from '../store/appStore'

function getStreamStatus(buffer: string): string {
  if (buffer.includes('"interviewPrep"')) return 'Preparing interview tips...'
  if (buffer.includes('"improvements"')) return 'Writing improvement suggestions...'
  if (buffer.includes('"bulletQualityIssues"')) return 'Reviewing bullet quality...'
  if (buffer.includes('"coverLetterOpening"')) return 'Crafting cover letter opener...'
  if (buffer.includes('"keywordsMissing"')) return 'Analyzing keyword gaps...'
  if (buffer.includes('"keywordsFound"')) return 'Matching JD keywords...'
  if (buffer.includes('"topWeakness"')) return 'Identifying top fix...'
  if (buffer.includes('"topStrength"')) return 'Identifying top strength...'
  if (buffer.includes('"scoreBreakdown"')) return 'Calculating score breakdown...'
  if (buffer.includes('"score"') && !buffer.includes('"rewrittenCV"')) return 'Scoring your CV...'
  if (buffer.includes('"projects"')) return 'Writing projects section...'
  if (buffer.includes('"certifications"')) return 'Listing certifications...'
  if (buffer.includes('"skills"')) return 'Organizing skills...'
  if (buffer.includes('"education"')) return 'Extracting education...'
  if (buffer.includes('"experience"')) return 'Rewriting experience bullets...'
  if (buffer.includes('"coreCompetencies"')) return 'Building core competencies...'
  if (buffer.includes('"summary"') && buffer.includes('"rewrittenCV"')) return 'Writing professional summary...'
  if (buffer.includes('"rewrittenCV"')) return 'Starting CV rewrite...'
  if (buffer.length > 5) return 'Analyzing with AI...'
  return 'Starting analysis...'
}

function getStreamProgress(buffer: string): number {
  if (buffer.includes('"interviewPrep"')) return 95
  if (buffer.includes('"improvements"')) return 88
  if (buffer.includes('"bulletQualityIssues"')) return 84
  if (buffer.includes('"coverLetterOpening"')) return 80
  if (buffer.includes('"keywordsMissing"')) return 76
  if (buffer.includes('"keywordsFound"')) return 73
  if (buffer.includes('"topWeakness"')) return 70
  if (buffer.includes('"topStrength"')) return 68
  if (buffer.includes('"scoreBreakdown"')) return 65
  if (buffer.includes('"atsTips"')) return 62
  if (buffer.includes('"industryDetected"')) return 58
  if (buffer.includes('"projects"')) return 52
  if (buffer.includes('"certifications"')) return 46
  if (buffer.includes('"skills"')) return 40
  if (buffer.includes('"education"')) return 34
  if (buffer.includes('"experience"')) return 24
  if (buffer.includes('"coreCompetencies"')) return 18
  if (buffer.includes('"summary"') && buffer.includes('"rewrittenCV"')) return 14
  if (buffer.includes('"rewrittenCV"')) return 8
  if (buffer.length > 5) return 4
  return 2
}

export default function CVWorkspace() {
  const store = useStore()
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [jdTab, setJdTab] = useState<'text' | 'url'>('text')
  const [urlInput, setUrlInput] = useState('')
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [jsBlockedMsg, setJsBlockedMsg] = useState('')
  const [showAllImprovements, setShowAllImprovements] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmReanalyze, setConfirmReanalyze] = useState(false)
  const [showCustomInstructions, setShowCustomInstructions] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [promptText, setPromptText] = useState('')
  const [activeTab, setActiveTab] = useState<'results' | 'log'>('results')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const streamRef = useRef('')

  async function handleFile(file: File) {
    if (!file) return
    const tempPath = (file as any).path
    if (!tempPath) {
      store.addToast('Could not get file path. Use the Browse button instead.', 'error')
      return
    }
    setParsing(true)
    try {
      const result = await window.api.files.parseCV(tempPath)
      if (result.error) {
        store.addToast(result.error, 'error')
      } else if (result.text) {
        store.setCVText(result.text, file.name)
      }
    } catch (e: any) {
      store.addToast(e?.message || 'Failed to parse file', 'error')
    } finally {
      setParsing(false)
    }
  }

  async function handleOpenFile() {
    setParsing(true)
    try {
      const result = await window.api.files.openCV()
      if (!result) return
      if ('error' in result && result.error) {
        store.addToast(result.error, 'error')
      } else if (result.text) {
        store.setCVText(result.text, result.fileName)
      }
    } catch (e: any) {
      store.addToast(e?.message || 'Failed to open file', 'error')
    } finally {
      setParsing(false)
    }
  }

  async function handleFetchURL() {
    const url = urlInput.trim()
    if (!url) return
    setJsBlockedMsg('')
    setFetchingUrl(true)
    try {
      const result = await window.api.files.fetchURL(url)
      if (result.isJsBlocked) {
        setJsBlockedMsg(result.error || 'This site requires JavaScript or login.')
      } else if (result.success && result.text) {
        store.setJobDescription(result.text)
        setUrlInput('')
        setJdTab('text')
        store.addToast(`Job description loaded (${result.text.length.toLocaleString()} chars)`, 'success')
      } else {
        store.addToast(result.error || 'Could not fetch URL. Copy the text manually.', 'error')
      }
    } catch (e: any) {
      store.addToast(e?.message || 'Failed to fetch URL', 'error')
    } finally {
      setFetchingUrl(false)
    }
  }

  async function handleAnalyze() {
    if (!store.activeConfig) { store.setPage('models'); return }
    if (!store.cvText) return

    if (store.currentCV) {
      if (!confirmReanalyze) { setConfirmReanalyze(true); return }
      setConfirmReanalyze(false)
    }

    // Clear stale results before starting
    store.clearAnalysisResult()
    store.setIsAnalyzing(true)
    store.clearStream()
    store.startAnalysisTiming()
    streamRef.current = ''
    setActiveTab('results')

    let unsubStream: (() => void) | null = null
    let unsubUsage: (() => void) | null = null

    unsubStream = window.api.ai.onStream((chunk) => {
      store.appendStream(chunk)
      streamRef.current += chunk
    })
    unsubUsage = window.api.ai.onUsage((usage) => store.setTokenUsage(usage))

    try {
      const response = await window.api.ai.analyzeCV(
        store.activeConfig, store.cvText, store.jobDescription, store.customInstructions || undefined
      )
      if (!response.success || !response.result) {
        throw new Error(response.error || 'Analysis returned no result')
      }
      store.applyAnalysisResult(response.result)
      store.addActivityLog({
        timestamp: Date.now(),
        type: 'analysis',
        label: `Analysis — score ${response.result.score}/100`,
        content: streamRef.current,
        model: store.activeConfig?.model ?? '',
      })
      store.addToast(`Analysis complete! Score: ${response.result.score}/100`, 'success')
    } catch (e: any) {
      store.addActivityLog({
        timestamp: Date.now(),
        type: 'analysis',
        label: `Analysis — failed`,
        content: streamRef.current || '(no output)',
        model: store.activeConfig?.model ?? '',
      })
      store.addToast(`Analysis failed: ${e.message}`, 'error')
    } finally {
      store.setIsAnalyzing(false)
      unsubStream?.()
      unsubUsage?.()
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const result = store.analysisResult
  const improvements = result?.improvements ?? []
  const visibleImprovements = showAllImprovements ? improvements : improvements.slice(0, 5)
  const streamStatus = getStreamStatus(store.streamBuffer)
  const streamProgress = getStreamProgress(store.streamBuffer)

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Analyze CV</h1>
          <p className="text-slate-400 text-sm">Upload your CV, add a job description or URL, then let AI rewrite it.</p>
        </div>
        <div className="flex items-center gap-2">
          {store.activeConfig ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs">
                <div className="w-2 h-2 bg-violet-400 rounded-full" />
                <span className="text-slate-300 max-w-36 truncate">{store.activeConfig.model}</span>
              </div>
              <button onClick={() => store.setPage('models')} className="text-xs text-slate-500 hover:text-violet-400 transition-colors">
                Change
              </button>
            </>
          ) : (
            <button onClick={() => store.setPage('models')} className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg font-medium transition-colors">
              Choose Model
            </button>
          )}
        </div>
      </div>

      {!store.activeConfig && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-5">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          <span className="text-amber-300 text-sm">No AI model selected.</span>
          <button onClick={() => store.setPage('models')} className="text-amber-300 underline text-sm font-medium ml-auto">
            Choose a model →
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left: Inputs */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          {/* CV Upload */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <FileText size={15} /> Your CV
              </div>
              {store.cvText && (
                <button onClick={() => store.setCVText('', '')} className="text-slate-500 hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            {!store.cvText ? (
              <div
                className={`m-3 border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragging ? 'border-violet-500 bg-violet-500/5' : 'border-slate-700 hover:border-slate-600'}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
                onClick={handleOpenFile}
              >
                {parsing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 size={28} className="text-violet-400 animate-spin mb-3" />
                    <p className="text-slate-400 text-sm font-medium">Parsing your CV...</p>
                  </div>
                ) : (
                  <>
                    <Upload size={28} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium mb-1">Drop your CV or click to browse</p>
                    <p className="text-slate-600 text-xs">PDF, DOCX, RTF, TXT</p>
                  </>
                )}
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                    <FileText size={14} className="text-violet-400" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{store.cvFileName || 'CV loaded'}</div>
                    <div className="text-slate-500 text-xs">{store.cvText.length.toLocaleString()} characters</div>
                  </div>
                  <button onClick={handleOpenFile} className="ml-auto text-xs text-violet-400 hover:text-violet-300 underline">Replace</button>
                </div>
                <textarea
                  value={store.cvText}
                  onChange={(e) => store.setCVText(e.target.value)}
                  className="w-full h-40 bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-300 text-xs font-mono resize-none focus:outline-none focus:border-violet-500"
                />
              </div>
            )}
          </div>

          {/* Job Description */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Briefcase size={15} /> Job Description
                <span className="text-slate-500 font-normal text-xs">(optional but recommended)</span>
              </div>
              {store.jobDescription && (
                <button onClick={() => store.setJobDescription('')} className="text-slate-500 hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex border-b border-slate-800">
              {([['text', FileText, 'Paste Text'], ['url', Link, 'From URL']] as const).map(([id, Icon, label]) => (
                <button
                  key={id}
                  onClick={() => { setJdTab(id); setJsBlockedMsg('') }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${jdTab === id ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>

            {jdTab === 'text' && (
              <div className="p-4">
                <textarea
                  value={store.jobDescription}
                  onChange={(e) => store.setJobDescription(e.target.value)}
                  placeholder="Paste the job description here for targeted CV rewriting and keyword optimization..."
                  className="w-full h-44 bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-300 text-sm resize-none focus:outline-none focus:border-violet-500 placeholder-slate-600 leading-relaxed"
                />
                {store.jobDescription && (
                  <div className="text-xs text-slate-600 mt-1">{store.jobDescription.length.toLocaleString()} characters</div>
                )}
              </div>
            )}

            {jdTab === 'url' && (
              <div className="p-4">
                {jsBlockedMsg ? (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-3">
                    <div className="flex items-start gap-2">
                      <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-blue-300 text-xs font-medium mb-1">Manual copy required</div>
                        <div className="text-blue-400/80 text-xs leading-relaxed mb-2">{jsBlockedMsg}</div>
                        <div className="text-blue-400/80 text-xs space-y-0.5">
                          <div>1. Open the job post in your browser</div>
                          <div>2. Select all text on the page (Cmd+A / Ctrl+A)</div>
                          <div>3. Copy (Cmd+C / Ctrl+C)</div>
                          <div>4. Switch to "Paste Text" tab and paste</div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => { setJdTab('text'); setJsBlockedMsg('') }} className="mt-3 text-xs text-blue-400 underline">
                      → Switch to Paste Text
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs mb-3">
                    Paste a job posting URL. Most company career pages work. LinkedIn/Workday require manual copy.
                  </p>
                )}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFetchURL()}
                      placeholder="https://company.com/jobs/..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <button
                    onClick={handleFetchURL}
                    disabled={!urlInput.trim() || fetchingUrl}
                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm rounded-lg font-medium transition-colors"
                  >
                    {fetchingUrl ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
                    {fetchingUrl ? 'Fetching...' : 'Fetch'}
                  </button>
                </div>
                {store.jobDescription && !jsBlockedMsg && (
                  <div className="mt-3 text-xs text-emerald-400">
                    ✓ Content loaded ({store.jobDescription.length.toLocaleString()} chars) — switch to "Paste Text" to review
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Custom Instructions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowCustomInstructions(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Settings2 size={14} className="text-violet-400" />
                Custom Instructions
                {store.customInstructions && <span className="text-xs text-violet-400 bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.5 rounded">active</span>}
              </div>
              {showCustomInstructions ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
            </button>
            {showCustomInstructions && (
              <div className="px-4 pb-4 border-t border-slate-800">
                <p className="text-xs text-slate-500 mt-3 mb-2">Extra instructions added to the AI prompt. Examples: "Focus on security certifications", "Keep tone formal", "Emphasise leadership over technical skills".</p>
                <textarea
                  value={store.customInstructions}
                  onChange={(e) => store.setCustomInstructions(e.target.value)}
                  placeholder="e.g. Emphasise cloud infrastructure experience over application development..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-300 text-xs resize-none focus:outline-none focus:border-violet-500 placeholder-slate-600"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={async () => {
                      const p = await window.api.ai.getPrompt(store.cvText, store.jobDescription, store.customInstructions || undefined)
                      setPromptText(p)
                      setShowPromptModal(true)
                    }}
                    className="text-xs text-slate-400 hover:text-violet-400 border border-slate-700 hover:border-violet-500/40 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5"
                  >
                    <Eye size={11} /> View Full Prompt
                  </button>
                  {store.customInstructions && (
                    <button onClick={() => store.setCustomInstructions('')} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Clear</button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confirm re-analyze banner */}
          {confirmReanalyze && (
            <div className="flex items-center gap-2 p-3 bg-amber-900/40 border border-amber-700/50 rounded-xl text-sm text-amber-200">
              <span className="flex-1">Re-analyzing will replace your edited CV content and design.</span>
              <button onClick={handleAnalyze} className="px-3 py-1 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-xs font-semibold">Continue</button>
              <button onClick={() => setConfirmReanalyze(false)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs font-semibold">Cancel</button>
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={!store.cvText || store.isAnalyzing || !store.activeConfig}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors shadow-lg shadow-violet-900/30"
          >
            {store.isAnalyzing ? (
              <><Loader2 size={17} className="animate-spin" /> Analyzing with AI...</>
            ) : result ? (
              <><RefreshCw size={17} /> Re-analyze CV</>
            ) : (
              <><Wand2 size={17} /> Analyze & Rewrite CV</>
            )}
          </button>

          {/* Prompt Modal */}
          {showPromptModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowPromptModal(false)}>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-[800px] max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-white font-semibold"><Terminal size={15} className="text-violet-400" /> Full AI Prompt</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(promptText) }} className="text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1.5"><Copy size={11} /> Copy</button>
                    <button onClick={() => setShowPromptModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={promptText}
                  className="flex-1 bg-slate-950 text-slate-300 text-xs font-mono p-5 resize-none focus:outline-none leading-relaxed overflow-y-auto rounded-b-2xl"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Results + AI Log */}
        <div className="flex flex-col gap-4 overflow-y-auto">

          {/* Tab bar — only show when there's something to show */}
          {(store.isAnalyzing || result || store.aiActivityLog.length > 0) && (
            <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
              <button onClick={() => setActiveTab('results')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'results' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <TrendingUp size={12} /> Results
              </button>
              <button onClick={() => setActiveTab('log')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'log' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <Terminal size={12} /> AI Log {store.aiActivityLog.length > 0 && <span className="bg-slate-700 text-slate-300 rounded-full px-1.5">{store.aiActivityLog.length}</span>}
              </button>
            </div>
          )}

          {/* AI Log Panel */}
          {activeTab === 'log' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">{store.aiActivityLog.length} entries — most recent first</div>
                {store.aiActivityLog.length > 0 && (
                  <button onClick={() => store.clearActivityLog()} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors"><Trash2 size={11} /> Clear</button>
                )}
              </div>
              {store.aiActivityLog.length === 0 && (
                <div className="text-center py-12 text-slate-600 text-sm">No AI activity yet. Run an analysis to see the output here.</div>
              )}
              {store.aiActivityLog.map(entry => (
                <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedLogId(expandedLogId === entry.id ? null : entry.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Terminal size={13} className={entry.type === 'analysis' ? 'text-violet-400 shrink-0' : 'text-emerald-400 shrink-0'} />
                      <span className="text-white text-xs font-medium truncate">{entry.label}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-slate-500 text-xs">{entry.model}</span>
                      <span className="text-slate-600 text-xs">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      {expandedLogId === entry.id ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
                    </div>
                  </button>
                  {expandedLogId === entry.id && (
                    <div className="border-t border-slate-800">
                      <div className="flex justify-end px-4 py-2 border-b border-slate-800">
                        <button onClick={() => navigator.clipboard.writeText(entry.content)} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors"><Copy size={11} /> Copy raw</button>
                      </div>
                      <pre className="p-4 text-xs text-slate-400 font-mono leading-relaxed overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap break-all">{entry.content}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'results' && store.isAnalyzing && (
            <AnalysisPanel
              status={streamStatus}
              progress={streamProgress}
              buffer={store.streamBuffer}
              tokenUsage={store.tokenUsage}
              analysisStartTime={store.analysisStartTime}
              model={store.activeConfig?.model ?? ''}
              provider={store.activeConfig?.provider ?? ''}
            />
          )}

          {activeTab === 'results' && result && !store.isAnalyzing && (
            <>
              {/* Integrity warnings — shown prominently when AI dropped sections */}
              {result._integrityWarnings && result._integrityWarnings.length > 0 && (
                <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-amber-300 font-semibold text-sm">Incomplete result — sections may be missing</div>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {result._integrityWarnings.map((w, i) => (
                      <p key={i} className="text-amber-400/80 text-xs leading-relaxed">· {w}</p>
                    ))}
                  </div>
                  <div className="text-xs text-amber-400/60">
                    Tip: Use a larger model or a paid API (Claude Sonnet, GPT-4o) which can handle longer CVs without truncation.
                    You can also manually add the missing sections in the CV Builder → Edit tab.
                  </div>
                  <button
                    onClick={handleAnalyze}
                    className="mt-3 flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/50 bg-amber-500/10 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <RefreshCw size={11} /> Re-analyze
                  </button>
                </div>
              )}

              {/* Score Overview */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <ScoreRing value={result.score} size={52} />
                    <div>
                      <div className="text-white font-bold text-lg">{result.score}/100</div>
                      <div className="text-slate-500 text-xs">Overall Match</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.industryDetected && (
                      <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
                        {result.industryDetected}
                      </span>
                    )}
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold text-sm">{result.atsScore}/100</div>
                      <div className="text-slate-500 text-xs">ATS Score</div>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown Bars */}
                {result.scoreBreakdown && (
                  <div className="space-y-2.5">
                    <ScoreBar label="Quantification" value={result.scoreBreakdown.quantification} hint="Bullets with measurable metrics" />
                    <ScoreBar label="Keywords" value={result.scoreBreakdown.keywords} hint="JD keywords present in CV" />
                    <ScoreBar label="Summary" value={result.scoreBreakdown.summary} hint="Opening statement quality" />
                    <ScoreBar label="Format / ATS" value={result.scoreBreakdown.format} hint="Structure and header compliance" />
                    <ScoreBar label="Completeness" value={result.scoreBreakdown.completeness} hint="All sections present, no gaps" />
                  </div>
                )}
              </div>

              {/* Recruiter View */}
              {(result.topStrength || result.topWeakness) && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <Eye size={13} className="text-violet-400" /> Recruiter View
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-3">{result.summary}</p>
                  {result.topStrength && (
                    <div className="flex gap-2 mb-2 p-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
                      <Zap size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-emerald-300 text-xs font-semibold mb-0.5">Top Strength</div>
                        <div className="text-slate-400 text-xs leading-relaxed">{result.topStrength}</div>
                      </div>
                    </div>
                  )}
                  {result.topWeakness && (
                    <div className="flex gap-2 p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                      <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-amber-300 text-xs font-semibold mb-0.5">Top Fix</div>
                        <div className="text-slate-400 text-xs leading-relaxed">{result.topWeakness}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result.coverLetterOpening && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                      <FileText size={13} className="text-violet-400" /> Cover Letter Opener
                    </h3>
                    <button onClick={() => copyToClipboard(result.coverLetterOpening)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-400 transition-colors">
                      {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                    </button>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed italic">"{result.coverLetterOpening}"</p>
                </div>
              )}

              {result.atsTips?.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <Lightbulb size={13} className="text-amber-400" /> ATS Tips
                  </h3>
                  <div className="space-y-1.5">
                    {result.atsTips.map((tip, i) => (
                      <div key={i} className="text-slate-400 text-xs flex gap-2">
                        <span className="text-amber-400 shrink-0">·</span>{tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keyword Gap Analysis */}
              {((result.keywordsFound?.length ?? 0) > 0 || (result.keywordsMissing?.length ?? 0) > 0 || (result.missingKeywords?.length ?? 0) > 0) && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <Target size={14} className="text-violet-400" /> Keyword Analysis
                  </h3>
                  {result.keywordsFound?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-emerald-400 text-xs font-medium mb-1.5">Found in CV ({result.keywordsFound.length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywordsFound.map((kw) => (
                          <span key={kw} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {((result.keywordsMissing?.length ?? 0) > 0 || (result.missingKeywords?.length ?? 0) > 0) && (
                    <div>
                      <div className="text-amber-400 text-xs font-medium mb-1.5">Missing from CV ({(result.keywordsMissing ?? result.missingKeywords ?? []).length})</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(result.keywordsMissing ?? result.missingKeywords ?? []).map((kw) => (
                          <span key={kw} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bullet Quality Issues */}
              {result.bulletQualityIssues?.length > 0 && (
                <BulletQualityPanel issues={result.bulletQualityIssues} />
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="text-white font-semibold text-sm mb-3">
                  Improvements <span className="text-slate-500 font-normal text-xs">({improvements.length})</span>
                </h3>
                <div className="space-y-2.5">
                  {visibleImprovements.map((imp, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${imp.priority === 'high' ? 'bg-red-400' : imp.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      <div>
                        <div className="text-white text-xs font-medium">{imp.section}</div>
                        <div className="text-slate-500 text-xs">{imp.issue ? `${imp.issue} → ` : ''}{imp.suggestion}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {improvements.length > 5 && (
                  <button onClick={() => setShowAllImprovements(!showAllImprovements)} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 mt-3 transition-colors">
                    {showAllImprovements ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show {improvements.length - 5} more</>}
                  </button>
                )}
              </div>

              {/* Interview Prep */}
              {result.interviewPrep && (result.interviewPrep.likelyQuestions?.length > 0 || result.interviewPrep.technicalTopics?.length > 0) && (
                <InterviewPrepPanel prep={result.interviewPrep} />
              )}

              <button
                onClick={() => store.setPage('builder')}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-violet-900/30"
              >
                Open Visual CV Builder <ChevronRight size={16} />
              </button>
            </>
          )}

          {!result && !store.isAnalyzing && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-900 border border-slate-800 rounded-xl">
              <Wand2 size={40} className="text-slate-700 mb-4" />
              <p className="text-white font-medium text-sm mb-2">Ready to analyze</p>
              <p className="text-slate-500 text-sm leading-relaxed">
                Upload your CV, optionally add a job description, then click Analyze. The AI will score, rewrite, and suggest a visual design.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Analysis Progress Panel ──────────────────────────────────────────────────

function useElapsedTime(startTime: number | null): number {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!startTime) { setElapsed(0); return }
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 500)
    return () => clearInterval(tick)
  }, [startTime])
  return elapsed
}

interface AnalysisPanelProps {
  status: string
  progress: number
  buffer: string
  tokenUsage: { inputTokens: number; outputTokens: number; model: string; provider: string } | null
  analysisStartTime: number | null
  model: string
  provider: string
}

function AnalysisPanel({ status, progress, buffer, tokenUsage, analysisStartTime, model, provider }: AnalysisPanelProps) {
  const elapsed = useElapsedTime(analysisStartTime)
  const outputTokens = tokenUsage?.outputTokens ?? 0
  const inputTokens = tokenUsage?.inputTokens ?? 0
  const tokensPerSec = elapsed > 0 && outputTokens > 0 ? (outputTokens / elapsed).toFixed(1) : '–'

  // Show last 2000 chars of the stream buffer for the live output viewer
  const displayBuffer = buffer.length > 2000 ? '...' + buffer.slice(-2000) : buffer

  // Provider badge color
  const providerColor: Record<string, string> = {
    anthropic: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    openai: 'bg-green-500/20 text-green-300 border-green-500/30',
    google: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    ollama: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  }
  const badgeClass = providerColor[provider] || 'bg-slate-700 text-slate-300 border-slate-600'

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
        <Loader2 size={14} className="animate-spin text-violet-400 shrink-0" />
        <span className="text-white text-sm font-medium flex-1 truncate">{status}</span>
        <span className={`text-xs border px-2 py-0.5 rounded-full shrink-0 ${badgeClass}`}>{provider}</span>
      </div>

      {/* Model name */}
      <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2">
        <span className="text-xs text-slate-500">Model:</span>
        <span className="text-xs text-slate-300 font-mono truncate">{model}</span>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">{status}</span>
          <span className="text-xs text-slate-500">{progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Live output stream */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="px-4 pt-2 pb-1 flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-slate-500">Live output</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-3 font-mono text-xs text-slate-400 leading-relaxed whitespace-pre-wrap break-all">
          {displayBuffer || <span className="text-slate-600 italic">Waiting for model response...</span>}
        </div>
      </div>

      {/* Token stats */}
      <div className="border-t border-slate-800 px-4 py-3 grid grid-cols-4 gap-3">
        <Stat label="Input" value={inputTokens > 0 ? inputTokens.toLocaleString() : '–'} unit="tok" color="text-blue-400" />
        <Stat label="Output" value={outputTokens > 0 ? outputTokens.toLocaleString() : '–'} unit="tok" color="text-violet-400" />
        <Stat label="Speed" value={tokensPerSec} unit="tok/s" color="text-emerald-400" />
        <Stat label="Elapsed" value={String(elapsed)} unit="s" color="text-amber-400" />
      </div>
    </div>
  )
}

function Stat({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-sm font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-slate-600">{label}</div>
      <div className="text-xs text-slate-700">{unit}</div>
    </div>
  )
}

// ─── Score Components ────────────────────────────────────────────────────────

function ScoreRing({ value, size = 52 }: { value: number; size?: number }) {
  const r = (size - 8) / 2
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference - (value / 100) * circumference
  const color = value >= 80 ? '#059669' : value >= 60 ? '#7c3aed' : value >= 40 ? '#d97706' : '#dc2626'
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          stroke={color} className="transition-all duration-1000" />
      </svg>
    </div>
  )
}

function ScoreBar({ label, value, hint }: { label: string; value: number; hint: string }) {
  const barColor = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-violet-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-300 font-medium">{label}</span>
        <span className="text-xs text-slate-500">{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${value}%` }} />
      </div>
      <div className="text-xs text-slate-600 mt-0.5">{hint}</div>
    </div>
  )
}

// ─── Bullet Quality Issues ──────────────────────────────────────────────────

function BulletQualityPanel({ issues }: { issues: Array<{ job: string; bullet: string; issue: string; fix: string }> }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? issues : issues.slice(0, 3)
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
        <Award size={13} className="text-amber-400" /> Bullet Quality Issues
        <span className="text-xs text-slate-500 font-normal">({issues.length})</span>
      </h3>
      <div className="space-y-3">
        {visible.map((iss, i) => (
          <div key={i} className="text-xs border border-slate-800 rounded-lg p-2.5">
            <div className="text-slate-500 mb-1">{iss.job}</div>
            <div className="text-red-400/80 line-through mb-1">{iss.bullet}</div>
            <div className="text-slate-600 text-xs mb-1">{iss.issue}</div>
            <div className="text-emerald-400/80">{iss.fix}</div>
          </div>
        ))}
      </div>
      {issues.length > 3 && (
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 mt-2 transition-colors">
          {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show {issues.length - 3} more</>}
        </button>
      )}
    </div>
  )
}

// ─── Interview Prep ─────────────────────────────────────────────────────────

function InterviewPrepPanel({ prep }: { prep: { likelyQuestions: string[]; starStories: Array<{ question: string; situation: string; metrics: string }>; technicalTopics: string[] } }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/50 transition-colors">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <MessageSquare size={13} className="text-violet-400" /> Interview Prep
        </h3>
        {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          {prep.likelyQuestions?.length > 0 && (
            <div>
              <div className="text-xs text-violet-400 font-semibold mb-2">Likely Questions</div>
              <div className="space-y-1.5">
                {prep.likelyQuestions.map((q, i) => (
                  <div key={i} className="text-slate-400 text-xs flex gap-2">
                    <span className="text-violet-400 shrink-0">{i + 1}.</span>{q}
                  </div>
                ))}
              </div>
            </div>
          )}
          {prep.starStories?.length > 0 && (
            <div>
              <div className="text-xs text-emerald-400 font-semibold mb-2">STAR Stories to Prepare</div>
              <div className="space-y-2">
                {prep.starStories.map((s, i) => (
                  <div key={i} className="text-xs border border-slate-800 rounded-lg p-2.5">
                    <div className="text-white font-medium mb-1">{s.question}</div>
                    <div className="text-slate-400">{s.situation}</div>
                    {s.metrics && <div className="text-emerald-400/70 mt-1">Key metric: {s.metrics}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {prep.technicalTopics?.length > 0 && (
            <div>
              <div className="text-xs text-amber-400 font-semibold mb-2">Technical Topics to Review</div>
              <div className="flex flex-wrap gap-1.5">
                {prep.technicalTopics.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
