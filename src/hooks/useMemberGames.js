import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, getDocs, setDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function useMemberGames(memberId) {
  const [memberGames, setMemberGames] = useState([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!memberId) { setMemberGames([]); return }
    setLoading(true)
    try {
      const q = query(collection(db, 'member_games'), where('memberId', '==', memberId))
      const snap = await getDocs(q)
      setMemberGames(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error('useMemberGames:', e)
    } finally {
      setLoading(false)
    }
  }, [memberId])

  useEffect(() => { fetch() }, [fetch])

  const getRecord = (gameId) => memberGames.find(g => g.gameId === gameId) || null
  const getStatus = (gameId) => getRecord(gameId)?.status || null

  async function toggleStatus(game, status) {
    const existing = getRecord(game.id)
    try {
      if (existing) {
        if (existing.status === status) {
          await deleteDoc(doc(db, 'member_games', existing.id))
          setMemberGames(prev => prev.filter(g => g.id !== existing.id))
        } else {
          await updateDoc(doc(db, 'member_games', existing.id), { status })
          setMemberGames(prev => prev.map(g => g.id === existing.id ? { ...g, status } : g))
        }
      } else {
        // 不含 rating/review，merge 時才不會蓋掉另一台裝置已寫入的評分
        const data = {
          memberId, gameId: game.id, gameName: game.name,
          gameCategory: game.category || '', gameTags: game.tags || [],
          status, createdAt: new Date().toISOString(),
        }
        // 固定文件 ID：同一會員＋同一遊戲只會有一筆，兩台裝置同時寫不會重複
        const docId = `${memberId}_${game.id}`
        await setDoc(doc(db, 'member_games', docId), data, { merge: true })
        setMemberGames(prev => [...prev, { id: docId, rating: null, review: '', ...data }])
      }
    } catch (e) {
      console.error('toggleStatus:', e)
      alert('儲存失敗，請檢查網路後再試一次')
    }
  }

  async function updateRating(gameId, rating) {
    const existing = getRecord(gameId)
    if (!existing) return
    try {
      await updateDoc(doc(db, 'member_games', existing.id), { rating })
      setMemberGames(prev => prev.map(g => g.id === existing.id ? { ...g, rating } : g))
    } catch (e) {
      console.error('updateRating:', e)
      alert('評分儲存失敗，請檢查網路後再試一次')
    }
  }

  return { memberGames, loading, getStatus, getRecord, toggleStatus, updateRating }
}
