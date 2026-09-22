import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { createRequire } from 'module'

const readFile = promisify(fs.readFile)

// Use createRequire so Rollup never tries to bundle these CJS packages.
// Dynamic import() causes Rollup to analyze them and trip over their
// internal dynamic requires (e.g. pdf-parse's pdfjs loader).
const _require = createRequire(import.meta.url)

export async function parseFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase()

  switch (ext) {
    case '.txt':
      return (await readFile(filePath, 'utf-8')).toString()

    case '.pdf':
      return parsePDF(filePath)

    case '.docx':
      return parseDOCX(filePath)

    case '.rtf':
      return parseRTF(filePath)

    case '.doc':
      throw new Error(
        'Legacy .doc format is not supported. Please open the file in Word and save it as .docx, then try again.'
      )

    default:
      throw new Error(`Unsupported file format: ${ext}. Supported formats: PDF, DOCX, RTF, TXT.`)
  }
}

async function parsePDF(filePath: string): Promise<string> {
  const pdfParse = _require('pdf-parse')
  const buffer = await readFile(filePath)
  const data = await pdfParse(buffer)
  if (!data.text?.trim()) throw new Error('PDF appears to be empty or image-only (no extractable text).')
  return data.text
}

async function parseDOCX(filePath: string): Promise<string> {
  const mammoth = _require('mammoth')
  const result = await mammoth.extractRawText({ path: filePath })
  if (!result.value?.trim()) throw new Error('DOCX file appears to be empty.')
  return result.value
}

async function parseRTF(filePath: string): Promise<string> {
  const content = (await readFile(filePath, 'latin1')).toString()
  return content
    .replace(/\{\\[^{}]*\}/g, '')
    .replace(/\\[a-z]+\-?\d* ?/g, ' ')
    .replace(/\\\n/g, '\n')
    .replace(/[{}\\]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
