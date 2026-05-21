import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
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
        const data = {
          memberId, gameId: game.id, gameName: game.name,
          gameCategory: game.category || '', gameTags: game.tags || [],
          status, rating: null, review: '', createdAt: new Date().toISOString(),
        }
        const ref = await addDoc(collection(db, 'member_games'), data)
        setMemberGames(prev => [...prev, { id: ref.id, ...data }])
      }
    } catch (e) {
      console.error('toggleStatus:', e)
    }
  }

  async function updateRating(gameId, rating) {
    const existing = getRecord(gameId)
    if (!existing) return
    await updateDoc(doc(db, 'member_games', existing.id), { rating })
    setMemberGames(prev => prev.map(g => g.id === existing.id ? { ...g, rating } : g))
  }

  return { memberGames, loading, getStatus, getRecord, toggleStatus, updateRating }
}
