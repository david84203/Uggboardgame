import { bookingRange } from './booking'

// Google Apps Script Web App 網址（部署後填進 .env 的 VITE_GAS_BOOKING_URL）
// 由它負責寫 Google 日曆與推 LINE 訊息，金鑰不會出現在前端
const GAS_URL = import.meta.env.VITE_GAS_BOOKING_URL
const GAS_SECRET = import.meta.env.VITE_GAS_BOOKING_SECRET || ''

export const isSyncConfigured = () => !!GAS_URL

/**
 * 通知後端處理日曆與 LINE。
 * action: 'confirm' | 'cancel' | 'decline' | 'notify'（notify＝通知店長有新預約／客人取消）
 * 回傳 { ok, eventId?, error? }；未設定網址時回 { ok:false, skipped:true }
 */
export async function syncBooking(action, booking) {
  if (!GAS_URL) return { ok: false, skipped: true, error: '尚未設定日曆連線' }

  const { start, end } = bookingRange(booking.date, booking.time)
  const payload = {
    action,
    secret: GAS_SECRET,
    booking: {
      id: booking.id,
      name: booking.name,
      phone: booking.phone,
      people: booking.people,
      floor: booking.floor,
      note: booking.note,
      firstVisit: booking.firstVisit,
      lineUserId: booking.lineUserId || null,
      date: booking.date,
      time: booking.time,
      start: start.toISOString(),
      end: end.toISOString(),
      calendarEventId: booking.calendarEventId || null,
      reason: booking.reason || '',
      kind: booking.kind || 'new',
    },
  }

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      // 用 text/plain 送出，避免瀏覽器對 Apps Script 發 CORS preflight
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      // Apps Script 的 POST 回應會先轉址一次，Google 有時把它換成 HTML 頁，
      // 但腳本其實已經跑完了。confirm 改用 GET 回頭查日曆確認；
      // 其他動作沒有結果要拿，不當成失敗。
      if (action !== 'confirm') return { ok: true, unverified: true }
      return await verifyConfirm(payload.booking)
    }
  } catch (e) {
    return { ok: false, error: e?.message || '連線失敗' }
  }
}

// 回頭問腳本：這筆的日曆事件到底建了沒（GET 不會遇到上面那個回應被換掉的問題）
async function verifyConfirm(b) {
  const url = `${GAS_URL}?action=verify&secret=${encodeURIComponent(GAS_SECRET)}`
    + `&id=${encodeURIComponent(b.id)}&start=${encodeURIComponent(b.start)}`
  try {
    const data = JSON.parse(await (await fetch(url)).text())
    return data?.eventId
      ? { ok: true, eventId: data.eventId, recovered: true }
      : { ok: false, error: '日曆上查不到這筆，請自己補一筆' }
  } catch {
    return { ok: false, error: '無法確認日曆狀態，請開 Google 日曆看一下' }
  }
}
