import React, { useRef, useState, useEffect } from 'react'
import { Download, Palette, Type, Layout, Check, Loader2, Edit3, Plus, X, ZoomIn, ZoomOut, FileText, AlertTriangle, Shield, MessageCircle, Send } from 'lucide-react'
import { useStore } from '../store/appStore'
import type { TemplateType, DesignSuggestion } from '../types'
import {
  ClassicTemplate, ModernTemplate, MinimalTemplate,
  CreativeTemplate, ExecutiveTemplate,
} from '../components/templates'

const TEMPLATES: { id: TemplateType; label: string; desc: string; ats: 'safe' | 'risky' | 'poor' }[] = [
  { id: 'classic', label: 'Classic', desc: 'Traditional — finance, law, academia', ats: 'safe' },
  { id: 'modern', label: 'Modern', desc: 'Two-column sidebar — tech, startups', ats: 'poor' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean & airy — design, creative', ats: 'risky' },
  { id: 'creative', label: 'Creative', desc: 'Bold header — marketing, media', ats: 'poor' },
  { id: 'executive', label: 'Executive', desc: 'Senior leadership — C-suite, VP', ats: 'risky' },
]

const ATS_BADGE: Record<string, { label: string; color: string; icon: string }> = {
  safe: { label: 'ATS Safe', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25', icon: '✓' },
  risky: { label: 'ATS Risky', color: 'text-amber-400 bg-amber-500/15 border-amber-500/25', icon: '⚠' },
  poor: { label: 'ATS Poor', color: 'text-red-400 bg-red-500/15 border-red-500/25', icon: '✗' },
}

const COLOR_PRESETS = [
  { name: 'Navy Pro',    primary: '#1e3a5f', secondary: '#2d5a8e', accent: '#4a90d9', text: '#1a1a2e', background: '#ffffff' },
  { name: 'Violet Tech', primary: '#6d28d9', secondary: '#7c3aed', accent: '#a78bfa', text: '#1e1b4b', background: '#ffffff' },
  { name: 'Emerald',    primary: '#065f46', secondary: '#047857', accent: '#34d399', text: '#064e3b', background: '#ffffff' },
  { name: 'Slate',      primary: '#334155', secondary: '#475569', accent: '#94a3b8', text: '#1e293b', background: '#ffffff' },
  { name: 'Rose',       primary: '#be123c', secondary: '#e11d48', accent: '#fb7185', text: '#4c0519', background: '#ffffff' },
  { name: 'Amber',      primary: '#92400e', secondary: '#b45309', accent: '#f59e0b', text: '#1c1917', background: '#ffffff' },
  { name: 'Indigo',     primary: '#3730a3', secondary: '#4338ca', accent: '#818cf8', text: '#1e1b4b', background: '#ffffff' },
  { name: 'Teal',       primary: '#0f766e', secondary: '#0d9488', accent: '#2dd4bf', text: '#042f2e', background: '#ffffff' },
]

const HEADING_FONTS = ['Playfair Display', 'Montserrat', 'Raleway', 'Lato', 'Source Serif 4', 'Inter', 'Roboto']
const BODY_FONTS = ['Inter', 'Lato', 'Open Sans', 'Roboto', 'Nunito', 'Source Sans 3']

const TEMPLATE_MAP: Record<TemplateType, React.ComponentType<any>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  creative: CreativeTemplate,
  executive: ExecutiveTemplate,
}

export default function CVBuilder() {
  const store = useStore()
  const previewRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [exportingDocx, setExportingDocx] = useState(false)
  const [exportingAts, setExportingAts] = useState(false)
  const [activePanel, setActivePanel] = useState<'template' | 'colors' | 'fonts' | 'content' | 'chat'>('template')
  const [confirmReset, setConfirmReset] = useState(false)
  const [zoom, setZoom] = useState(0.85)
  const atsPreviewRef = useRef<HTMLDivElement>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  if (!store.currentCV || !store.design) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <Layout size={48} className="text-slate-700 mx-auto mb-4" />
          <h2 className="text-white font-semibold text-lg mb-2">No CV analyzed yet</h2>
          <p className="text-slate-500 text-sm mb-4">Run an AI analysis first to generate your visual CV.</p>
          <button onClick={() => store.setPage('workspace')} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-sm transition-colors">
            Go to Workspace
          </button>
        </div>
      </div>
    )
  }

  const cv = store.currentCV
  const design: DesignSuggestion = { ...store.design, template: store.selectedTemplate }
  const Component = TEMPLATE_MAP[store.selectedTemplate] || ModernTemplate
  const integrityWarnings = store.analysisResult?._integrityWarnings ?? []

  async function handleExportPDF() {
    if (!previewRef.current) return
    setExporting(true)
    try {
      const result = await window.api.export.pdf(previewRef.current.innerHTML, cv.name)
      if (result.success) {
        store.markPdfExported()
        store.addToast(`PDF saved${result.path ? `: ${result.path.split('/').pop()}` : ''}`, 'success')
      } else if (result.error) {
        store.addToast(`Export failed: ${result.error}`, 'error')
      }
    } catch (e: any) {
      store.addToast(`Export failed: ${e?.message || 'Unknown error'}`, 'error')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportDocx() {
    if (!store.currentCV) return
    setExportingDocx(true)
    try {
      const result = await window.api.export.docx(JSON.stringify(store.currentCV), store.currentCV.name)
      if (result.success) {
        store.addToast(`DOCX saved${result.path ? `: ${result.path.split('/').pop()}` : ''}`, 'success')
      } else if (result.error) {
        store.addToast(`DOCX export failed: ${result.error}`, 'error')
      }
    } catch (e: any) {
      store.addToast(`DOCX export failed: ${e?.message || 'Unknown error'}`, 'error')
    } finally {
      setExportingDocx(false)
    }
  }

  async function handleExportAtsPDF() {
    if (!atsPreviewRef.current) return
    setExportingAts(true)
    try {
      const atsName = cv.name ? `${cv.name} ATS` : undefined
      const result = await window.api.export.pdf(atsPreviewRef.current.innerHTML, atsName)
      if (result.success) {
        store.addToast(`ATS-safe PDF saved${result.path ? `: ${result.path.split('/').pop()}` : ''}`, 'success')
      } else if (result.error) {
        store.addToast(`Export failed: ${result.error}`, 'error')
      }
    } catch (e: any) {
      store.addToast(`Export failed: ${e?.message || 'Unknown error'}`, 'error')
    } finally {
      setExportingAts(false)
    }
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left control panel */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-white font-bold text-sm">CV Builder</h2>
          {store.analysisResult && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span className="text-violet-400 font-medium">{store.analysisResult.score}/100</span>
              <span>·</span>
              <span>ATS {store.analysisResult.atsScore}/100</span>
              {store.analysisResult.industryDetected && (
                <><span>·</span><span className="text-slate-400 truncate max-w-24">{store.analysisResult.industryDetected}</span></>
              )}
            </div>
          )}
        </div>

        {/* Panel tabs */}
        <div className="flex border-b border-slate-800">
          {[
            { id: 'template' as const, icon: Layout, label: 'Layout' },
            { id: 'colors' as const, icon: Palette, label: 'Colors' },
            { id: 'fonts' as const, icon: Type, label: 'Fonts' },
            { id: 'content' as const, icon: Edit3, label: 'Edit' },
            { id: 'chat' as const, icon: MessageCircle, label: 'AI' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActivePanel(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${activePanel === id ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className={`flex-1 ${activePanel === 'chat' ? 'overflow-hidden' : 'overflow-y-auto p-4'}`}>
          {activePanel === 'template' && (
            <div className="space-y-2">
              {TEMPLATES.map((t) => {
                const badge = ATS_BADGE[t.ats]
                return (
                  <button
                    key={t.id}
                    onClick={() => store.setSelectedTemplate(t.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${store.selectedTemplate === t.id ? 'border-violet-500 bg-violet-500/10' : 'border-slate-800 hover:border-slate-700 bg-slate-800/50'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">{t.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${badge.color}`}>{badge.icon} {badge.label}</span>
                        {store.selectedTemplate === t.id && <Check size={14} className="text-violet-400" />}
                      </div>
                    </div>
                    <div className="text-slate-500 text-xs">{t.desc}</div>
                  </button>
                )
              })}

              {/* ATS warning for poor/risky templates */}
              {TEMPLATES.find(t => t.id === store.selectedTemplate)?.ats === 'poor' && (
                <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={12} className="text-red-400 mt-0.5 shrink-0" />
                    <div className="text-red-300/80 text-xs leading-relaxed">
                      This template uses multi-column CSS that most ATS systems cannot parse. Use Classic or export an ATS-safe version below.
                    </div>
                  </div>
                </div>
              )}

              {store.analysisResult?.design?.reasoning && (
                <div className="mt-4 p-3 bg-slate-800 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">AI Recommendation</div>
                  <div className="text-xs text-slate-300 leading-relaxed">{store.analysisResult.design.reasoning}</div>
                </div>
              )}
            </div>
          )}

          {activePanel === 'colors' && (
            <div>
              <div className="text-xs text-slate-500 mb-3">Presets</div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {COLOR_PRESETS.map(({ name, ...colorProps }) => (
                  <button
                    key={name}
                    onClick={() => store.updateColors(colorProps)}
                    className={`p-2.5 rounded-xl border transition-all text-left ${design.colors.primary === colorProps.primary ? 'border-violet-500' : 'border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex gap-1.5 mb-1.5">
                      {[colorProps.primary, colorProps.secondary, colorProps.accent].map((c, i) => (
                        <div key={i} className="w-5 h-5 rounded-full" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="text-xs text-slate-400">{name}</div>
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-500 mb-3">Custom</div>
              {(['primary', 'secondary', 'accent', 'text', 'background'] as const).map((key) => (
                <div key={key} className="flex items-center gap-3 mb-2">
                  <input type="color" value={design.colors[key]} onChange={(e) => store.updateColors({ [key]: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 capitalize">{key}</div>
                    <div className="text-xs text-slate-600 font-mono">{design.colors[key]}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activePanel === 'fonts' && (
            <div>
              <div className="mb-4">
                <div className="text-xs text-slate-500 mb-2">Heading Font</div>
                <div className="space-y-1">
                  {HEADING_FONTS.map((font) => (
                    <button key={font} onClick={() => store.updateFonts({ heading: font })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${design.fonts.heading === font ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-slate-400 hover:bg-slate-800 border border-transparent'}`}
                      style={{ fontFamily: font }}>
                      {font} {design.fonts.heading === font && <Check size={12} className="inline ml-2 text-violet-400" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-2">Body Font</div>
                <div className="space-y-1">
                  {BODY_FONTS.map((font) => (
                    <button key={font} onClick={() => store.updateFonts({ body: font })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${design.fonts.body === font ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-slate-400 hover:bg-slate-800 border border-transparent'}`}
                      style={{ fontFamily: font }}>
                      {font} — The quick brown fox {design.fonts.body === font && <Check size={12} className="inline ml-2 text-violet-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activePanel === 'content' && (
            <div>
              {store.analysisResult && (
                <div className="mb-4">
                  {confirmReset ? (
                    <div className="flex items-center gap-2 p-3 bg-amber-900/40 border border-amber-700/50 rounded-lg text-sm text-amber-200">
                      <span className="flex-1">Reset to AI output? Your edits will be lost.</span>
                      <button onClick={() => { store.resetCurrentCV(); setConfirmReset(false) }} className="px-3 py-1 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-xs font-semibold">Reset</button>
                      <button onClick={() => setConfirmReset(false)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs font-semibold">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmReset(true)}
                      className="w-full text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50 bg-amber-500/10 rounded-lg py-2 transition-colors"
                    >
                      ↺ Reset to AI Output
                    </button>
                  )}
                </div>
              )}
              <ContentEditor cv={cv} store={store} />
            </div>
          )}

          {activePanel === 'chat' && (
            <AIChatPanel cv={cv} store={store} messages={chatMessages} setMessages={setChatMessages} />
          )}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button onClick={handleExportPDF} disabled={exporting || exportingDocx || exportingAts}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-900/30">
            {exporting ? <><Loader2 size={15} className="animate-spin" /> Exporting...</> : <><Download size={15} /> Export PDF</>}
          </button>
          <button onClick={handleExportAtsPDF} disabled={exporting || exportingDocx || exportingAts}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 disabled:opacity-50 text-emerald-300 rounded-xl font-semibold text-sm transition-all">
            {exportingAts ? <><Loader2 size={15} className="animate-spin" /> Exporting...</> : <><Shield size={15} /> Export ATS Version</>}
          </button>
          <button onClick={handleExportDocx} disabled={exporting || exportingDocx || exportingAts}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all">
            {exportingDocx ? <><Loader2 size={15} className="animate-spin" /> Exporting...</> : <><FileText size={15} /> Export DOCX</>}
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Integrity warning banner */}
        {integrityWarnings.length > 0 && (
          <div className="mx-4 mt-3 p-3 bg-amber-950/70 border border-amber-500/30 rounded-xl flex items-start gap-2 shrink-0">
            <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-amber-300 text-xs font-semibold mb-0.5">Some sections may be missing</div>
              <div className="text-amber-400/70 text-xs">{integrityWarnings[0]}</div>
            </div>
            <button
              onClick={() => store.setPage('workspace')}
              className="text-xs text-amber-300 hover:text-amber-200 whitespace-nowrap border border-amber-500/30 rounded-lg px-2 py-1 transition-colors shrink-0"
            >
              Re-analyze
            </button>
          </div>
        )}

        {/* Zoom controls */}
        <div className="flex items-center gap-3 px-6 py-2 border-b border-slate-800 shrink-0">
          <button onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))} className="p-1 text-slate-500 hover:text-white transition-colors">
            <ZoomOut size={14} />
          </button>
          <input type="range" min={40} max={150} value={Math.round(zoom * 100)} onChange={(e) => setZoom(Number(e.target.value) / 100)}
            className="w-28 h-1 accent-violet-500" />
          <button onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} className="p-1 text-slate-500 hover:text-white transition-colors">
            <ZoomIn size={14} />
          </button>
          <span className="text-xs text-slate-500 w-10">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(0.85)} className="text-xs text-slate-500 hover:text-violet-400 transition-colors">Fit</button>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-[794px] mx-auto">
            <div style={{ transformOrigin: 'top center', transform: `scale(${zoom})`, width: '100%' }}>
              <div className="shadow-2xl shadow-black/50 rounded-sm overflow-hidden">
                <div ref={previewRef}>
                  <Component cv={cv} design={design} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden ATS-safe preview using Classic template */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px' }}>
          <div ref={atsPreviewRef}>
            <ClassicTemplate cv={cv} design={{ ...design, template: 'classic' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ContentEditor({ cv, store }: { cv: any; store: ReturnType<typeof useStore> }) {
  return (
    <div className="space-y-5">
      <section>
        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Basic Info</div>
        <div className="space-y-2">
          <Field label="Name" value={cv.name} onChange={(v) => store.updateCurrentCV({ name: v })} />
          <Field label="Title" value={cv.title} onChange={(v) => store.updateCurrentCV({ title: v })} />
          <Field label="Email" value={cv.contact?.email} onChange={(v) => store.updateCurrentCV({ contact: { ...cv.contact, email: v } })} />
          <Field label="Phone" value={cv.contact?.phone} onChange={(v) => store.updateCurrentCV({ contact: { ...cv.contact, phone: v } })} />
          <Field label="Location" value={cv.contact?.location} onChange={(v) => store.updateCurrentCV({ contact: { ...cv.contact, location: v } })} />
          <Field label="LinkedIn" value={cv.contact?.linkedin} onChange={(v) => store.updateCurrentCV({ contact: { ...cv.contact, linkedin: v } })} />
          <Field label="GitHub" value={cv.contact?.github} onChange={(v) => store.updateCurrentCV({ contact: { ...cv.contact, github: v } })} />
          <Field label="Website" value={cv.contact?.website} onChange={(v) => store.updateCurrentCV({ contact: { ...cv.contact, website: v } })} />
        </div>
      </section>

      <section>
        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Summary</div>
        <textarea value={cv.summary || ''} onChange={(e) => store.updateCurrentCV({ summary: e.target.value })} rows={4}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-300 text-xs resize-none focus:outline-none focus:border-violet-500" />
      </section>

      {cv.experience?.map((exp: any, ei: number) => (
        <section key={ei} className="border border-slate-700 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Experience Entry</div>
            <button onClick={() => store.removeExperience(ei)} className="text-slate-600 hover:text-red-400 transition-colors" title="Remove entry"><X size={14} /></button>
          </div>
          <div className="space-y-2 mb-3">
            <Field label="Job Title" value={exp.title} onChange={(v) => store.updateExperienceEntry(ei, { title: v })} />
            <Field label="Company" value={exp.company} onChange={(v) => store.updateExperienceEntry(ei, { company: v })} />
            <Field label="Location" value={exp.location} onChange={(v) => store.updateExperienceEntry(ei, { location: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Start Date" value={exp.startDate} onChange={(v) => store.updateExperienceEntry(ei, { startDate: v })} />
              <Field label="End Date" value={exp.endDate} onChange={(v) => store.updateExperienceEntry(ei, { endDate: v })} />
            </div>
          </div>
          <div className="text-xs text-slate-600 mb-1.5">Bullets</div>
          <div className="space-y-1.5">
            {(exp.bullets ?? []).map((bullet: string, bi: number) => (
              <div key={bi} className="flex gap-1.5">
                <span className="text-slate-600 text-xs mt-2 shrink-0">·</span>
                <textarea value={bullet} onChange={(e) => store.updateExperienceBullet(ei, bi, e.target.value)} rows={2}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-300 text-xs resize-none focus:outline-none focus:border-violet-500" />
                <button onClick={() => store.removeExperienceBullet(ei, bi)} className="text-slate-600 hover:text-red-400 mt-1 shrink-0 transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
            <button onClick={() => store.addExperienceBullet(ei)}
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors mt-1">
              <Plus size={11} /> Add bullet
            </button>
          </div>
        </section>
      ))}
      <button onClick={() => store.addExperience()}
        className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
        <Plus size={11} /> Add Experience
      </button>
      {cv.experience?.length > 0 && <div className="border-t border-slate-800 my-2" />}

      <section>
        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Skills</div>
        <SkillsField label="Technical" values={cv.skills?.technical ?? []} onChange={(v) => store.updateSkills('technical', v)} />
        <SkillsField label="Soft Skills" values={cv.skills?.soft ?? []} onChange={(v) => store.updateSkills('soft', v)} />
        <SkillsField label="Languages" values={cv.skills?.languages ?? []} onChange={(v) => store.updateSkills('languages', v)} />
      </section>

      {/* Education */}
      <section>
        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Education</div>
        {cv.education?.map((edu: any, i: number) => (
          <div key={i} className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex justify-end mb-1">
              <button onClick={() => store.removeEducation(i)} className="text-slate-600 hover:text-red-400 transition-colors" title="Remove entry"><X size={14} /></button>
            </div>
            <div className="space-y-2">
              <Field label="Degree" value={edu.degree} onChange={(v) => store.updateEducation(i, { degree: v })} />
              <Field label="Institution" value={edu.institution} onChange={(v) => store.updateEducation(i, { institution: v })} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Location" value={edu.location} onChange={(v) => store.updateEducation(i, { location: v })} />
                <Field label="Year" value={edu.year} onChange={(v) => store.updateEducation(i, { year: v })} />
              </div>
              <Field label="Details" value={edu.details} onChange={(v) => store.updateEducation(i, { details: v })} />
            </div>
          </div>
        ))}
        <button onClick={() => store.addEducation()}
          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
          <Plus size={11} /> Add Education
        </button>
      </section>

      {/* Certifications */}
      <section>
        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Certifications</div>
        <SkillsField
          label=""
          values={cv.certifications ?? []}
          onChange={(v) => store.updateCertifications(v)}
          placeholder="Add certification..."
        />
      </section>

      {/* Projects */}
      <section>
        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Projects</div>
        {cv.projects?.map((p: any, i: number) => (
          <div key={i} className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex justify-end mb-1">
              <button onClick={() => store.removeProject(i)} className="text-slate-600 hover:text-red-400 transition-colors" title="Remove entry"><X size={14} /></button>
            </div>
            <div className="space-y-2">
              <Field label="Name" value={p.name} onChange={(v) => store.updateProject(i, { name: v })} />
              <div>
                <div className="text-xs text-slate-600 mb-0.5">Description</div>
                <textarea
                  value={p.description || ''}
                  onChange={(e) => store.updateProject(i, { description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs resize-none focus:outline-none focus:border-violet-500"
                />
              </div>
              <SkillsField
                label="Technologies"
                values={p.technologies ?? []}
                onChange={(v) => store.updateProject(i, { technologies: v })}
                placeholder="Add technology..."
              />
            </div>
          </div>
        ))}
        <button onClick={() => store.addProject()}
          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
          <Plus size={11} /> Add Project
        </button>
      </section>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-xs text-slate-600 mb-0.5">{label}</div>
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-violet-500" />
    </div>
  )
}

function SkillsField({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [newSkill, setNewSkill] = useState('')
  return (
    <div className="mb-3">
      <div className="text-xs text-slate-600 mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {values.map((s, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
            {s}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && newSkill.trim()) { onChange([...values, newSkill.trim()]); setNewSkill('') } }}
          placeholder={placeholder ?? 'Add skill...'} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-violet-500 placeholder-slate-600" />
        <button onClick={() => { if (newSkill.trim()) { onChange([...values, newSkill.trim()]); setNewSkill('') } }}
          className="p-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors">
          <Plus size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── AI Chat Panel ──────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

function AIChatPanel({ cv, store, messages, setMessages }: { cv: any; store: ReturnType<typeof useStore>; messages: ChatMessage[]; setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>> }) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const msg = input.trim()
    if (!msg || sending || !store.activeConfig) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setSending(true)

    let unsubStream: (() => void) | null = null

    setMessages(prev => [...prev, { role: 'assistant', text: '...' }])

    unsubStream = window.api.ai.onChatStream((chunk) => {
      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last && last.role === 'assistant') {
          const current = last.text === '...' ? '' : last.text
          updated[updated.length - 1] = { ...last, text: current + chunk }
        }
        return updated
      })
    })

    try {
      const result = await window.api.ai.chatEditCV(store.activeConfig, cv, msg)
      if (result.success && result.cv) {
        store.updateCurrentCV(result.cv)
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', text: 'Done — CV updated. Check the preview.' }
          return updated
        })
        store.addToast('CV updated from chat', 'success')
      } else {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', text: `Error: ${result.error || 'Failed to apply changes'}` }
          return updated
        })
      }
    } catch (e: any) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', text: `Error: ${e.message}` }
        return updated
      })
    } finally {
      setSending(false)
      unsubStream?.()
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800">
        <div className="text-xs text-slate-400 leading-relaxed">
          Ask AI to edit your CV. Examples:
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {['Make summary shorter', 'Add Python to skills', 'Rewrite first job bullets'].map(s => (
            <button key={s} onClick={() => { setInput(s); inputRef.current?.focus() }}
              className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 rounded border border-slate-700 hover:border-violet-500/30 transition-colors">
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle size={28} className="text-slate-700 mx-auto mb-2" />
            <p className="text-slate-600 text-xs">Tell the AI what to change in your CV</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              {msg.text === '...' ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-slate-400">Applying changes...</span>
                </div>
              ) : msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-800">
        {!store.activeConfig ? (
          <div className="text-xs text-amber-400 text-center py-2">
            Select an AI model first
          </div>
        ) : (
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="e.g. 'Add Docker to my technical skills'"
              rows={2}
              disabled={sending}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-xs resize-none focus:outline-none focus:border-violet-500 placeholder-slate-600 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="self-end p-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
