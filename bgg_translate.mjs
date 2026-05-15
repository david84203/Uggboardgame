import { google } from 'googleapis'
import { readFileSync, writeFileSync } from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw'
const KEY_PATH = 'C:/Users/bboylu/Dropbox/service-account-ugg.json'
const WORK_FILE = 'C:/Users/bboylu/Dropbox/Claude Memory/translate_work.json'

async function getSheets() {
  const key = JSON.parse(readFileSync(KEY_PATH, 'utf8'))
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const client = await auth.getClient()
  return google.sheets({ version: 'v4', auth: client })
}

async function write() {
  const data = JSON.parse(readFileSync(WORK_FILE, 'utf8'))
  const toWrite = data.filter(d => d.zhDesc && d.zhDesc.trim() && d.rowNum)

  if (toWrite.length === 0) {
    console.log('沒有可寫入的翻譯')
    return
  }

  const sheets = await getSheets()

  // 批次寫入，每次最多 50 筆
  const batchSize = 50
  let written = 0

  for (let i = 0; i < toWrite.length; i += batchSize) {
    const batch = toWrite.slice(i, i + batchSize)
    const data_values = batch.map(item => ({
      range: `Y${item.rowNum}`,
      values: [[item.zhDesc]],
    }))

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: data_values,
      },
    })

    written += batch.length
    console.log(`已寫入 ${written} / ${toWrite.length} 筆...`)

    // 避免 API 限流
    if (i + batchSize < toWrite.length) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  console.log(`✅ 完成！共寫入 ${written} 筆到 Google Sheet Y 欄`)
}

async function status() {
  const data = JSON.parse(readFileSync(WORK_FILE, 'utf8'))
  const total = data.length
  const done = data.filter(d => d.zhDesc && d.zhDesc.trim()).length
  const todo = total - done
  console.log(`📊 翻譯進度：${done} / ${total} 筆`)
  console.log(`   已翻譯：${done} 筆`)
  console.log(`   待翻譯：${todo} 筆`)
  console.log(`   完成率：${Math.round(done / total * 100)}%`)
}

const cmd = process.argv[2]
if (cmd === 'write') {
  write().catch(console.error)
} else if (cmd === 'status') {
  status()
} else {
  console.log('用法：')
  console.log('  node bgg_translate.mjs status  → 查看翻譯進度')
  console.log('  node bgg_translate.mjs write   → 將已翻譯內容寫入 Google Sheet')
}
