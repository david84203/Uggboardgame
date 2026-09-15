// 實驗性：Gemini 供應商（供校準集比對用）。REST 呼叫，responseSchema 為 OpenAPI 子集，
// 所以要把 additionalProperties / 多型 type 拿掉。未經實測，切換前先跑校準集。
import { AI_OUTPUT_SCHEMA } from '../../../../src/beauty/rules/aiOutputSchema.js'
import { SYSTEM_PROMPT, userMessage } from '../prompt.js'

const MODEL = process.env.BEAUTY_GEMINI_MODEL || 'gemini-2.5-flash'

function toGeminiSchema(node) {
  if (Array.isArray(node)) return node.map(toGeminiSchema)
  if (!node || typeof node !== 'object') return node
  const out = {}
  for (const [k, v] of Object.entries(node)) {
    if (k === 'additionalProperties' || k === 'description' || k === 'maxItems' || k === 'minimum' || k === 'maximum') continue
    if (k === 'type' && Array.isArray(v)) { out.type = v.find((t) => t !== 'null'); out.nullable = true; continue }
    if (k === 'enum') { out.enum = v.filter((x) => x !== null); continue }
    out[k] = toGeminiSchema(v)
  }
  return out
}

export async function analyzeWithGemini({ imageBase64, ...input }) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw Object.assign(new Error('GEMINI_API_KEY not set'), { status: 500 })
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }, { text: userMessage(input) }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: toGeminiSchema(AI_OUTPUT_SCHEMA), temperature: 0.2 },
  }
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(25_000) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(json.error?.message || `gemini ${res.status}`), { status: 502 })
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? ''
  const u = json.usageMetadata || {}
  return { output: JSON.parse(text), usage: { input: u.promptTokenCount ?? 0, output: u.candidatesTokenCount ?? 0, cacheRead: u.cachedContentTokenCount ?? 0, cacheWrite: 0 }, model: MODEL }
}
