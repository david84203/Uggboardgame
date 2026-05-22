import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function useRentalCounts() {
  const [countsMap, setCountsMap] = useState({})

  useEffect(() => {
    return onSnapshot(collection(db, 'rentals'), snap => {
      const map = {}
      snap.docs.forEach(d => {
        const games = d.data().games || []
        games.forEach(g => {
          if (g.gameId != null) {
            map[g.gameId] = (map[g.gameId] || 0) + 1
          }
        })
      })
      setCountsMap(map)
    })
  }, [])

  function getRentalCount(gameId) {
    return countsMap[gameId] || 0
  }

  return { getRentalCount }
}
