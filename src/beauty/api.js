import { getIdToken } from './liff/useLiff.js'

const DEV_TOKEN = import.meta.env.VITE_BEAUTY_DEV_TOKEN || null

async function token() {
  return (await getIdToken()) || DEV_TOKEN
}

export async function analyze(payload, { timeoutMs = 40_000 } = {}) {
  const idToken = await token()
  const res = await fetch('/api/beauty/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, ...payload }),
    signal: AbortSignal.timeout(timeoutMs),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(json.message || json.error || `HTTP ${res.status}`), { status: res.status, data: json })
  return json
}

export async function fetchReport(id) {
  const idToken = await token()
  const res = await fetch(`/api/beauty/report?id=${encodeURIComponent(id)}&idToken=${encodeURIComponent(idToken || '')}`)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(json.message || json.error), { status: res.status })
  return json
}

// 事件批次送出：最多累積 10 筆或 3 秒
let queue = []
let timer = null
const ref = new URLSearchParams(window.location.search).get('ref') || null
export function track(type, extra = {}) {
  queue.push({ type, ref, ...extra })
  if (queue.length >= 10) flush()
  else if (!timer) timer = setTimeout(flush, 3000)
}
export async function flush() {
  clearTimeout(timer); timer = null
  if (!queue.length) return
  const events = queue; queue = []
  try {
    const idToken = await token()
    await fetch('/api/beauty/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken, events }), keepalive: true })
  } catch {}
}
window.addEventListener('pagehide', flush)
