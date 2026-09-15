// 商品對照表：從 products.json（由 Han 的 Google Sheet / CSV 轉出）挑 2 保養 + 2 彩妝。
import { readFile } from 'node:fs/promises'
import path from 'node:path'

let cache = { at: 0, rows: [] }
const TTL = 60 * 60 * 1000

async function loadRows() {
  if (Date.now() - cache.at < TTL && cache.rows.length) return cache.rows
  const url = process.env.BEAUTY_PRODUCTS_URL
  let rows = []
  try {
    if (url) {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      rows = await res.json()
    } else {
      const file = path.join(process.cwd(), 'src/beauty/data/products.json')
      rows = JSON.parse(await readFile(file, 'utf8'))
    }
  } catch (e) {
    console.warn('[beauty] products load failed', e.message)
  }
  cache = { at: Date.now(), rows: Array.isArray(rows) ? rows : [] }
  return cache.rows
}

const list = (v) => (Array.isArray(v) ? v : String(v || '').split(',').map((s) => s.trim()).filter(Boolean))
const toneGroup = (tone) => (tone === 'warm' ? 'warm' : tone === 'cool' ? 'cool' : 'neutral')

export async function pickProducts({ skin, tone }) {
  const rows = (await loadRows()).filter((r) => String(r.active ?? 'TRUE').toUpperCase() !== 'FALSE')
  const tg = toneGroup(tone)
  const score = (r) => {
    const skins = list(r.skin_types), obs = list(r.observations), tones = list(r.tones)
    let s = 0
    if (skins.length && !skins.includes(skin.type)) return -1
    if (skins.includes(skin.type)) s += 2
    s += obs.filter((o) => (skin.observations || []).includes(o)).length * 1.5
    if (tones.length) { if (tones.includes(tg)) s += 2; else if (r.category === 'makeup') return -1 }
    s -= Number(r.priority || 5) * 0.01
    return s
  }
  const ranked = (cat) => rows.filter((r) => r.category === cat).map((r) => ({ r, s: score(r) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s).map((x) => x.r)
  const pick = (cat) => {
    let arr = ranked(cat).slice(0, 2)
    if (arr.length < 2) arr = [...arr, ...rows.filter((r) => r.category === cat && !arr.includes(r))].slice(0, 2)
    return arr
  }
  return [...pick('skincare'), ...pick('makeup')].map((r) => ({
    sku: r.sku, name: r.name, category: r.category, url: r.url || null, image: r.image || null, price: r.price || null, note: r.note || '',
  }))
}
