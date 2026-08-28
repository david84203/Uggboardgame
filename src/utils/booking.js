import { collection, addDoc, getDocs, doc, updateDoc, query, where } from 'firebase/firestore'
import { db } from '../firebase/config'

// ── 營業與預約規則 ───────────────────────────────────────────────────────────
// 平日假日一律 13:00–24:00，最晚可預約 23:00
// 12/31 跨年營業到隔天 02:00，時段延長至 01:00（以 24:00 / 24:30 / 25:00 表示隔日凌晨）
export const OPEN_MIN = 13 * 60          // 13:00
export const LAST_SLOT_MIN = 23 * 60     // 23:00
export const NYE_LAST_SLOT_MIN = 25 * 60 // 12/31 延長到隔日 01:00
export const SLOT_STEP = 30              // 半小時為單位
export const MIN_AHEAD_MIN = 30          // 至少提前 30 分鐘
export const MAX_AHEAD_DAYS = 62         // 最多提前 2 個月

export const FLOOR_OPTIONS = ['不指定', '1F 桌遊牆區', '2F 地板區', '3F 桌椅區']

// ── 日期與時間小工具 ─────────────────────────────────────────────────────────
const pad = n => String(n).padStart(2, '0')

export function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 週二全店公休（本地時區判斷，避免用字串解析誤判時區） */
export function isClosedDay(dateStr) {
  if (!dateStr) return false
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d).getDay() === 2
}

export function todayStr() {
  return toDateStr(new Date())
}

export function maxDateStr() {
  const d = new Date()
  d.setDate(d.getDate() + MAX_AHEAD_DAYS)
  return toDateStr(d)
}

/** '24:30' → 隔日 00:30，回傳 { min, nextDay } */
export function parseSlot(value) {
  const [h, m] = value.split(':').map(Number)
  const min = h * 60 + m
  return { min, nextDay: min >= 24 * 60 }
}

/** 分鐘數 → 選單顯示文字，跨日時段標示凌晨 */
export function slotLabel(min) {
  const nextDay = min >= 24 * 60
  const real = min % (24 * 60)
  const text = `${pad(Math.floor(real / 60))}:${pad(real % 60)}`
  return nextDay ? `${text}（隔日凌晨）` : text
}

/** 分鐘數 → 存進資料庫的值，例如 1470 → '24:30' */
function slotValue(min) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
}

/**
 * 產生某一天可選的時段。
 * 今天的話會濾掉「已經來不及」的時段（至少提前 30 分鐘）。
 */
export function generateSlots(dateStr) {
  if (!dateStr) return []
  if (isClosedDay(dateStr)) return []
  const lastMin = dateStr.endsWith('-12-31') ? NYE_LAST_SLOT_MIN : LAST_SLOT_MIN

  let earliest = OPEN_MIN
  if (dateStr === todayStr()) {
    const now = new Date()
    const cutoff = now.getHours() * 60 + now.getMinutes() + MIN_AHEAD_MIN
    // 進位到下一個半點
    earliest = Math.max(OPEN_MIN, Math.ceil(cutoff / SLOT_STEP) * SLOT_STEP)
  }

  const slots = []
  for (let m = earliest; m <= lastMin; m += SLOT_STEP) {
    slots.push({ value: slotValue(m), label: slotLabel(m) })
  }
  return slots
}

/** 預約的實際起訖時間（Date 物件），給日曆用；預設抓 3 小時 */
export function bookingRange(dateStr, timeValue, hours = 3) {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const { min } = parseSlot(timeValue)
  const start = new Date(y, mo - 1, d, 0, 0, 0)
  start.setMinutes(min) // 超過 24:00 會自動進位到隔天
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000)
  return { start, end }
}

// ── 送出前的檢查 ─────────────────────────────────────────────────────────────
// 手機一律必填（含店長手動補登）：客人沒出現時要有 LINE 以外的第二條聯絡管道
export function validateBooking(form) {
  if (!form.name?.trim()) return '請填寫姓名'
  const phone = (form.phone || '').replace(/[\s\-()]/g, '')
  if (!/^09\d{8}$/.test(phone)) return '手機號碼格式不對，請填 09 開頭的 10 碼'
  if (!form.date) return '請選擇日期'
  if (form.date < todayStr()) return '不能預約過去的日期'
  if (form.date > maxDateStr()) return '最多只能預約兩個月內的日期'
  if (isClosedDay(form.date)) return '週二店休，請選擇其他日期'
  if (!form.time) return '請選擇時間'
  if (!generateSlots(form.date).some(s => s.value === form.time)) {
    return '這個時段已經來不及或不在營業時間內，請重新選擇'
  }
  if (!form.people || form.people < 1) return '請選擇人數'
  return null
}

// ── Firestore 存取 ───────────────────────────────────────────────────────────
const COL = 'bookings'
const LOCAL_KEY = 'ugg_my_bookings'

/** 非會員也要看得到自己送出的預約，所以本機記一份 id */
function rememberLocal(id) {
  try {
    const ids = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
    if (!ids.includes(id)) localStorage.setItem(LOCAL_KEY, JSON.stringify([...ids, id]))
  } catch { /* localStorage 不可用就算了，會員仍可用手機號碼查到 */ }
}

function localIds() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}

// remember: false ＝ 店長在後台代客建立，不要記進這台裝置的「我的預約」
export async function createBooking(form, { remember = true } = {}) {
  const phone = (form.phone || '').replace(/[\s\-()]/g, '')
  const ref = await addDoc(collection(db, COL), {
    name: form.name.trim(),
    phone,
    memberId: form.memberId || null,
    memberNo: form.memberNo || null,
    lineUserId: form.lineUserId || null,
    date: form.date,
    time: form.time,
    people: Number(form.people),
    floor: form.floor || '不指定',
    firstVisit: !!form.firstVisit,
    note: (form.note || '').trim(),
    status: 'pending',
    calendarEventId: null,
    createdAt: new Date().toISOString(),
  })
  if (remember) rememberLocal(ref.id)
  return ref.id
}

const sortByWhen = (a, b) => (a.date + a.time).localeCompare(b.date + b.time)

/** 查「我的預約」：會員用手機或 LINE 比對，非會員靠本機記錄 */
export async function fetchMyBookings({ phone, lineUserId } = {}) {
  const found = new Map()
  const add = d => found.set(d.id, { ...d.data(), id: d.id })

  const queries = []
  if (phone) queries.push(query(collection(db, COL), where('phone', '==', phone.replace(/[\s\-()]/g, ''))))
  if (lineUserId) queries.push(query(collection(db, COL), where('lineUserId', '==', lineUserId)))
  for (const q of queries) (await getDocs(q)).forEach(add)

  const ids = localIds().filter(id => !found.has(id))
  if (ids.length) {
    // 本機 id 可能已被刪除，逐筆撈但忽略失敗
    const snap = await getDocs(collection(db, COL))
    snap.forEach(d => { if (ids.includes(d.id)) add(d) })
  }

  return [...found.values()].sort(sortByWhen)
}

/** GM 後台：待確認優先，其次是未來已確認的預約 */
export async function fetchBookingsForAdmin() {
  const snap = await getDocs(collection(db, COL))
  const all = snap.docs.map(d => ({ ...d.data(), id: d.id }))
  const today = todayStr()
  return {
    pending: all.filter(b => b.status === 'pending').sort(sortByWhen),
    upcoming: all.filter(b => b.status === 'confirmed' && b.date >= today).sort(sortByWhen),
  }
}

export async function updateBookingStatus(id, status, extra = {}) {
  await updateDoc(doc(db, COL, id), { status, ...extra })
}

export const STATUS_LABEL = {
  pending: { text: '待確認', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  confirmed: { text: '已確認 ✅', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  cancelled: { text: '已取消', cls: 'bg-stone-100 text-stone-400 border-stone-200' },
  declined: { text: '未能安排', cls: 'bg-rose-50 text-rose-500 border-rose-200' },
}
