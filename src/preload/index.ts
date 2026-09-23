import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  ollama: {
    status: () => ipcRenderer.invoke('ollama:status'),
    start: () => ipcRenderer.invoke('ollama:start'),
    openDownload: () => ipcRenderer.invoke('ollama:openDownload'),
    installLinux: () => ipcRenderer.invoke('ollama:installLinux'),
    listModels: () => ipcRenderer.invoke('ollama:listModels'),
    pullModel: (name: string) => ipcRenderer.invoke('ollama:pullModel', name),
    deleteModel: (name: string) => ipcRenderer.invoke('ollama:deleteModel', name),
    onPullProgress: (
      cb: (data: { modelName: string; status: string; percent: number }) => void
    ) => {
      const handler = (_e: Electron.IpcRendererEvent, data: { modelName: string; status: string; percent: number }) => cb(data)
      ipcRenderer.on('ollama:pullProgress', handler)
      return () => ipcRenderer.removeListener('ollama:pullProgress', handler)
    },
    onInstallProgress: (cb: (msg: string) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, msg: string) => cb(msg)
      ipcRenderer.on('ollama:installProgress', handler)
      return () => ipcRenderer.removeListener('ollama:installProgress', handler)
    },
  },
  files: {
    openCV: () => ipcRenderer.invoke('files:openCV'),
    parseCV: (filePath: string) => ipcRenderer.invoke('files:parseCV', filePath),
    fetchURL: (url: string) => ipcRenderer.invoke('files:fetchURL', url),
  },
  ai: {
    getPrompt: (cvText: string, jobDescription: string, customInstructions?: string) =>
      ipcRenderer.invoke('ai:getPrompt', cvText, jobDescription, customInstructions),
    analyzeCV: (config: unknown, cvText: string, jobDescription: string, customInstructions?: string) =>
      ipcRenderer.invoke('ai:analyzeCV', config, cvText, jobDescription, customInstructions),
    onStream: (cb: (chunk: string) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, chunk: string) => cb(chunk)
      ipcRenderer.on('ai:stream', handler)
      return () => ipcRenderer.removeListener('ai:stream', handler)
    },
    onUsage: (cb: (usage: { inputTokens: number; outputTokens: number; model: string; provider: string }) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, usage: any) => cb(usage)
      ipcRenderer.on('ai:usage', handler)
      return () => ipcRenderer.removeListener('ai:usage', handler)
    },
    generateCoverLetter: (config: unknown, cv: unknown, jobDescription: string, tone: 'professional' | 'conversational') =>
      ipcRenderer.invoke('ai:generateCoverLetter', config, cv, jobDescription, tone),
    onCoverLetterStream: (cb: (chunk: string) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, chunk: string) => cb(chunk)
      ipcRenderer.on('ai:coverLetterStream', handler)
      return () => ipcRenderer.removeListener('ai:coverLetterStream', handler)
    },
    chatEditCV: (config: unknown, cv: unknown, message: string, customInstructions?: string) =>
      ipcRenderer.invoke('ai:chatEditCV', config, cv, message, customInstructions),
    onChatStream: (cb: (chunk: string) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, chunk: string) => cb(chunk)
      ipcRenderer.on('ai:chatStream', handler)
      return () => ipcRenderer.removeListener('ai:chatStream', handler)
    },
  },
  export: {
    pdf: (html: string, candidateName?: string) => ipcRenderer.invoke('export:pdf', html, candidateName),
    docx: (cvJson: string, candidateName?: string) => ipcRenderer.invoke('export:docx', cvJson, candidateName),
  },
  platform: process.platform,
  system: {
    info: () => ipcRenderer.invoke('system:info'),
  },
})
