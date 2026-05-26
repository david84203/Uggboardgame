import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'
import Papa from 'papaparse'

const require = createRequire(import.meta.url)
const sa = require('./service-account.json')
initializeApp({ credential: cert(sa) })
const db = getFirestore()

// 1. 取得所有 rental 的 gameName
const snap = await db.collection('rentals').get()
const rentalNames = new Set()
snap.docs.forEach(d => {
  ;(d.data().games || []).forEach(g => { if (g.gameName) rentalNames.add(g.gameName.trim()) })
})

// 2. 取得 Sheet 的所有遊戲名
const res = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTBJylM7ousC0ift39FwzpIB7NrFgYZBfaKug_pBLXU_l0UZKTKKlcfO9663eetX13d5pbsWBLGinVE/pub?gid=540615026&single=true&output=csv')
const csv = await res.text()
const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
const sheetNames = new Set(parsed.data.map(r => (r['中文名稱'] || '').trim()).filter(Boolean))

// 3. 比對
console.log('=== 租借紀錄名稱 vs Sheet 名稱 ===')
for (const name of rentalNames) {
  const match = sheetNames.has(name)
  console.log(match ? '✅' : '❌', `"${name}"`)
}
