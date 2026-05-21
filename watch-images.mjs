/**
 * 圖片自動 commit + push 監控腳本
 * 偵測到 public/images/ 新增圖片後，等待 5 秒批次 commit + push
 * 啟動：node watch-images.mjs
 */

import { watch, existsSync } from 'fs'
import { spawn } from 'child_process'
import { join, dirname, extname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = join(__dirname, 'public', 'images')
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])
const DEBOUNCE_MS = 5000

let timer = null
const pendingFiles = new Set()

function now() {
  return new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function runCommand(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, shell: true })
    let output = ''
    proc.stdout.on('data', d => { output += d.toString() })
    proc.stderr.on('data', d => { output += d.toString() })
    proc.on('close', code => code === 0 ? resolve(output.trim()) : reject(new Error(output.trim() || `exit code ${code}`)))
  })
}

async function commitAndPush(files) {
  const cwd = __dirname

  try {
    console.log(`\n[${now()}] 開始自動 commit...`)

    for (const file of files) {
      const rel = `public/images/${basename(file)}`
      await runCommand('git', ['add', rel], cwd)
    }

    const status = await runCommand('git', ['status', '--porcelain'], cwd)
    if (!status.trim()) {
      console.log('沒有變更，跳過\n')
      return
    }

    const names = [...files].map(f => basename(f)).join(', ')
    await runCommand('git', ['commit', '-m', `feat: 新增圖片 ${names}`], cwd)
    console.log(`[${now()}] Commit 完成，推送中...`)

    await runCommand('git', ['push'], cwd)
    console.log(`[${now()}] ✅ 已推送：${names}\n`)
  } catch (err) {
    console.error(`[${now()}] ❌ 失敗：${err.message}\n`)
  }
}

function scheduleCommit(filePath) {
  pendingFiles.add(filePath)
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    const files = new Set(pendingFiles)
    pendingFiles.clear()
    timer = null
    commitAndPush(files)
  }, DEBOUNCE_MS)
}

if (!existsSync(IMAGES_DIR)) {
  console.error(`找不到資料夾：${IMAGES_DIR}`)
  process.exit(1)
}

console.log(`\n🖼  圖片監控啟動`)
console.log(`   監控：${IMAGES_DIR}`)
console.log(`   偵測到新圖片後等待 ${DEBOUNCE_MS / 1000} 秒再 commit + push`)
console.log(`   等待中...\n`)

watch(IMAGES_DIR, (eventType, filename) => {
  if (!filename) return
  const ext = extname(filename).toLowerCase()
  if (!IMAGE_EXTS.has(ext)) return

  const filePath = join(IMAGES_DIR, filename)
  if (!existsSync(filePath)) return // 忽略刪除事件

  console.log(`[${now()}] 偵測到：${filename}，${DEBOUNCE_MS / 1000} 秒後 commit...`)
  scheduleCommit(filePath)
})
