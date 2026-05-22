import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

function buildMaps(docs, idMap, nameMap) {
  docs.forEach(d => {
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
}

export default function useRentalCounts() {
  const [byId, setById] = useState({})
  const [byName, setByName] = useState({})

  useEffect(() => {
    const idMap = {}
    const nameMap = {}
    let rentedSnap = null
    let returnedSnap = null

    function merge() {
      const combined = {}
      const combinedName = {}
      if (rentedSnap) buildMaps(rentedSnap, combined, combinedName)
      if (returnedSnap) buildMaps(returnedSnap, combined, combinedName)
      setById({ ...combined })
      setByName({ ...combinedName })
    }

    const q1 = query(collection(db, 'rentals'), where('status', '==', 'rented'))
    const q2 = query(collection(db, 'rentals'), where('status', '==', 'returned'))

    const unsub1 = onSnapshot(q1, snap => { rentedSnap = snap.docs; merge() }, err => console.error('rentals rented:', err))
    const unsub2 = onSnapshot(q2, snap => { returnedSnap = snap.docs; merge() }, err => console.error('rentals returned:', err))

    return () => { unsub1(); unsub2() }
  }, [])

  function getRentalCount(gameId, gameName) {
    return (byId[gameId] || 0) + (byName[gameName?.trim()] || 0)
  }

  return { getRentalCount }
}
