import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const sa = require('./service-account.json')
initializeApp({ credential: cert(sa) })
const db = getFirestore()

// 查所有 status
const snap = await db.collection('rentals').get()
console.log('全部租借筆數:', snap.size)

// 列出所有 gameName 確認名稱
const names = new Set()
snap.docs.forEach(d => {
  const games = d.data().games || []
  games.forEach(g => {
    if (g.gameName) names.add(g.gameName.trim())
  })
})
console.log('\n所有 gameName（共', names.size, '種）:')
;[...names].sort().forEach(n => console.log(' -', n))
