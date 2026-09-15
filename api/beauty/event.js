// POST /api/beauty/event  { idToken, events: [{ type, analysisId?, payload?, ref? }] }
import { authenticate } from './_lib/line.js'
import { logEvents } from './_lib/firestore.js'
import { json, fail, readBody } from './_lib/http.js'

const TYPES = new Set(['entry', 'liff_ready', 'consent_ok', 'guide_view', 'photo_selected', 'quality_fail', 'style_selected', 'analysis_start', 'analysis_done', 'report_view', 'layer_toggle', 'cta_click', 'share_card', 'send_to_chat', 'feedback', 'report_reopen'])

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method' })
  try {
    const body = readBody(req)
    const { uid } = await authenticate(body.idToken)
    const events = (Array.isArray(body.events) ? body.events : [])
      .filter((e) => e && TYPES.has(e.type))
      .map((e) => ({ type: e.type, analysisId: e.analysisId ?? null, payload: e.payload ?? null, ref: e.ref ?? null }))
    if (events.length) await logEvents(uid, events)
    return json(res, 200, { ok: true, count: events.length })
  } catch (e) {
    return fail(res, e)
  }
}
