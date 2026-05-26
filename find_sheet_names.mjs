import Papa from 'papaparse'

const res = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTBJylM7ousC0ift39FwzpIB7NrFgYZBfaKug_pBLXU_l0UZKTKKlcfO9663eetX13d5pbsWBLGinVE/pub?gid=540615026&single=true&output=csv')
const csv = await res.text()
const lines = csv.split('\n')
const headerIndex = lines.findIndex(l => l.includes('中文名稱'))
const cleanedCsv = lines.slice(headerIndex).join('\n')
const parsed = Papa.parse(cleanedCsv, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() })

const sheetGames = parsed.data.map((row, i) => ({
  row: headerIndex + i + 2,
  name: (row['中文名稱'] || '').trim()
})).filter(g => g.name)

const rentals = ['截碼戰', '鐵道任務美國', '超級犀牛', '世界奇觀', '世界奇觀擴', '萌鼠摘月', '奧秘小鎮', '麥擱假', '眨眨眼', '璀璨寶石：寶可夢']

for (const rental of rentals) {
  const keywords = rental.replace(/[：:]/g, '').split('')
  const candidates = sheetGames
    .filter(g => g.name && rental.split('').filter(c => g.name.includes(c)).length >= Math.min(3, rental.length))
    .sort((a, b) => {
      const scoreA = rental.split('').filter(c => a.name.includes(c)).length
      const scoreB = rental.split('').filter(c => b.name.includes(c)).length
      return scoreB - scoreA
    })
    .slice(0, 3)

  console.log(`\n"${rental}" → 可能是：`)
  candidates.forEach(c => console.log(`  row ${c.row}: "${c.name}"`))
}
