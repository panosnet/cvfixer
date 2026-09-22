import * as os from 'os'
import { execSync } from 'child_process'

export interface SystemInfo {
  totalRAM: number   // GB
  freeRAM: number    // GB — available right now
  usedRAM: number    // GB
  cpuModel: string
  cpuCores: number   // logical threads (what Ollama actually sees)
  cpuSpeed: number   // MHz
  platform: string
  hasAppleSilicon: boolean
}

export function getSystemInfo(): SystemInfo {
  const cpus = os.cpus()
  const totalRAM = os.totalmem() / 1024 / 1024 / 1024

  // os.freemem() on macOS only reports truly free pages, missing inactive/compressed.
  // We supplement with vm_stat on macOS for a better estimate.
  let freeRAM = os.freemem() / 1024 / 1024 / 1024

  if (process.platform === 'darwin') {
    try {
      const vmstat = execSync('vm_stat', { timeout: 1000, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] })
      const pageSizeMatch = vmstat.match(/page size of (\d+) bytes/)
      const pageSize = pageSizeMatch ? parseInt(pageSizeMatch[1]) : (process.arch === 'arm64' ? 16384 : 4096)
      const getPages = (label: string) => {
        const m = vmstat.match(new RegExp(`${label}:\\s+(\\d+)`))
        return m ? parseInt(m[1]) : 0
      }
      const free = getPages('Pages free')
      const inactive = getPages('Pages inactive')
      const purgeable = getPages('Pages purgeable')
      // Available = free + inactive (reclaimable) + purgeable
      freeRAM = ((free + inactive + purgeable) * pageSize) / 1024 / 1024 / 1024
    } catch {}
  }

  const cpuModel = cpus[0]?.model ?? 'Unknown CPU'
  const hasAppleSilicon = process.platform === 'darwin' && process.arch === 'arm64'

  return {
    totalRAM: Math.round(totalRAM * 10) / 10,
    freeRAM: Math.round(freeRAM * 10) / 10,
    usedRAM: Math.round((totalRAM - freeRAM) * 10) / 10,
    cpuModel: cleanCpuModel(cpuModel),
    cpuCores: cpus.length,
    cpuSpeed: cpus[0]?.speed ?? 0,
    platform: process.platform,
    hasAppleSilicon,
  }
}

function cleanCpuModel(raw: string): string {
  // Remove excessive whitespace and vendor marketing noise
  return raw
    .replace(/\(R\)|\(TM\)|CPU|Processor|@.*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Recommend a model tier based on available RAM
export function getModelTier(freeRAMGB: number): 'xl' | 'large' | 'medium' | 'small' | 'tiny' {
  if (freeRAMGB >= 35) return 'xl'      // 70B+ models
  if (freeRAMGB >= 18) return 'large'   // 27-32B models
  if (freeRAMGB >= 10) return 'medium'  // 13-14B models
  if (freeRAMGB >= 6)  return 'small'   // 7-8B models
  return 'tiny'                          // mini / phi / 3B
}

export const TIER_DESCRIPTIONS: Record<ReturnType<typeof getModelTier>, {
  label: string; models: string[]; note: string; color: string
}> = {
  xl:     { label: '70B+ class', models: ['llama3.1:70b', 'qwen2.5:72b'],        note: 'Best quality — large models fit comfortably',           color: 'emerald' },
  large:  { label: '27-32B class', models: ['qwen2.5:32b', 'mistral-large'],     note: 'Excellent quality — powerful models with room to spare', color: 'blue'    },
  medium: { label: '13-14B class', models: ['qwen2.5:14b', 'llama3.1:8b'],       note: 'Great balance of speed and quality',                    color: 'violet'  },
  small:  { label: '7-8B class', models: ['llama3.1:8b', 'mistral:7b'],           note: 'Good speed — decent quality for most CVs',             color: 'amber'   },
  tiny:   { label: 'Mini / 3B class', models: ['phi3.5:mini', 'llama3.2:3b'],    note: 'Fast but limited — use a paid API for best results',    color: 'red'     },
}
