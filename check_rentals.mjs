import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const sa = require('./service-account.json')

initializeApp({ credential: cert(sa) })
const db = getFirestore()

const snap = await db.collection('rentals').limit(5).get()
console.log(`共找到 ${snap.size} 筆（前5筆）`)
snap.docs.forEach(d => {
  const data = d.data()
  console.log('\n---')
  console.log('date:', data.date)
  console.log('memberName:', data.memberName)
  console.log('gameName:', data.gameName)
  console.log('games:', JSON.stringify(data.games, null, 2))
})
