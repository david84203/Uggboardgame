import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

/** 手機正規化：只留數字 */
export const normPhone = (p) => String(p || '').replace(/\D/g, '')

/**
 * 店員身分物件
 * 店員不一定是會員，所以另外做一個「不是會員」的登入身分。
 * isStaffOnly = true 代表這個人只有店員身分，沒有會員資料。
 */
export function toStaffIdentity(id, data) {
  return {
    id: `staff-${id}`,
    staffId: id,
    name: data.name || '',
    phone: data.phone || '',
    color: data.color || 'orange',
    isStaffOnly: true,
  }
}

/** 用手機找店員（名單就是排班表的 schedule_staff） */
export async function findStaffByPhone(phone) {
  const target = normPhone(phone)
  if (!target) return null
  const snap = await getDocs(collection(db, 'schedule_staff'))
  const hit = snap.docs.find((d) => {
    const p = normPhone(d.data().phone)
    return p && p === target
  })
  return hit ? toStaffIdentity(hit.id, hit.data()) : null
}

/** 用 LINE userId 找已綁定的店員（回訪自動登入） */
export async function findStaffByLineUserId(lineUserId) {
  if (!lineUserId) return null
  const snap = await getDocs(query(collection(db, 'schedule_staff'), where('lineUserId', '==', lineUserId)))
  if (snap.empty) return null
  return toStaffIdentity(snap.docs[0].id, snap.docs[0].data())
}

/** 綁定 LINE 帳號到店員 */
export async function bindStaffLine(staffId, lineUserId) {
  if (!staffId || !lineUserId) return
  await updateDoc(doc(db, 'schedule_staff', staffId), { lineUserId })
}
