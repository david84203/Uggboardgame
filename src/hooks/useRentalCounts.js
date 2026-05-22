import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function useRentalCounts() {
  const [byId, setById] = useState({})
  const [byName, setByName] = useState({})

  useEffect(() => {
    return onSnapshot(collection(db, 'rentals'), snap => {
      const idMap = {}
      const nameMap = {}
      snap.docs.forEach(d => {
        const games = d.data().games || []
        games.forEach(g => {
          if (g.gameId != null) {
            idMap[g.gameId] = (idMap[g.gameId] || 0) + 1
          } else if (g.gameName) {
            const key = g.gameName.trim()
            nameMap[key] = (nameMap[key] || 0) + 1
          }
        })
      })
      setById(idMap)
      setByName(nameMap)
    })
  }, [])

  function getRentalCount(gameId, gameName) {
    return (byId[gameId] || 0) + (byName[gameName?.trim()] || 0)
  }

  return { getRentalCount }
}
