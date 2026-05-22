import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function useActiveRentals() {
  const [rentedGameIds, setRentedGameIds] = useState(new Set())
  const [rentedGameNames, setRentedGameNames] = useState(new Set())

  useEffect(() => {
    const q = query(collection(db, 'rentals'), where('status', '==', 'rented'))
    return onSnapshot(q, snap => {
      const ids = new Set()
      const names = new Set()
      snap.docs.forEach(d => {
        const data = d.data()
        ;(data.games || []).forEach(g => {
          if (g.gameId) ids.add(g.gameId)
          if (g.gameName) names.add(g.gameName.trim())
        })
      })
      setRentedGameIds(ids)
      setRentedGameNames(names)
    })
  }, [])

  function isRented(game) {
    return rentedGameIds.has(game.id) || rentedGameNames.has(game.name)
  }

  return { isRented }
}
