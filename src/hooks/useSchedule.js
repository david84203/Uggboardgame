import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

const pad2 = (n) => String(n).padStart(2, '0')
const today = () => {
  const n = new Date()
  return `${n.getFullYear()}-${pad2(n.getMonth() + 1)}-${pad2(n.getDate())}`
}

/**
 * 某位店員接下來的班（會跨月，店員最想知道的就是「我下次哪天上班」）
 * ⚠️ 不用 where(staffId) + where(date) + orderBy 的組合查詢，那要另建複合索引；
 *    改成只按日期撈近期班表再在前端挑人，資料量小不划算為它建索引。
 */
export function useUpcomingShifts(staffId, take = 3) {
  const [list, setList] = useState([])

  useEffect(() => {
    if (!staffId) { setList([]); return }
    const q = query(
      collection(db, 'schedule_shifts'),
      where('date', '>=', today()),
      orderBy('date'),
      limit(120)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setList(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((s) => s.staffId === staffId)
            .slice(0, take)
        )
      },
      (err) => console.warn('讀取近期班表失敗:', err)
    )
    return unsub
  }, [staffId, take])

  return list
}

/**
 * 讀某個月的排班（與入場系統 ugg-suite 的排班分頁同一份資料，不做同步）
 * @param {string} ym 'YYYY-MM'
 */
export default function useSchedule(ym) {
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ym) return
    setLoading(true)
    const q = query(
      collection(db, 'schedule_shifts'),
      where('date', '>=', `${ym}-01`),
      where('date', '<=', `${ym}-31`)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setShifts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.warn('讀取排班失敗:', err)
        setLoading(false)
      }
    )
    return unsub
  }, [ym])

  return { shifts, loading }
}
