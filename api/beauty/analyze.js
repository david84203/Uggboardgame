// POST /api/beauty/analyze
// { idToken, image(base64 jpeg), styles[], context, selfReport[], metrics, faceHint, skinHint, clientQuality, idempotencyKey }
import { authenticate } from './_lib/line.js'
import { reserveQuota, refundQuota, saveAnalysis, getAnalysis } from './_lib/firestore.js'
import { analyzeImage } from './_lib/ai/index.js'
import { PROMPT_VERSION } from './_lib/prompt.js'
import { json, fail, readBody, newId } from './_lib/http.js'
import { buildReport, machineTags, REPORT_VERSION } from '../../src/beauty/rules/buildReport.js'
import { pickProducts } from './_lib/products.js'

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }

const MAX_IMAGE_B64 = 560_000 // ≈ 420KB JPEG
const STYLE_ENUM = new Set(['korean_bare', 'sharp_intellectual', 'sweet_cool', 'jp_soft_matte', 'western_sculpted', 'french_lazy', 'kdrama_lead', 'office', 'date', 'id_photo'])

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method' })
  try {
    const body = readBody(req)
    const profile = await authenticate(body.idToken)
    const { uid } = profile

    const image = typeof body.image === 'string' ? body.image : ''
    if (!image || image.length > MAX_IMAGE_B64) throw Object.assign(new Error('image missing or too large'), { status: 400 })
    const styles = Array.isArray(body.styles) ? body.styles.filter((s) => STYLE_ENUM.has(s)).slice(0, 3) : []
    const context = typeof body.context === 'string' ? body.context.slice(0, 20) : null
    const selfReport = Array.isArray(body.selfReport) ? body.selfReport.map(String).slice(0, 4) : []
    const idempotencyKey = String(body.idempotencyKey || '').slice(0, 64) || newId()

    const quota = await reserveQuota({ uid, idempotencyKey })
    if (quota.replay && quota.analysisId) {
      const prev = await getAnalysis(quota.analysisId)
      if (prev) return json(res, 200, { analysisId: prev.id, report: prev.report, products: prev.meta?.products ?? [], replay: true })
    }
    if (!quota.ok) return json(res, 429, { error: quota.reason, message: quota.reason === 'user_limit' ? '今天的三次分析用完了，明天再來' : '今日名額已滿，明天再來' })

    let ai
    try {
      ai = await analyzeImage({ imageBase64: image, styles, context, selfReport, metrics: body.metrics, faceHint: body.faceHint, skinHint: body.skinHint, clientQuality: body.clientQuality })
    } catch (e) {
      await refundQuota({ uid, day: quota.day }).catch(() => {})
      if (e.code === 'refusal') return json(res, 422, { error: 'unprocessable', message: '這張照片無法分析，請換一張' })
      throw e
    }

    if (!ai.output.quality.ok) {
      await refundQuota({ uid, day: quota.day }).catch(() => {})
      return json(res, 422, { error: 'quality', issues: ai.output.quality.issues })
    }

    const analysisId = newId()
    const report = buildReport({ ai: ai.output, metrics: body.metrics, styles, context, selfReport, analysisId })
    const products = await pickProducts({ skin: ai.output.skin, tone: ai.output.color_tone.tone })
    const tags = machineTags(report)
    await saveAnalysis({
      uid, profile, analysisId, idempotencyKey, report,
      input: { styles, context, selfReport, metrics: body.metrics ?? null, clientQuality: body.clientQuality ?? null, ref: body.ref ?? null },
      meta: { tags, products, provider: ai.provider, model: ai.model, usage: ai.usage, durationMs: ai.durationMs, attempts: ai.attempts, promptVersion: PROMPT_VERSION, reportVersion: REPORT_VERSION },
    })
    return json(res, 200, { analysisId, report, products })
  } catch (e) {
    return fail(res, e)
  }
}
