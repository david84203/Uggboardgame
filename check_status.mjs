import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const sa = require('./service-account.json')
initializeApp({ credential: cert(sa) })
const db = getFirestore()

const snap = await db.collection('rentals').get()
console.log('=== 所有租借紀錄的 status ===')
snap.docs.forEach(d => {
  const data = d.data()
  console.log(`date:${data.date} | status:"${data.status ?? '(無status欄位)'}" | games:${data.games ? data.games.map(g => g.gameName).join('、') : '(無games)'}`)
})
