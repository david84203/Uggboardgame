import { useState, useEffect, useCallback } from 'react'
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * 店員遊戲熟練度
 *
 * 兩層獨立狀態：
 *   selfLearned = 店員自己勾「我學會了」
 *   verified    = 老闆驗證過「他真的會」
 * 兩個互不覆蓋，所以看得出「他以為他會」跟「他真的會」的差距。
 *
 * ⚠️ 鍵用遊戲「中文名稱」不用 Sheet 行號 —— 行號會因為插列刪列而整批位移，
 *    用行號當鍵會讓所有學習紀錄靜默錯位。
 */

const COL = 'staff_skills'

/** doc id 不能含 '/'，換成全形；原始名稱另存在 gameName 欄位，反查一律用欄位不解析 id */
const skillDocId = (staffId, gameName) => `${staffId}__${String(gameName).replace(/\//g, '／')}`
const mapKey = (staffId, gameName) => `${staffId}::${gameName}`

export default function useStaffSkills() {
  const [skills, setSkills] = useState({})   // key: "staffId::遊戲名" → { selfLearned, verified, ... }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, COL),
      (snap) => {
        const next = {}
        snap.docs.forEach((d) => {
          const v = d.data()
          if (!v.staffId || !v.gameName) return
          next[mapKey(v.staffId, v.gameName)] = v
        })
        setSkills(next)
        setLoading(false)
      },
      (err) => {
        console.warn('讀取店員熟練度失敗:', err)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  const getSkill = useCallback(
    (staffId, gameName) => skills[mapKey(staffId, gameName)] || null,
    [skills]
  )

  /** 狀態：none（未學）→ self（自評學會，待驗證）→ verified（老闆驗證過） */
  const getStatus = useCallback(
    (staffId, gameName) => {
      const s = skills[mapKey(staffId, gameName)]
      if (!s) return 'none'
      if (s.verified) return 'verified'
      if (s.selfLearned) return 'self'
      return 'none'
    },
    [skills]
  )

  /** 店員自評：切換「我學會了」 */
  const toggleSelf = useCallback(async (staff, gameName) => {
    const cur = skills[mapKey(staff.id, gameName)]
    const next = !cur?.selfLearned
    await setDoc(
      doc(db, COL, skillDocId(staff.id, gameName)),
      {
        staffId: staff.id,
        staffName: staff.name || '',
        gameName,
        selfLearned: next,
        selfLearnedAt: next ? serverTimestamp() : null,
        // 取消自評時連驗證一起收回，避免出現「沒學過卻已驗證」的狀態
        ...(next ? {} : { verified: false, verifiedAt: null }),
      },
      { merge: true }
    )
  }, [skills])

  /** 老闆驗證：切換「他真的會」 */
  const toggleVerified = useCallback(async (staff, gameName, verifiedBy = 'GM') => {
    const cur = skills[mapKey(staff.id, gameName)]
    const next = !cur?.verified
    await setDoc(
      doc(db, COL, skillDocId(staff.id, gameName)),
      {
        staffId: staff.id,
        staffName: staff.name || '',
        gameName,
        verified: next,
        verifiedAt: next ? serverTimestamp() : null,
        verifiedBy: next ? verifiedBy : null,
        // 老闆直接認證等於也承認他學過
        ...(next ? { selfLearned: true } : {}),
      },
      { merge: true }
    )
  }, [skills])

  return { skills, loading, getSkill, getStatus, toggleSelf, toggleVerified }
}
