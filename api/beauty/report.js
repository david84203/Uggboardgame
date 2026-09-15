// GET /api/beauty/report?id=BL-...&idToken=...  本人重開報告
import { authenticate } from './_lib/line.js'
import { getAnalysis } from './_lib/firestore.js'
import { json, fail } from './_lib/http.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'method' })
  try {
    const url = new URL(req.url, 'http://x')
    const { uid } = await authenticate(url.searchParams.get('idToken'))
    const doc = await getAnalysis(String(url.searchParams.get('id') || ''))
    if (!doc || doc.uid !== uid) return json(res, 404, { error: 'not_found' })
    return json(res, 200, { analysisId: doc.id, report: doc.report, products: doc.meta?.products ?? [] })
  } catch (e) {
    return fail(res, e)
  }
}
