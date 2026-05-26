import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const sa = require('./service-account.json')
initializeApp({ credential: cert(sa) })
const db = getFirestore()

const FROM = '奧秘小鎮'
const TO = '奧秘小隊'

const snap = await db.collection('rentals').get()
let fixed = 0

for (const doc of snap.docs) {
  const data = doc.data()
  const games = data.games || []
  let changed = false

  const newGames = games.map(g => {
    if (g.gameName === FROM) {
      changed = true
      return { ...g, gameName: TO }
    }
    return g
  })

  if (changed) {
    await doc.ref.update({ games: newGames })
    console.log(`✅ 修正 doc ${doc.id}：${FROM} → ${TO}`)
    fixed++
  }
}

console.log(`\n完成，共修正 ${fixed} 筆`)
