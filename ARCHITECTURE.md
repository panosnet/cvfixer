# CV Fixer — Architecture & File Map

> Complete reference of every file in the codebase, what it does, what it exports, and how the pieces connect.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Electron App                             │
│                                                                 │
│  ┌──────────────┐   IPC Bridge   ┌────────────────────────────┐ │
│  │  Main Process │◄─────────────►│     Renderer Process       │ │
│  │  (Node.js)    │  (preload.ts) │     (React + Tailwind)     │ │
│  │               │               │                            │ │
│  │  ┌──────────┐ │               │  ┌────────┐  ┌──────────┐ │ │
│  │  │ Services │ │               │  │ Pages  │  │  Store   │ │ │
│  │  │ aiService│ │               │  │        │  │ appStore │ │ │
│  │  │ docxExp  │ │               │  │ Welcome│  │          │ │ │
│  │  │ fileParse│ │               │  │ Models │  └──────────┘ │ │
│  │  │ ollamaSvc│ │               │  │ Work-  │               │ │
│  │  │ sysInfo  │ │               │  │ space  │  ┌──────────┐ │ │
│  │  │ urlFetch │ │               │  │ Builder│  │Templates │ │ │
│  │  └──────────┘ │               │  └────────┘  │ 5 layouts│ │ │
│  │               │               │              └──────────┘ │ │
│  │  ┌──────────┐ │               │                            │ │
│  │  │   IPC    │ │               │                            │ │
│  │  │ Handlers │ │               │                            │ │
│  │  └──────────┘ │               │                            │ │
│  └──────────────┘               └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow:** User action → React page → `window.api.*` (preload bridge) → IPC handler → Service → Result flows back the same path.

**State:** Module-level singleton store (`appStore.ts`) with `updateTransient` (no persist), `update` (immediate persist), and `updateDebounced` (500ms debounced persist) tiers. Persisted to `localStorage` with separate keys for session, analysis results, edited CV, and design.

---

## Root Config Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, electron-builder config. Build targets: macOS DMG (arm64+x64), Windows NSIS, Linux AppImage |
| `electron-vite.config.ts` | Vite config for main/preload/renderer. Main uses `externals` for Node built-ins |
| `tsconfig.json` | Base TypeScript config |
| `tsconfig.node.json` | Main + preload process config (ESNext modules, Node types) |
| `tsconfig.web.json` | Renderer config (DOM types, react-jsx transform) |
| `tailwind.config.js` | Tailwind scoped to `src/renderer/**/*.tsx` |
| `postcss.config.js` | PostCSS with Tailwind and autoprefixer |
| `.gitignore` | Excludes `node_modules/`, `out/`, `dist/`, env files |

---

## Main Process (`src/main/`)

### `index.ts` (58 lines)
App lifecycle and window creation.
- Creates `BrowserWindow` with `contextIsolation: true`, `hiddenInset` title bar on macOS
- Registers all IPC handlers on `app.whenReady()`
- Loads dev server URL or built HTML based on environment
- Handles `window-all-closed` (quit on non-macOS) and `activate` (recreate window on macOS)
- Process-level `uncaughtException` handler silently swallows EPIPE errors from `execSync`

### `ipc/ai.ts` (50 lines)
IPC handlers for AI operations.
- `ai:analyzeCV(config, cvText, jobDescription)` → calls `analyzeCV()`, returns `{ success, result, error }`
- `ai:chatEditCV(config, currentCV, instruction)` → calls `chatEditCV()`, returns `{ success, cv, error }`
- `ai:generateCoverLetter(config, cvText, jobDescription)` → calls `generateCoverLetter()`
- Forwards streaming chunks and usage events to renderer via `webContents.send()`

### `ipc/export.ts` (154 lines)
PDF and DOCX export handlers.
- `export:pdf(htmlContent, candidateName?)` → Opens save dialog, creates hidden `BrowserWindow`, loads HTML with Google Fonts, waits for `document.fonts.ready` + 500ms, calls `printToPDF` with A4/zero margins. Extracts background color from template HTML (handles both hex and `rgb()` formats). Cleans up temp files in `finally`.
- `export:docx(cvJson, candidateName?)` → Opens save dialog, parses JSON, calls `exportToDocx()`, writes buffer.
- `PRINT_CSS` constant handles page breaks, color preservation, min-height override, orphan/widow control.
- `ALL_FONTS` loads Inter, Playfair Display, Montserrat, Lato, Source Serif 4, Raleway, Roboto, Open Sans, Nunito, Source Sans 3.

### `ipc/files.ts` (57 lines)
File and URL handlers.
- `files:openCV()` → Native file picker (PDF/DOCX/RTF/TXT), parses with `parseFile()`, returns `{ text, fileName }`
- `files:parseCV(filePath)` → Validates file extension and size (50MB max), parses file. Used for drag-and-drop.
- `files:fetchURL(url)` → Calls `fetchTextFromURL()`, returns extracted job description text

### `ipc/ollama.ts` (77 lines)
Ollama management handlers.
- `ollama:status()` → Checks if Ollama is running (GET `/api/tags`), returns model list and RAM info
- `ollama:models()` → Lists installed models with sizes
- `ollama:pull(modelName)` → Streams model download progress to renderer
- `ollama:delete(modelName)` → Deletes a model
- `ollama:start()` → Spawns `ollama serve` process

### `ipc/system.ts` (12 lines)
- `system:info()` → Returns `getSystemInfo()` result (RAM, CPU, platform)

---

### `services/aiService.ts` (831 lines)
**The core of the app.** Contains the AI prompt, all 4 provider implementations, JSON parsing, and result validation.

**Exports:**
- `analyzeCV(config, cvText, jobDescription, onStream, onUsage)` → Full CV analysis
- `chatEditCV(config, currentCV, instruction, onStream)` → AI-powered CV editing via chat
- `generateCoverLetter(config, cvText, jobDescription, onStream, onUsage)` → Cover letter generation
- `AIConfig`, `TokenUsage`, `CVAnalysisResult` interfaces

**Key internal functions:**
- `buildPrompt(cvText, jobDescription)` — Constructs the ~2000-token system prompt with:
  - Position preservation instructions (extracts date-anchored job entries from CV)
  - Achievement enrichment rules (identify top 3-5 achievements, lead bullets with impact)
  - Bullet quality rules (quantify, active voice, no filler)
  - Full JSON schema for the expected output
  - Design schema (template, colors, fonts)
  - Section preservation mandate (certifications, achievements, publications, volunteer)
- `validateResult(raw, originalCvText)` — Enforces defaults for every field, validates color hex codes (normalizes 3→6 digit, enforces dark text/light background via luminance check), runs integrity check
- `checkIntegrity(cv, originalText)` — Compares output job count against detected positions in original CV, warns if jobs appear missing
- `parseJSON(raw)` — Extracts JSON from raw AI output (strips markdown fences, finds `{...}` boundaries, handles nested braces)
- `normalizeHex(hex)` — Safely converts any hex format (3/6/8 digit) to 6-digit
- `hexLuminance(hex)` — Calculates perceived brightness for contrast validation
- `extractPositionHints(cvText)` — Finds date-pattern lines to estimate job count

**Provider implementations (all support streaming):**
- `runAnthropic(config, prompt, onStream, onUsage)` — Anthropic Messages API with streaming. API key validated upfront.
- `runOpenAI(config, prompt, onStream, onUsage)` — OpenAI Chat Completions with streaming. Handles o1/o3 models (`max_completion_tokens` vs `max_tokens`). API key validated upfront.
- `runGoogle(config, prompt, onStream, onUsage)` — Google Generative AI with streaming. API key validated upfront.
- `runOllama(config, prompt, onStream, onUsage)` — Ollama REST API (`/api/chat`) with NDJSON streaming. No API key needed.

### `services/docxExporter.ts` (243 lines)
Generates Word documents using the `docx` npm package (loaded via `createRequire` to bypass Rollup).

**Exports:** `exportToDocx(cv)` → `Promise<Buffer>`

**Sections rendered:** Name (centered heading), title, contact line (with clickable hyperlinks for LinkedIn/GitHub/website), summary, core competencies (dot-separated), experience (title + company + date + bullets), education (degree + institution + year + details), skills (technical/soft/languages), certifications, projects (with clickable URL + startDate), achievements, publications, volunteer.

### `services/fileParser.ts` (64 lines)
Parses uploaded CV files into plain text.
- `parseFile(filePath)` — Routes by extension to:
  - `.pdf` → `pdf-parse` library (loaded via `createRequire`)
  - `.docx` → `mammoth` library (loaded via `createRequire`), extracts raw text
  - `.rtf` → Regex-based RTF tag stripping (latin1 encoding)
  - `.txt` → Direct `fs.readFile` (utf-8)

### `services/ollamaService.ts` (128 lines)
Ollama lifecycle management.
- `checkOllama()` → GET `/api/tags`, returns `{ running, installed, models[], ram }`
- `listModels()` → Returns model names, sizes, parameter counts, quantization
- `pullModel(name, onProgress)` → POST `/api/pull` with streaming progress
- `deleteModel(name)` → DELETE `/api/delete`
- `startOllama()` → Spawns `ollama serve` with detached process

### `services/systemInfo.ts` (80 lines)
System hardware detection.
- `getSystemInfo()` → Returns `{ totalRAM, freeRAM, usedRAM, cpuModel, cpuCores, cpuSpeed, platform, hasAppleSilicon }`
- On macOS: parses `vm_stat` output for accurate free RAM (free + inactive + purgeable pages), correctly handles both Apple Silicon (16KB pages) and Intel (4KB pages)
- `getModelTier(freeRAMGB)` → Maps available RAM to recommended model size tier (tiny/small/medium/large/xl)
- `TIER_DESCRIPTIONS` — Human-readable labels and model suggestions per tier

### `services/urlFetcher.ts` (153 lines)
Fetches job descriptions from URLs.
- `fetchTextFromURL(url)` → Validates URL, blocks private/internal IPs (localhost, 127.x, 10.x, 192.168.x, 172.16-31.x, 169.254.x, IPv6 private), detects JS-only sites (LinkedIn, Greenhouse, Lever, etc.), fetches HTML, extracts text, validates it looks like a job posting.
- `isPrivateHost(host)` — SSRF protection covering RFC 1918, link-local, and IPv6 ranges
- `extractText(html)` — Strips scripts/styles/nav/header/footer, converts block elements to newlines, decodes HTML entities
- Redirect validation via `beforeRedirect` to prevent SSRF bypass

---

## Preload (`src/preload/`)

### `index.ts` (66 lines)
Context-isolated bridge between main and renderer. Exposes `window.api` with namespaced methods:

| Namespace | Methods |
|-----------|---------|
| `api.ollama` | `status`, `models`, `pull`, `onPullProgress`, `delete`, `start` |
| `api.files` | `openCV`, `parseCV`, `fetchURL` |
| `api.ai` | `analyzeCV`, `onStream`, `onUsage`, `chatEditCV`, `onChatStream`, `generateCoverLetter`, `onCoverLetterStream` |
| `api.export` | `pdf`, `docx` |
| `api.system` | `info` |
| `api.platform` | `string` (process.platform) |

Stream listeners (`onStream`, `onChatStream`, etc.) return an unsubscribe function.

---

## Renderer (`src/renderer/`)

### `index.html`
Entry HTML. Loads Google Fonts (Inter, Playfair Display, Montserrat, Lato, Source Serif 4, Raleway, Roboto, Open Sans, Nunito, Source Sans 3). Sets dark background (`#0f172a`).

### `src/main.tsx` (10 lines)
React entry point. Renders `<App />` into `#root`.

### `src/index.css`
Tailwind directives (`@tailwind base/components/utilities`), custom scrollbar styles, global dark theme.

### `src/App.tsx` (78 lines)
Root component. Simple page router based on `store.page` state. Wraps each page in `<ErrorBoundary>` keyed by page name. Includes `<ToastContainer>` overlay.

**Pages:** `welcome` → `Welcome`, `models` → `ModelManager`, `apikeys` → `ApiKeys`, `workspace` → `CVWorkspace`, `builder` → `CVBuilder`

---

### `components/Layout.tsx` (21 lines)
Shell layout with `<Sidebar>` on the left and content area on the right.

### `components/Sidebar.tsx` (86 lines)
Navigation sidebar. Shows: logo, nav links (Workspace, Builder, Models, API Keys), active page highlighting, quick-status indicators (selected model, Ollama status). "New Session" button clears all state.

### `components/Toast.tsx` (39 lines)
Toast notification system. Renders `store.toasts` as stacked alerts in bottom-right corner. Color-coded by type (success/error/info). Auto-dismissed by the store (4s info, 6s error).

### `components/ErrorBoundary.tsx` (45 lines)
React class component error boundary. Catches render crashes, shows error message with "Reload App" button.

---

### `components/templates/` — CV Templates

All 5 templates receive `{ cv: RewrittenCV, design: DesignSuggestion }` props. All import `hexToRgba` from `./utils`.

**Every template renders all sections:** name, title, contact info (with clickable links for LinkedIn/GitHub/website), summary, core competencies, experience (with bullets), education, skills (technical/soft/languages), certifications, achievements, publications, volunteer, projects (with clickable URL and startDate).

| Template | Lines | Layout | Best For |
|----------|-------|--------|----------|
| `ClassicTemplate.tsx` | 150 | Single column, horizontal rules | Finance, law, academia |
| `ModernTemplate.tsx` | 182 | Two-column (sidebar + main) | Tech, startups |
| `MinimalTemplate.tsx` | 156 | Single column, generous whitespace | Design, creative roles |
| `CreativeTemplate.tsx` | 180 | Bold header banner + two columns | Marketing, media |
| `ExecutiveTemplate.tsx` | 166 | Two-column (narrow left + wide right) | C-suite, VP, senior leadership |

**Supporting files:**
- `types.ts` (6 lines) — `TemplateProps` interface
- `utils.ts` (17 lines) — `hexToRgba(hex, alpha)` with null guard, handles 3-digit and 6-digit hex
- `index.ts` (5 lines) — Re-exports all 5 templates

---

### `pages/Welcome.tsx` (143 lines)
Landing page. Shows app title, feature highlights, and "Get Started" button that navigates to Model Manager.

### `pages/ModelManager.tsx` (852 lines)
Model selection and Ollama management. The largest page.
- **Hardware dashboard** — shows CPU, RAM (total/free/used), Apple Silicon detection
- **Model tier recommendation** — based on available RAM, suggests which model sizes will run
- **Ollama section** — install status, start/stop, pull/delete models with progress bars
- **Paid API section** — cards for Anthropic (Claude), OpenAI (GPT), Google (Gemini) with model dropdowns
- **Active model indicator** — shows currently selected model/provider

### `pages/ApiKeys.tsx` (191 lines)
API key management page. Input fields for Anthropic, OpenAI, and Google API keys. Keys stored in localStorage (separate from session data). Shows masked key preview and validation status.

### `pages/CVWorkspace.tsx` (835 lines)
The main analysis workflow page.
- **CV input** — drag-and-drop zone, file picker button, or manual text paste
- **Job description input** — text tab or URL tab (with auto-fetch and JS-blocked site detection)
- **Analyze button** — with inline re-analysis confirmation when a CV already exists
- **Streaming progress** — real-time status bar showing which section the AI is currently writing
- **Results panels** (shown after analysis):
  - Score ring (overall + ATS) with animated SVG
  - Score breakdown bars (quantification, keywords, summary, format, completeness)
  - Top strength and weakness highlights
  - Token usage and timing stats
  - Keyword analysis (found vs missing, with copy buttons)
  - Improvement suggestions (prioritized: high/medium/low)
  - Bullet quality issues (original bullet → problem → suggested fix)
  - Interview prep (likely questions, STAR stories, technical topics)
  - Cover letter opening paragraph
  - "Go to Builder" CTA button

### `pages/CVBuilder.tsx` (700 lines)
Visual CV builder with live preview. Contains 4 sub-components:

**Main component (`CVBuilder`):**
- Left panel with 5 tabs: Layout, Colors, Fonts, Edit, AI
- Center preview with zoom controls (40%–150%)
- Hidden ATS-safe preview (Classic template, off-screen) for ATS PDF export
- Export buttons: PDF, ATS-safe PDF, DOCX — all with try-catch-finally
- Chat messages state lifted here (persists across tab switches)

**`ContentEditor` sub-component:**
- Editable fields for all CV sections: basic info, summary, experience entries (with add/remove + bullet management), skills (chip-based with add/remove), education (with add/remove), certifications, projects (with add/remove)
- Reset to AI output button with inline confirmation

**`AIChatPanel` sub-component:**
- Chat interface for natural language CV editing
- Suggestion chips ("Make summary shorter", "Add Python to skills", etc.)
- Live streaming text display during AI response
- Messages persist when switching tabs (state owned by parent)

**`Field` and `SkillsField` sub-components:**
- Reusable form inputs for text fields and tag-style skill lists

---

### `store/appStore.ts` (408 lines)
Module-level singleton reactive store. No external state library — uses a `Set<() => void>` listener pattern with a `useStore()` hook that forces re-render on state change.

**State shape (`AppState`):** page, ollamaRunning, ollamaInstalled, systemRAM, freeRAM, cpuModel, cpuCores, hasAppleSilicon, platform, activeConfig, apiKeys, cvText, cvFileName, jobDescription, analysisResult, isAnalyzing, streamBuffer, currentCV, design, selectedTemplate, templateOverridden, pdfExported, toasts, tokenUsage, analysisStartTime

**Persistence (localStorage):**
- `cvfixer_session` — activeConfig, cvText, cvFileName, jobDescription, selectedTemplate, templateOverridden, pdfExported
- `cvfixer_result` — full analysis result (capped at 500KB)
- `cvfixer_editedCV` — user-edited CV (separate from original analysis, survives reload)
- `cvfixer_editedDesign` — user-edited design (separate from original analysis)
- `cvfixer_keys` — API keys (Anthropic, OpenAI, Google)

**Update tiers:**
- `updateTransient(partial)` — notify listeners only, no persistence (streaming, loading states)
- `update(partial)` — immediate localStorage save + notify
- `updateDebounced(partial)` — 500ms debounced save + notify (keystroke-level edits)

**Key actions:** `applyAnalysisResult`, `updateCurrentCV`, `updateExperienceBullet`, `addExperienceBullet`, `removeExperienceBullet`, `updateExperienceEntry`, `updateEducation`, `updateProject`, `updateSkills`, `updateColors`, `updateFonts`, `setSelectedTemplate`, `resetCurrentCV`, `addExperience`, `removeExperience`, `addEducation`, `removeEducation`, `addProject`, `removeProject`, `addToast`, `removeToast`, `clearSession`

---

### `types/index.ts` (148 lines)
Shared TypeScript interfaces for the renderer.
- `ModelConfig` — provider, model name, parameter size, RAM requirement, quantization, API key
- `OllamaModel` — name, size, parameter size, quantization, family
- `CVAnalysisResult` — full analysis output (score, ATS score, breakdown, keywords, improvements, interview prep, rewritten CV, design)
- `RewrittenCV` — name, title, contact, summary, coreCompetencies, experience[], education[], skills, certifications, achievements, publications, volunteer, projects[]
- `DesignSuggestion` — template, reasoning, colors (primary/secondary/accent/text/background), fonts (heading/body)
- `TemplateType` — `'classic' | 'modern' | 'minimal' | 'creative' | 'executive'`
- `Toast` — id, message, type

### `types/electron.d.ts` (81 lines)
Type declarations for `window.api` — mirrors the preload bridge exactly. Declares all IPC method signatures for TypeScript autocompletion in the renderer.

---

## Data Flow Examples

### CV Analysis Flow
```
User clicks "Analyze"
  → CVWorkspace.handleAnalyze()
  → window.api.ai.analyzeCV(config, cvText, jobDescription)
  → preload: ipcRenderer.invoke('ai:analyzeCV', ...)
  → ipc/ai.ts handler
  → aiService.analyzeCV(config, cvText, jobDescription, onStream, onUsage)
  → buildPrompt() constructs the system prompt
  → runAnthropic/runOpenAI/runGoogle/runOllama() streams response
  → parseJSON() extracts JSON from AI output
  → validateResult() enforces defaults, validates colors, checks integrity
  → Result flows back through IPC to renderer
  → store.applyAnalysisResult() updates state
  → CVWorkspace re-renders with scores, keywords, improvements
```

### PDF Export Flow
```
User clicks "Export PDF"
  → CVBuilder.handleExportPDF()
  → Gets innerHTML from previewRef (rendered template)
  → window.api.export.pdf(innerHTML, candidateName)
  → preload: ipcRenderer.invoke('export:pdf', ...)
  → ipc/export.ts handler
  → Extracts background color from HTML (handles rgb() and hex)
  → Creates temp HTML file with Google Fonts + PRINT_CSS
  → Opens hidden BrowserWindow, loads HTML
  → Waits for fonts to load (document.fonts.ready + 500ms)
  → win.webContents.printToPDF() with A4/zero margins
  → Writes PDF buffer to user-chosen save path
  → Cleans up temp files and hidden window
```

---

## Line Count Summary

| Layer | Files | Lines |
|-------|-------|-------|
| Main process | 12 | 1,854 |
| Preload | 1 | 66 |
| Renderer | 24 | 4,552 |
| **Total** | **37** | **6,472** |
