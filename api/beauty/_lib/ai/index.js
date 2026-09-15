import { analyzeWithClaude } from './claude.js'
import { analyzeWithGemini } from './gemini.js'
import { validateAiOutput } from '../validate.js'

const PROVIDERS = { claude: analyzeWithClaude, gemini: analyzeWithGemini }

/** 供應商可用環境變數 BEAUTY_AI_PROVIDER 切換；驗證失敗會重試一次。 */
export async function analyzeImage(input) {
  const name = process.env.BEAUTY_AI_PROVIDER || 'claude'
  const fn = PROVIDERS[name]
  if (!fn) throw Object.assign(new Error(`unknown provider ${name}`), { status: 500 })
  let lastErr = null
  for (let attempt = 0; attempt < 2; attempt++) {
    const started = Date.now()
    try {
      const res = await fn(input)
      const v = validateAiOutput(res.output)
      if (!v.ok) { lastErr = Object.assign(new Error(`schema: ${v.errors.join('; ')}`), { status: 502 }); continue }
      return { ...res, provider: name, durationMs: Date.now() - started, attempts: attempt + 1 }
    } catch (e) {
      lastErr = e
      if (e.code === 'refusal' || e.status === 500) break
    }
  }
  throw lastErr
}
