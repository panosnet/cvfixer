import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import axios from 'axios'
import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import { shell } from 'electron'

const execAsync = promisify(exec)
const OLLAMA_BASE = 'http://localhost:11434'

export interface OllamaModel {
  name: string
  size: number
  modified_at: string
}

export async function isOllamaRunning(): Promise<boolean> {
  try {
    await axios.get(`${OLLAMA_BASE}/api/tags`, { timeout: 2000 })
    return true
  } catch {
    return false
  }
}

export async function isOllamaInstalled(): Promise<boolean> {
  try {
    if (process.platform === 'win32') {
      const localAppData = process.env.LOCALAPPDATA || ''
      return fs.existsSync(path.join(localAppData, 'Programs', 'Ollama', 'ollama.exe'))
    }
    await execAsync('which ollama')
    return true
  } catch {
    return false
  }
}

export async function startOllama(): Promise<void> {
  if (process.platform === 'darwin') {
    await execAsync('open -a Ollama').catch(() => {})
  } else if (process.platform === 'linux') {
    spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' }).unref()
  } else if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || ''
    const ollamaPath = path.join(localAppData, 'Programs', 'Ollama', 'ollama.exe')
    spawn(ollamaPath, [], { detached: true, stdio: 'ignore' }).unref()
  }

  // Wait up to 10 seconds for it to start
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500))
    if (await isOllamaRunning()) return
  }
  throw new Error('Ollama did not start in time')
}

export async function getInstallCommand(): Promise<string> {
  const platform = process.platform
  if (platform === 'linux') return 'curl -fsSL https://ollama.com/install.sh | sh'
  if (platform === 'darwin') return 'brew install ollama  # or download from ollama.com'
  return 'Download from ollama.com/download'
}

export function openOllamaDownloadPage(): void {
  shell.openExternal('https://ollama.com/download')
}

export async function installOllamaLinux(
  onProgress: (msg: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    onProgress('Downloading Ollama installer...')
    const proc = spawn('sh', ['-c', 'curl -fsSL https://ollama.com/install.sh | sh'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    proc.stdout.on('data', (d) => onProgress(d.toString().trim()))
    proc.stderr.on('data', (d) => onProgress(d.toString().trim()))
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Install failed with code ${code}`))
    })
  })
}

export async function listInstalledModels(): Promise<OllamaModel[]> {
  const resp = await axios.get(`${OLLAMA_BASE}/api/tags`)
  return resp.data.models || []
}

function validateModelName(name: string): void {
  if (!name || !/^[a-zA-Z0-9._:/-]{1,200}$/.test(name)) {
    throw new Error(`Invalid model name: ${name}`)
  }
}

export async function pullModel(
  modelName: string,
  onProgress: (progress: { status: string; percent: number }) => void
): Promise<void> {
  validateModelName(modelName)
  const response = await fetch(`${OLLAMA_BASE}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName, stream: true }),
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    throw new Error(`Ollama pull failed (${response.status}): ${errBody.slice(0, 200)}`)
  }
  if (!response.body) throw new Error('No response body from Ollama')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const data = JSON.parse(line)
        const percent =
          data.total && data.completed ? Math.round((data.completed / data.total) * 100) : 0
        onProgress({ status: data.status || '', percent })
      } catch {}
    }
  }
}

export async function deleteModel(modelName: string): Promise<void> {
  validateModelName(modelName)
  await axios.delete(`${OLLAMA_BASE}/api/delete`, {
    data: { name: modelName },
  })
}

export function getSystemRAM(): number {
  return Math.round(os.totalmem() / 1024 / 1024 / 1024)
}
