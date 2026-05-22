import { useState, useEffect } from 'react'
import { collection, addDoc, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

export async function uploadScorecard(data) {
  return addDoc(collection(db, 'scorecards'), {
    ...data,
    submittedAt: Timestamp.now(),
  })
}

export function useGameLeaderboard(gameName) {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gameName) { setLoading(false); return }
    const q = query(collection(db, 'scorecards'), where('gameName', '==', gameName))
    return onSnapshot(q, snap => {
      const entries = []
      snap.docs.forEach(d => {
        const data = d.data()
        ;(data.players || []).forEach(p => {
          entries.push({
            playerName: p.name,
            total: p.total,
            categories: p.categories || null,
            source: data.source,
            submittedAt: data.submittedAt,
          })
        })
      })
      entries.sort((a, b) => b.total - a.total)
      setLeaderboard(entries.slice(0, 10))
      setLoading(false)
    })
  }, [gameName])

  return { leaderboard, loading }
}
