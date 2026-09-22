import axios from 'axios'

// Sites that use client-side JS rendering and won't work with a plain HTTP GET
const JS_ONLY_SITES = [
  'linkedin.com',
  'greenhouse.io',
  'lever.co',
  'workday.com',
  'myworkdayjobs.com',
  'taleo.net',
  'icims.com',
  'successfactors.com',
  'smartrecruiters.com',
  'jobvite.com',
]

// Content-types we can't extract text from
const BINARY_TYPES = ['application/pdf', 'image/', 'video/', 'audio/', 'application/octet']

// Keywords that indicate a real job description was fetched
const JOB_KEYWORDS = [
  'experience', 'requirements', 'responsibilities', 'qualifications',
  'skills', 'role', 'position', 'candidate', 'team', 'benefits', 'salary',
]

function isPrivateHost(host: string): boolean {
  if (host === 'localhost' || host === '0.0.0.0' || host === '[::1]') return true
  if (host.startsWith('127.') || host.startsWith('192.168.') || host.startsWith('10.')) return true
  if (host.startsWith('169.254.')) return true
  const m = host.match(/^172\.(\d+)\./)
  if (m && parseInt(m[1]) >= 16 && parseInt(m[1]) <= 31) return true
  if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) return true
  return false
}

export interface FetchResult {
  text?: string
  error?: string
  isJsBlocked?: boolean
}

export async function fetchTextFromURL(url: string): Promise<FetchResult> {
  // Validate URL
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { error: 'Invalid URL. Make sure it starts with https://' }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { error: 'Only HTTP and HTTPS URLs are supported.' }
  }

  const host = parsed.hostname
  if (isPrivateHost(host)) {
    return { error: 'Internal network URLs are not allowed.' }
  }

  // Detect JS-rendered sites
  const isJsBlocked = JS_ONLY_SITES.some((s) => host.includes(s))
  if (isJsBlocked) {
    return {
      isJsBlocked: true,
      error: `${host} requires login and JavaScript rendering — it can't be fetched automatically.`,
    }
  }

  try {
    const response = await axios.get<string>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 12000,
      maxRedirects: 5,
      beforeRedirect: (options: any) => {
        try {
          const redirectHost = new URL(options.href || options.hostname || '').hostname || options.hostname || ''
          if (isPrivateHost(redirectHost)) throw new Error('Redirect to private network blocked')
        } catch (e: any) {
          if (e.message?.includes('blocked')) throw e
        }
      },
      maxContentLength: 5 * 1024 * 1024,
      responseType: 'text',
    })

    // Check content type
    const contentType = (response.headers['content-type'] as string) || ''
    if (BINARY_TYPES.some((t) => contentType.includes(t))) {
      return { error: `This URL returns ${contentType.split(';')[0]} — only web pages are supported.` }
    }

    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    const text = extractText(html)

    // Validate the extracted content looks like a job description
    const lower = text.toLowerCase()
    const hasJobContent = JOB_KEYWORDS.some((kw) => lower.includes(kw))

    if (text.length < 150 || !hasJobContent) {
      return {
        isJsBlocked: true,
        error: `The page content could not be extracted — it may require JavaScript or login to view.`,
      }
    }

    return { text }
  } catch (e: any) {
    if (e.response?.status === 403 || e.response?.status === 401) {
      return {
        isJsBlocked: true,
        error: `Access denied (${e.response.status}). This site requires login.`,
      }
    }
    if (e.response?.status === 404) {
      return { error: 'Page not found (404). Check the URL is correct.' }
    }
    return { error: `Could not fetch URL: ${e.message}` }
  }
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<\/?(p|div|section|article|li|br|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
