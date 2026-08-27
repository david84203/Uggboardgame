import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

/** 手機正規化：只留數字，避免 09xx-xxx-xxx 這類寫法對不起來 */
export const normPhone = (p) => String(p || '').replace(/\D/g, '')

/**
 * 店員身分判定
 * 名單直接沿用排班表的 schedule_staff（改排班名單＝改店員名單，不維護兩份）
 * 手機對得到 → 店員模式；會員以 GM 登入 → 管理員模式
 */
export default function useStaffProfile(member) {
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'schedule_staff'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
        setStaffList(list)
        setLoading(false)
      },
      (err) => {
        console.warn('讀取店員名單失敗:', err)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  const isOwner = !!member?.isGM
  const phone = normPhone(member?.phone)
  const staff = phone
    ? staffList.find((s) => normPhone(s.phone) && normPhone(s.phone) === phone) || null
    : null

  return { staffList, staff, isStaff: !!staff, isOwner, loading }
}
