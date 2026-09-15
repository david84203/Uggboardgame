export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

export function fail(res, e) {
  const status = e?.status && e.status >= 400 && e.status < 600 ? e.status : 500
  const code = e?.code || (status === 401 ? 'unauthorized' : status === 429 ? 'rate_limited' : status === 422 ? 'unprocessable' : 'error')
  if (status >= 500) console.error('[beauty]', e)
  json(res, status, { error: code, message: status >= 500 ? 'server error' : e.message })
}

export function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  try { return JSON.parse(req.body || '{}') } catch { return {} }
}

export function newId() {
  const t = new Date()
  const ymd = `${String(t.getFullYear()).slice(2)}${String(t.getMonth() + 1).padStart(2, '0')}${String(t.getDate()).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `BL-${ymd}-${rand}`
}
