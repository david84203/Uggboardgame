import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getBusinessDate } from '../utils/duties'

// 只有現金會影響押金盒／抽屜。
// 原樣移植自 ugg-suite/src/apps/entry/utils/payment.js:45-47（isCash）—— 該 repo 唯讀，不可修改，故在此複製一份。
function isCash(payMethod) {
  return payMethod === 'cash'
}

/**
 * 押金盒「應有金額」＝進行中租借的押金加總 ＋ 今天歸還租借的進出盒差額。
 * 沒有現成文件可讀，即時從 rentals collection 重算，演算法與欄位比對皆以
 * ugg-suite（唯讀，不可修改）原始碼為準：
 *   - 算式：ugg-suite/src/apps/entry/pages/Shift.jsx:102-118
 *   - activeRentals（進行中）：rentals where status == 'rented'，無其他篩選
 *     （ugg-suite/src/apps/entry/hooks/useRentals.js:41-49）
 *   - returnedToday（今天歸還）：rentals where returnedBusinessDate == 今天營業日
 *     （ugg-suite/src/apps/entry/hooks/useRentals.js:34-39；欄位刻意不叫 returnedDate，
 *     避免跟既有的 returnDate「應還日期」只差一個字混淆）
 *
 * 只讀，不寫回 rentals；讀取失敗或還沒讀到時一律回 expected: null，不猜、不回 0
 * ——回 0 會讓工讀生誤以為押金盒短少一大筆錢。
 */
export function useDepositExpected() {
  const [active, setActive] = useState(null)   // null = 尚未讀到
  const [returned, setReturned] = useState(null)
  const [error, setError] = useState(false)
  const today = getBusinessDate()

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'rentals'), where('status', '==', 'rented')),
      (snap) => setActive(snap.docs.map((d) => d.data())),
      (err) => {
        console.warn('讀取進行中租借失敗:', err)
        setError(true)
      }
    )
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'rentals'), where('returnedBusinessDate', '==', today)),
      (snap) => setReturned(snap.docs.map((d) => d.data())),
      (err) => {
        console.warn('讀取今日歸還租借失敗:', err)
        setError(true)
      }
    )
    return unsub
  }, [today])

  if (error) return { expected: null, loading: false }

  const loading = active === null || returned === null
  if (loading) return { expected: null, loading: true }

  const depositBoxExpected = active
    .filter((r) => r.depositPayMethod == null || isCash(r.depositPayMethod))
    .reduce((sum, r) => sum + (r.totalPrice || 0), 0)

  const depositAdjust = returned.reduce((sum, r) => {
    const intoBox = (r.depositPayMethod == null || isCash(r.depositPayMethod)) ? (r.totalPrice || 0) : 0
    const outOfBox = isCash(r.refundPayMethod) ? (r.depositRefund || 0) : 0
    return sum + intoBox - outOfBox
  }, 0)

  return { expected: depositBoxExpected + depositAdjust, loading: false }
}
