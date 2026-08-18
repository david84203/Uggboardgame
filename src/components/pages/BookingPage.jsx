import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { getLiffProfile } from '../../utils/liff'
import { Calendar, Clock, Users, Home, Minus, Plus, CheckCircle2 } from 'lucide-react'
import {
  generateSlots, todayStr, maxDateStr, validateBooking, createBooking,
  fetchMyBookings, updateBookingStatus, slotLabel, parseSlot, isClosedDay,
  FLOOR_OPTIONS, STATUS_LABEL,
} from '../../utils/booking'
import { syncBooking } from '../../utils/bookingSync'

const MEMBER_KEY = 'ugg_member'

const card = 'bg-white border border-stone-200 rounded-2xl'
const field = 'w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-base text-stone-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition'

function fmtWhen(b) {
  const [, m, d] = b.date.split('-')
  return `${Number(m)}/${Number(d)} ${slotLabel(parseSlot(b.time).min)}`
}

// ── 單筆預約卡片 ─────────────────────────────────────────────────────────────
function BookingItem({ b, onCancel, cancelling }) {
  const s = STATUS_LABEL[b.status] || STATUS_LABEL.pending
  const canCancel = b.status === 'pending' || b.status === 'confirmed'
  return (
    <div className={`${card} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold text-stone-800">{fmtWhen(b)}</div>
          <div className="text-sm text-stone-500 mt-1">
            {b.people} 位 · {b.floor}
            {b.firstVisit && <span className="ml-1 text-orange-500">· 第一次來</span>}
          </div>
          {b.note && <div className="text-xs text-stone-400 mt-1 break-words">備註：{b.note}</div>}
          {b.status === 'declined' && b.reason && (
            <div className="text-xs text-rose-500 mt-1 break-words">店家回覆：{b.reason}</div>
          )}
        </div>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${s.cls}`}>{s.text}</span>
      </div>
      {canCancel && (
        <button
          onClick={() => onCancel(b)}
          disabled={cancelling}
          className="mt-3 w-full py-2 rounded-xl border border-stone-200 text-stone-500 text-sm hover:bg-stone-50 transition disabled:opacity-40"
        >
          {cancelling ? '處理中…' : '取消這筆預約'}
        </button>
      )}
    </div>
  )
}

// ── 主頁面 ───────────────────────────────────────────────────────────────────
export default function BookingPage() {
  const [member, setMember] = useState(() => {
    try { const s = sessionStorage.getItem(MEMBER_KEY); return s ? JSON.parse(s) : null } catch { return null }
  })
  const [lineUserId, setLineUserId] = useState(null)
  const [identifying, setIdentifying] = useState(/Line\//.test(navigator.userAgent))

  const [form, setForm] = useState({
    name: '', phone: '', date: '', time: '',
    people: 2, floor: '不指定', firstVisit: false, note: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)
  const [myBookings, setMyBookings] = useState([])
  const [cancellingId, setCancellingId] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const slots = useMemo(() => generateSlots(form.date), [form.date])

  // 在 LINE 裡開啟時自動認人；已登入會員直接沿用
  useEffect(() => {
    let alive = true
    async function identify() {
      try {
        const profile = await getLiffProfile()
        if (!alive) return
        if (!profile) return
        setLineUserId(profile.userId)
        if (member) return
        const snap = await getDocs(query(collection(db, 'members'), where('lineUserId', '==', profile.userId)))
        if (!snap.empty && alive) setMember({ ...snap.docs[0].data(), id: snap.docs[0].id })
      } catch (e) {
        console.warn('booking identify failed:', e)
      } finally {
        if (alive) setIdentifying(false)
      }
    }
    identify()
    return () => { alive = false }
  }, [])

  // 認出會員後自動帶入姓名電話
  useEffect(() => {
    if (!member || member.isGM) return
    setForm(f => ({ ...f, name: f.name || member.name || '', phone: f.phone || member.phone || '' }))
  }, [member])

  // 載入我的預約
  useEffect(() => {
    if (identifying) return
    let alive = true
    fetchMyBookings({ phone: member?.phone, lineUserId })
      .then(list => { if (alive) setMyBookings(list) })
      .catch(e => console.warn('load my bookings failed:', e))
    return () => { alive = false }
  }, [identifying, member?.phone, lineUserId, done])

  // 換日期時，若原本選的時段已不可用就清掉
  useEffect(() => {
    if (form.time && !slots.some(s => s.value === form.time)) set('time', '')
  }, [slots])

  async function handleSubmit(e) {
    e.preventDefault()
    const msg = validateBooking(form)
    if (msg) { setError(msg); return }
    setError(''); setSubmitting(true)
    try {
      const id = await createBooking({
        ...form,
        memberId: member?.isGM ? null : member?.id || null,
        memberNo: member?.isGM ? null : member?.memberId || null,
        lineUserId,
      })
      // 通知店長有新預約；失敗不影響客人這邊已經送出的結果
      syncBooking('notify', { ...form, id, kind: 'new' }).catch(() => {})
      setDone({ ...form, id })
    } catch (err) {
      setError(`送出失敗：${err?.message || '請稍後再試'}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(b) {
    if (!window.confirm(`確定要取消 ${fmtWhen(b)} 的預約嗎？`)) return
    setCancellingId(b.id)
    try {
      await updateBookingStatus(b.id, 'cancelled', { cancelledAt: new Date().toISOString() })
      if (b.calendarEventId) await syncBooking('cancel', b)
      syncBooking('notify', { ...b, kind: 'cancelled' }).catch(() => {})
      setMyBookings(list => list.map(x => x.id === b.id ? { ...x, status: 'cancelled' } : x))
    } catch (err) {
      alert(`取消失敗：${err?.message || '請稍後再試'}`)
    } finally {
      setCancellingId(null)
    }
  }

  if (identifying) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-stone-400 text-sm">載入中…</p></div>
  }

  // ── 送出完成 ──
  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className={`${card} p-6 text-center`}>
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-stone-800">預約已送出</h2>
          <p className="text-sm text-stone-500 mt-2">
            {fmtWhen(done)} · {done.people} 位 · {done.floor}
          </p>
          <p className="text-sm text-stone-500 mt-3">
            小編確認座位後就會通知你，狀態也可以在下面隨時查看 🎲
          </p>
        </div>

        {!member && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-orange-700">
            💡 還不是烏嘎嘎會員嗎？到店跟櫃台說一聲就能辦，之後預約連姓名電話都不用打，還有等級與消費優惠。
          </div>
        )}

        <button
          onClick={() => { setDone(null); setForm(f => ({ ...f, date: '', time: '', note: '' })) }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-sm shadow-orange-200 hover:opacity-90 transition"
        >
          再預約一筆
        </button>

        {myBookings.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-stone-500">我的預約</div>
            {myBookings.map(b => (
              <BookingItem key={b.id} b={b} onCancel={handleCancel} cancelling={cancellingId === b.id} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── 預約表單 ──
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="text-center">
        <div className="text-3xl mb-2">🎲</div>
        <h2 className="text-xl font-bold text-stone-800">線上預約座位</h2>
        <p className="text-sm text-stone-500 mt-1">營業時間 13:00–24:00（週二店休），選好時段送出即可</p>
      </div>

      {member && !member.isGM && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-sm text-emerald-700">
          👤 已認出你是會員 <strong>{member.name}</strong>，姓名電話幫你填好了
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">姓名</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="請輸入姓名" className={field} style={{ touchAction: 'manipulation' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">手機</label>
            <input type="tel" inputMode="numeric" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="09xxxxxxxx" className={field} style={{ touchAction: 'manipulation' }} />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-stone-600 mb-1.5">
            <Calendar className="w-4 h-4" /> 日期
          </label>
          <input type="date" value={form.date} min={todayStr()} max={maxDateStr()}
            onChange={e => set('date', e.target.value)} className={field} />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-stone-600 mb-1.5">
            <Clock className="w-4 h-4" /> 時間
          </label>
          {!form.date ? (
            <p className="text-sm text-stone-400 px-1">請先選日期</p>
          ) : isClosedDay(form.date) ? (
            <p className="text-sm text-rose-500 px-1">週二店休，請選擇其他日期</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-rose-500 px-1">今天已經來不及線上預約了，請直接私訊小編</p>
          ) : (
            <select value={form.time} onChange={e => set('time', e.target.value)} className={field}>
              <option value="">請選擇時段</option>
              {slots.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          )}
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-stone-600 mb-1.5">
            <Users className="w-4 h-4" /> 人數
          </label>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => set('people', Math.max(1, form.people - 1))}
              className="w-11 h-11 rounded-2xl border border-stone-200 flex items-center justify-center text-stone-600 active:scale-95 transition">
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-2xl font-bold text-stone-800 w-12 text-center">{form.people}</span>
            <button type="button" onClick={() => set('people', Math.min(40, form.people + 1))}
              className="w-11 h-11 rounded-2xl border border-stone-200 flex items-center justify-center text-stone-600 active:scale-95 transition">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {form.people >= 10 && (
            <p className="text-xs text-orange-500 mt-2">人數較多，小編會幫你安排併桌或包場，確認後回覆你</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-stone-600 mb-1.5">
            <Home className="w-4 h-4" /> 樓層偏好
          </label>
          <select value={form.floor} onChange={e => set('floor', e.target.value)} className={field}>
            {FLOOR_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-stone-200 cursor-pointer">
          <input type="checkbox" checked={form.firstVisit} onChange={e => set('firstVisit', e.target.checked)}
            className="w-5 h-5 accent-orange-500" />
          <span className="text-sm text-stone-700">第一次來烏嘎嘎（小編會多介紹一下）</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">備註</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={3}
            placeholder="想玩的遊戲、慶生、需要教學…（可留空）" className={`${field} resize-none`} />
        </div>

        {error && <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl py-2 px-4">{error}</p>}

        <button type="submit" disabled={submitting}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-base shadow-sm shadow-orange-200 hover:opacity-90 transition disabled:opacity-40">
          {submitting ? '送出中…' : '送出預約'}
        </button>
        <p className="text-xs text-stone-400 text-center">
          送出後由小編確認座位，最晚可預約 23:00，可預約兩個月內的日期
        </p>
      </form>

      {myBookings.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="text-sm font-bold text-stone-500">我的預約</div>
          {myBookings.map(b => (
            <BookingItem key={b.id} b={b} onCancel={handleCancel} cancelling={cancellingId === b.id} />
          ))}
        </div>
      )}
    </div>
  )
}
