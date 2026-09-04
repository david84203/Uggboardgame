import { useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { DUTIES, OPENING_CASH, getBusinessDate } from '../utils/duties'

/**
 * 值班工作清單（一天一份）
 * collection: shift_duties，doc id = 營業日字串（getBusinessDate）
 *
 * ⚠️ 跨系統契約：doc 結構（欄位名稱）與入場系統共用，不要改欄位名。
 *    closedAt 由入場系統寫，這裡不動它。
 */

const COL = 'shift_duties'

export default function useShiftDuties(staff) {
  const [date] = useState(() => getBusinessDate())
  const [duties, setDuties] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, COL, date),
      (snap) => {
        setDuties(snap.exists() ? snap.data() : null)
        setLoading(false)
      },
      (err) => {
        console.warn('讀取值班工作失敗:', err)
        setLoading(false)
      }
    )
    return unsub
  }, [date])

  /** 開班：點錢（點不對不擋，只記差額），寫入當日清單快照 */
  const openShift = useCallback(async ({ drawer, deposit, depositExpected }) => {
    const drawerOk = drawer === OPENING_CASH
    const depositOk = depositExpected == null ? false : deposit === depositExpected
    const depositDiff = depositExpected == null ? null : deposit - depositExpected

    await setDoc(
      doc(db, COL, date),
      {
        date,
        staffId: staff?.id || '',
        staffName: staff?.name || '',
        openedAt: serverTimestamp(),
        openCount: {
          drawer,
          drawerOk,
          drawerDiff: drawer - OPENING_CASH,
          deposit,
          depositOk,
          depositDiff,
        },
        taskList: DUTIES,
      },
      { merge: true }
    )
  }, [date, staff])

  /** 切換單項打勾 */
  const toggleTask = useCallback(async (taskId) => {
    const cur = duties?.tasks?.[taskId]
    const next = !cur?.done
    await setDoc(
      doc(db, COL, date),
      {
        tasks: {
          [taskId]: { done: next, at: next ? serverTimestamp() : null, skipped: false },
        },
      },
      { merge: true }
    )
  }, [date, duties])

  /** 「今天不用」：只有 skippable 的項目可用 */
  const skipTask = useCallback(async (taskId) => {
    const task = DUTIES.find((d) => d.id === taskId)
    if (!task?.skippable) return
    await setDoc(
      doc(db, COL, date),
      {
        tasks: {
          [taskId]: { done: false, at: null, skipped: true },
        },
      },
      { merge: true }
    )
  }, [date])

  return { duties, loading, openShift, toggleTask, skipTask }
}
