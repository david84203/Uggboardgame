import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'
import Papa from 'papaparse'

const require = createRequire(import.meta.url)
const sa = require('./service-account.json')
initializeApp({ credential: cert(sa) })
const db = getFirestore()

// 取 Sheet（正確解析）
const res = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTBJylM7ousC0ift39FwzpIB7NrFgYZBfaKug_pBLXU_l0UZKTKKlcfO9663eetX13d5pbsWBLGinVE/pub?gid=540615026&single=true&output=csv')
const csv = await res.text()
const lines = csv.split('\n')
const headerIndex = lines.findIndex(l => l.includes('中文名稱'))
const parsed = Papa.parse(lines.slice(headerIndex).join('\n'), { header: true, skipEmptyLines: true, transformHeader: h => h.trim() })
const sheetNames = new Set(parsed.data.map(r => (r['中文名稱'] || '').trim()).filter(Boolean))

// 取 rental names
const snap = await db.collection('rentals').get()
const rentalNames = new Set()
snap.docs.forEach(d => {
  ;(d.data().games || []).forEach(g => { if (g.gameName) rentalNames.add(g.gameName.trim()) })
})

// 精確比對並顯示 Unicode
for (const name of rentalNames) {
  const match = sheetNames.has(name)
  const hex = [...name].map(c => c.codePointAt(0).toString(16).toUpperCase()).join(' ')
  console.log(match ? '✅' : '❌', `"${name}"  [${hex}]`)
  if (!match) {
    // 找最接近的 Sheet 名稱
    const closest = [...sheetNames].find(s => s.includes(name.slice(0, 2)) || name.includes(s.slice(0, 2)))
    if (closest) {
      const hex2 = [...closest].map(c => c.codePointAt(0).toString(16).toUpperCase()).join(' ')
      console.log(`   Sheet最近: "${closest}"  [${hex2}]`)
    }
  }
}
