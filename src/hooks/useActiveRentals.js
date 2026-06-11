import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function useActiveRentals() {
  const [rentedById, setRentedById] = useState(new Map())
  const [rentedByName, setRentedByName] = useState(new Map())

  useEffect(() => {
    const q = query(collection(db, 'rentals'), where('status', '==', 'rented'))
    return onSnapshot(q, snap => {
      const byId = new Map()
      const byName = new Map()
      snap.docs.forEach(d => {
        const data = d.data()
        ;(data.games || []).forEach(g => {
          if (g.gameId) byId.set(g.gameId, data.returnDate || '')
          if (g.gameName) byName.set(g.gameName.trim(), data.returnDate || '')
        })
      })
      setRentedById(byId)
      setRentedByName(byName)
    })
  }, [])

  function isRented(game) {
    return rentedById.has(game.id) || rentedByName.has(game.name)
  }

  function getRentalInfo(game) {
    if (rentedById.has(game.id)) return { rented: true, returnDate: rentedById.get(game.id) }
    if (rentedByName.has(game.name)) return { rented: true, returnDate: rentedByName.get(game.name) }
    return { rented: false, returnDate: '' }
  }

  return { isRented, getRentalInfo }
}
