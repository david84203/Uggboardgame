// Firebase Admin：憑證放環境變數 FIREBASE_SERVICE_ACCOUNT（整份 JSON 字串）。
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

let db = null
export function getDb() {
  if (db) return db
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!raw) throw Object.assign(new Error('FIREBASE_SERVICE_ACCOUNT not set'), { status: 500 })
    initializeApp({ credential: cert(JSON.parse(raw)) })
  }
  db = getFirestore()
  return db
}
export { FieldValue }

const tzDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date()) // YYYY-MM-DD

export const DAILY_PER_USER = Number(process.env.BEAUTY_DAILY_PER_USER || 3)
export const DAILY_GLOBAL = Number(process.env.BEAUTY_DAILY_GLOBAL || 300)

/**
 * 扣一次額度。回傳 { ok, reason }；idempotencyKey 重送時回 { ok:true, replay:true, analysisId }。
 * 不合格照片（quality.ok=false）之後會用 refund() 退回。
 */
export async function reserveQuota({ uid, idempotencyKey }) {
  const db = getDb()
  const day = tzDate()
  const userRef = db.collection('beauty_users').doc(uid)
  const globalRef = db.collection('beauty_config').doc(`daily_${day}`)
  const idemRef = db.collection('beauty_idempotency').doc(`${uid}_${idempotencyKey}`)
  return db.runTransaction(async (tx) => {
    const [u, g, i] = await Promise.all([tx.get(userRef), tx.get(globalRef), tx.get(idemRef)])
    if (i.exists) return { ok: true, replay: true, analysisId: i.data().analysisId ?? null }
    const used = u.exists ? u.data().daily?.[day] ?? 0 : 0
    if (used >= DAILY_PER_USER) return { ok: false, reason: 'user_limit' }
    const gUsed = g.exists ? g.data().count ?? 0 : 0
    if (gUsed >= DAILY_GLOBAL) return { ok: false, reason: 'global_limit' }
    tx.set(userRef, { daily: { [day]: used + 1 }, lastSeenAt: FieldValue.serverTimestamp() }, { merge: true })
    tx.set(globalRef, { count: gUsed + 1 }, { merge: true })
    tx.set(idemRef, { createdAt: FieldValue.serverTimestamp(), analysisId: null })
    return { ok: true, day }
  })
}

export async function refundQuota({ uid, day }) {
  const db = getDb()
  const userRef = db.collection('beauty_users').doc(uid)
  const globalRef = db.collection('beauty_config').doc(`daily_${day}`)
  await db.runTransaction(async (tx) => {
    const [u, g] = await Promise.all([tx.get(userRef), tx.get(globalRef)])
    const used = u.exists ? u.data().daily?.[day] ?? 0 : 0
    const gUsed = g.exists ? g.data().count ?? 0 : 0
    tx.set(userRef, { daily: { [day]: Math.max(0, used - 1) } }, { merge: true })
    tx.set(globalRef, { count: Math.max(0, gUsed - 1) }, { merge: true })
  })
}

export async function saveAnalysis({ uid, profile, analysisId, idempotencyKey, report, input, meta }) {
  const db = getDb()
  const batch = db.batch()
  batch.set(db.collection('beauty_analyses').doc(analysisId), {
    uid, createdAt: FieldValue.serverTimestamp(), report, input, meta,
  })
  batch.set(db.collection('beauty_users').doc(uid), {
    displayName: profile?.name ?? null,
    pictureUrl: profile?.picture ?? null,
    tags: FieldValue.arrayUnion(...meta.tags),
    lastAnalysisId: analysisId,
    firstSeenAt: FieldValue.serverTimestamp(),
  }, { merge: true })
  batch.set(db.collection('beauty_idempotency').doc(`${uid}_${idempotencyKey}`), { analysisId }, { merge: true })
  await batch.commit()
}

export async function getAnalysis(analysisId) {
  const snap = await getDb().collection('beauty_analyses').doc(analysisId).get()
  return snap.exists ? { id: snap.id, ...snap.data() } : null
}

export async function logEvents(uid, events) {
  const db = getDb()
  const batch = db.batch()
  for (const ev of events.slice(0, 50)) {
    batch.set(db.collection('beauty_events').doc(), { uid, ...ev, ts: FieldValue.serverTimestamp() })
  }
  const intents = events.map((e) => e.type === 'cta_click' && e.payload?.intent).filter(Boolean)
  if (intents.length) batch.set(db.collection('beauty_users').doc(uid), { tags: FieldValue.arrayUnion(...intents.map((i) => `intent:${i}`)) }, { merge: true })
  await batch.commit()
}
