import { useState, useEffect, useCallback, useMemo } from 'react'
import { CalendarCheck, RefreshCw, AlertTriangle, Lock, Plus, X } from 'lucide-react'
import {
  fetchBookingsForAdmin, updateBookingStatus, slotLabel, parseSlot, STATUS_LABEL,
  createBooking, validateBooking, generateSlots, todayStr, maxDateStr, FLOOR_OPTIONS,
} from '../../utils/booking'
import { syncBooking, isSyncConfigured } from '../../utils/bookingSync'
import { getLiffProfile } from '../../utils/liff'

// 店長本人的 LINE userId：從 LINE 通知點進來時免打 GM 直接放行
const OWNER_LINE_ID = import.meta.env.VITE_OWNER_LINE_ID || ''

const card = 'bg-white border border-stone-200 rounded-2xl'
const field = 'w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-base text-stone-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition'

function whenText(b) {
  const [, m, d] = b.date.split('-')
  const w = ['日', '一', '二', '三', '四', '五', '六'][new Date(b.date).getDay()]
  return `${Number(m)}/${Number(d)}（${w}） ${slotLabel(parseSlot(b.time).min)}`
}

// 發 LINE 給預約客人。API 在 ugg-suite 那個站（LINE 金鑰只設在那邊），
// 只吃 bookingId，由後端自己查 lineUserId，前端指定不了任意對象。
const SEND_LINE_API = 'https://ugg-suite.vercel.app/api/send-line'

function noShowTemplate(b) {
  return `您好，這裡是烏嘎嘎桌遊 🎲
${whenText(b)} 的 ${b.people} 人預約，時間到了還沒看到您們，剛才有撥電話但沒接通，想確認一下是不是路上遇到狀況了？

方便的話回覆我們一下：
1. 還會來，大概幾點到
2. 今天沒辦法來，要取消

桌子我們先幫您保留 1 小時，超過的話因為現場有其他客人在等，可能就要先釋出了。麻煩您回覆一下，謝謝！`
}

function SendLineBox({ b }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState('')

  // 手動補登的預約沒有 lineUserId，發不了，直接講清楚免得店長乾等
  if (!b.lineUserId) {
    return <div className="text-xs text-stone-400">此預約沒有 LINE（手動補登的），只能打電話</div>
  }

  async function send() {
    if (!text.trim() || sending) return
    setSending(true); setResult('')
    try {
      const r = await fetch(SEND_LINE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: b.id, text }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) throw new Error(j.error || `發送失敗（${r.status}）`)
      setResult('✅ 已送出')
      setText('')
    } catch (e) {
      setResult(`❌ ${e.message}`)
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-xs text-emerald-600 underline underline-offset-2 hover:text-emerald-700">
        💬 發 LINE 給客人
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-xl bg-emerald-50/60 border border-emerald-100 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-emerald-700">發 LINE 給 {b.name}</span>
        <button onClick={() => { setOpen(false); setResult('') }} className="text-stone-400 hover:text-stone-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      <button onClick={() => setText(noShowTemplate(b))}
        className="text-xs px-2.5 py-1 rounded-full border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50">
        帶入「沒出現」詢問範本
      </button>
      <textarea rows={4} value={text} onChange={e => setText(e.target.value)}
        placeholder="想跟客人說的話…"
        className={`${field} resize-y`} />
      <div className="flex items-center gap-2">
        <button onClick={send} disabled={sending || !text.trim()}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40">
          {sending ? '傳送中…' : '送出'}
        </button>
        {result && <span className="text-xs text-stone-600">{result}</span>}
      </div>
    </div>
  )
}

function Row({ b, busy, onConfirm, onDecline, onCancel }) {
  const s = STATUS_LABEL[b.status] || STATUS_LABEL.pending
  return (
    <div className={`${card} p-4 space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold text-stone-800">{whenText(b)}</div>
          <div className="text-sm text-stone-600 mt-1">
            <strong>{b.people} 位</strong> · {b.floor}
            {b.firstVisit && <span className="ml-1 text-orange-500">· 🆕 第一次來</span>}
          </div>
          <div className="text-sm text-stone-500 mt-1">
            {b.name}
            <a href={`tel:${b.phone}`} className="text-blue-500 ml-2 underline">{b.phone}</a>
            {b.memberNo && <span className="text-stone-400 ml-2">會員 #{b.memberNo}</span>}
            {!b.memberId && <span className="text-stone-400 ml-2">非會員</span>}
          </div>
          {b.note && <div className="text-sm text-stone-500 mt-1 break-words bg-stone-50 rounded-xl px-3 py-2">備註：{b.note}</div>}
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${s.cls}`}>{s.text}</span>
      </div>

      {b.status === 'pending' && (
        <div className="flex gap-2">
          <button onClick={() => onConfirm(b)} disabled={busy}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-40">
            {busy ? '處理中…' : '✅ 確認預約'}
          </button>
          <button onClick={() => onDecline(b)} disabled={busy}
            className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-500 text-sm hover:bg-stone-50 transition disabled:opacity-40">
            婉拒
          </button>
        </div>
      )}

      {b.status === 'confirmed' && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-stone-400">
            {b.calendarEventId ? '📅 已寫入 Google 日曆' : '⚠️ 未同步日曆'}
          </span>
          <button onClick={() => onCancel(b)} disabled={busy}
            className="px-4 py-2 rounded-xl border border-stone-200 text-stone-500 text-sm hover:bg-stone-50 transition disabled:opacity-40">
            取消預約
          </button>
        </div>
      )}

      {(b.status === 'pending' || b.status === 'confirmed') && <SendLineBox b={b} />}
    </div>
  )
}

// ── 手動新增：客人直接在 LINE 聊天室講的預約，店長自己補一筆 ─────────────────
// 店長會這樣填就代表已經答應了，所以送出後直接標為已確認並寫進 Google 日曆
function NewBookingForm({ onDone, onClose }) {
  const [form, setForm] = useState({
    name: '', phone: '', date: '', time: '',
    people: 2, floor: '不指定', firstVisit: false, note: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const slots = useMemo(() => generateSlots(form.date), [form.date])

  // 換日期時，若原本選的時段已不可用就清掉
  useEffect(() => {
    if (form.time && !slots.some(s => s.value === form.time)) set('time', '')
  }, [slots])

  async function handleSubmit(e) {
    e.preventDefault()
    const msg = validateBooking(form)
    if (msg) { setError(msg); return }
    setError(''); setSaving(true)
    const data = { ...form, people: Number(form.people) }
    try {
      const id = await createBooking(data, { remember: false })
      const res = await syncBooking('confirm', { ...data, id })
      await updateBookingStatus(id, 'confirmed', {
        confirmedAt: new Date().toISOString(),
        calendarEventId: res?.eventId || null,
        source: 'admin',
      })
      onDone(res?.ok
        ? '已新增，並寫進 Google 日曆 ✅'
        : res?.skipped
          ? '已新增，但日曆尚未連線，請自己補行程'
          : `已新增，但日曆寫入失敗：${res?.error || '未知錯誤'}`)
    } catch (err) {
      setError(`新增失敗：${err?.message || '請稍後再試'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${card} p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-stone-600">手動新增預約</div>
        <button type="button" onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input className={field} placeholder="姓名" value={form.name} onChange={e => set('name', e.target.value)} />
        <input className={field} placeholder="手機（必填，09 開頭 10 碼）" inputMode="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
        <input className={field} type="date" min={todayStr()} max={maxDateStr()} value={form.date} onChange={e => set('date', e.target.value)} />
        <select className={field} value={form.time} onChange={e => set('time', e.target.value)} disabled={!form.date}>
          <option value="">{form.date ? '選時間' : '先選日期'}</option>
          {slots.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input className={field} type="number" min="1" max="60" value={form.people}
          onChange={e => set('people', e.target.value)} placeholder="人數" />
        <select className={field} value={form.floor} onChange={e => set('floor', e.target.value)}>
          {FLOOR_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <input className={field} placeholder="備註（例如：人數暫定）" value={form.note} onChange={e => set('note', e.target.value)} />

      <label className="flex items-center gap-2 text-sm text-stone-500">
        <input type="checkbox" checked={form.firstVisit} onChange={e => set('firstVisit', e.target.checked)} />
        第一次來
      </label>

      {error && <div className="text-sm text-rose-500">{error}</div>}

      <button type="submit" disabled={saving}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-40">
        {saving ? '處理中…' : '新增並確認'}
      </button>
      <p className="text-xs text-stone-400">
        會直接寫進 Google 日曆。客人不是從 APP 預約的，不會收到 LINE 確認訊息，記得自己在聊天室回他。
      </p>
    </form>
  )
}

export default function BookingAdminPage({ onNavigate }) {
  const [data, setData] = useState({ pending: [], upcoming: [] })
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState('')
  const [adding, setAdding] = useState(false)

  // 守門：已用 GM 登入，或在 LINE 裡以店長本人身分開啟
  const [authed, setAuthed] = useState(() => {
    try { return !!JSON.parse(sessionStorage.getItem('ugg_member') || 'null')?.isGM } catch { return false }
  })
  const [checking, setChecking] = useState(() => {
    try { return !JSON.parse(sessionStorage.getItem('ugg_member') || 'null')?.isGM } catch { return true }
  })

  useEffect(() => {
    if (authed) { setChecking(false); return }
    let alive = true
    getLiffProfile()
      .then(p => { if (alive && OWNER_LINE_ID && p?.userId === OWNER_LINE_ID) setAuthed(true) })
      .catch(() => {})
      .finally(() => { if (alive) setChecking(false) })
    return () => { alive = false }
  }, [authed])

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await fetchBookingsForAdmin()) }
    catch (e) { setToast(`讀取失敗：${e?.message || ''}`) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (authed) load() }, [load, authed])

  async function handleConfirm(b) {
    setBusyId(b.id); setToast('')
    try {
      const res = await syncBooking('confirm', b)
      await updateBookingStatus(b.id, 'confirmed', {
        confirmedAt: new Date().toISOString(),
        calendarEventId: res?.eventId || null,
      })
      if (!res?.ok) {
        setToast(res?.skipped
          ? '已確認，但日曆尚未連線，請自己在 Google 日曆補一筆'
          : `已確認，但日曆／通知失敗：${res?.error || '未知錯誤'}`)
      } else {
        setToast('已確認，日曆與通知都送出了 ✅')
      }
      await load()
    } catch (e) {
      setToast(`確認失敗：${e?.message || '請稍後再試'}`)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDecline(b) {
    const reason = window.prompt('要跟客人說什麼？（會一起發給他）', '這個時段已經滿了，方便改其他時間嗎？')
    if (reason === null) return
    setBusyId(b.id)
    try {
      await updateBookingStatus(b.id, 'declined', { reason, declinedAt: new Date().toISOString() })
      await syncBooking('decline', { ...b, reason })
      setToast('已婉拒並通知客人')
      await load()
    } catch (e) {
      setToast(`操作失敗：${e?.message || ''}`)
    } finally { setBusyId(null) }
  }

  async function handleCancel(b) {
    if (!window.confirm(`確定取消 ${b.name} ${whenText(b)} 的預約嗎？`)) return
    setBusyId(b.id)
    try {
      await updateBookingStatus(b.id, 'cancelled', { cancelledAt: new Date().toISOString() })
      await syncBooking('cancel', b)
      setToast('已取消，日曆行程也一併移除')
      await load()
    } catch (e) {
      setToast(`取消失敗：${e?.message || ''}`)
    } finally { setBusyId(null) }
  }

  if (checking) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-stone-400 text-sm">確認身分中…</p></div>
  }

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <Lock className="w-10 h-10 text-stone-300 mb-3" strokeWidth={1.5} />
        <h2 className="text-lg font-bold text-stone-700">這是店家管理頁面</h2>
        <p className="text-sm text-stone-500 mt-2">請先到會員專區，姓名輸入 GM 登入</p>
        {onNavigate && (
          <button onClick={() => onNavigate('member')}
            className="mt-5 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-sm shadow-orange-200 hover:opacity-90 transition">
            前往會員專區
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-orange-500" /> 預約管理
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => { setAdding(a => !a); setToast('') }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm font-bold hover:bg-stone-50 transition">
            <Plus className="w-4 h-4" /> 手動新增
          </button>
          <button onClick={load} disabled={loading}
            className="p-2 rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 transition disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {adding && (
        <NewBookingForm
          onClose={() => setAdding(false)}
          onDone={msg => { setAdding(false); setToast(msg); load() }}
        />
      )}

      {!isSyncConfigured() && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>尚未連上 Google 日曆（缺 VITE_GAS_BOOKING_URL），確認預約仍可用，但要自己補行程。</span>
        </div>
      )}

      {toast && (
        <div className="bg-stone-800 text-white text-sm rounded-2xl px-4 py-3">{toast}</div>
      )}

      <section className="space-y-3">
        <div className="text-sm font-bold text-stone-500">
          待確認 {data.pending.length > 0 && <span className="text-orange-500">（{data.pending.length}）</span>}
        </div>
        {loading ? <p className="text-sm text-stone-400 text-center py-4">讀取中…</p>
          : data.pending.length === 0 ? <p className="text-sm text-stone-300 text-center py-4">目前沒有待確認的預約</p>
          : data.pending.map(b => (
              <Row key={b.id} b={b} busy={busyId === b.id}
                onConfirm={handleConfirm} onDecline={handleDecline} onCancel={handleCancel} />
            ))}
      </section>

      <section className="space-y-3">
        <div className="text-sm font-bold text-stone-500">已確認的未來預約（{data.upcoming.length}）</div>
        {data.upcoming.length === 0
          ? <p className="text-sm text-stone-300 text-center py-4">還沒有已確認的預約</p>
          : data.upcoming.map(b => (
              <Row key={b.id} b={b} busy={busyId === b.id}
                onConfirm={handleConfirm} onDecline={handleDecline} onCancel={handleCancel} />
            ))}
      </section>
    </div>
  )
}
