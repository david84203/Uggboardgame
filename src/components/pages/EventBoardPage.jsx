import { useState, useEffect, useMemo, useRef } from 'react'
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { Calendar, ChevronRight, ChevronDown, ChevronUp, Search, List, Boxes, X, Check, SlidersHorizontal } from 'lucide-react'
import GameCard from '../GameCard'

const TYPE_CONFIG = {
  tournament: { label: '比賽', color: 'bg-red-50 text-red-600 border-red-100' },
  new_game:   { label: '新遊戲', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  promo:      { label: '優惠', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  other:      { label: '公告', color: 'bg-blue-50 text-blue-600 border-blue-100' },
}

const BUNDLES = [
  {
    displayName: '掘跡藍星 全套',
    contents: ['掘跡藍星（本體）', '掘跡藍星-第二波', '掘跡藍星-銀河博物館', '掘跡藍星: 漂亮盒子', '掘跡藍星: 垃圾金屬'],
    members: new Set(['掘跡藍星', '掘跡藍星-第二波', '掘跡藍星-銀河博物館', '掘跡藍星: 漂亮盒子', '掘跡藍星: 垃圾金屬']),
  },
  {
    displayName: '重裝上陣-榮譽之戰 全套',
    contents: ['重裝上陣-榮譽之戰（本體）', '企業冠名戰隊包1擴充', '奪旗賽擴充', '轟隆鳴動擴充'],
    members: new Set(['重裝上陣-榮譽之戰', '重裝上陣-榮譽之戰 企業冠名戰隊包1擴充', '重裝上陣-榮譽之戰 奪旗賽擴充', '重裝上陣-榮譽之戰 轟隆鳴動擴充']),
  },
  {
    displayName: '瓦萊利亞之暗影王國 全套',
    contents: ['瓦萊利亞之暗影王國（本體）', '瓦萊利亞之暗影王國：泰坦崛起'],
    members: new Set(['瓦萊利亞之暗影王國', '瓦萊利亞之暗影王國：泰坦崛起']),
  },
  {
    displayName: '夢想家園＋陽光街156號 合賣（不拆賣）',
    contents: ['夢想家園（本體）', '夢想家園：陽光街156號'],
    members: new Set(['夢想家園', '夢想家園：陽光街156號']),
  },
  {
    displayName: '小小鐵路帝國＋紅色公司擴充 含擴售（不拆售）',
    contents: ['小小鐵路帝國（本體）', '小小鐵路帝國：紅色公司擴充'],
    members: new Set(['小小鐵路帝國', '小小鐵路帝國：紅色公司擴充']),
  },
]

const memberToBundleMap = new Map()
for (const b of BUNDLES) for (const m of b.members) memberToBundleMap.set(m, b)

const USED_GAME_PICK_DOC = 'current'
const FIRESTORE_REST_PROJECT_FALLBACK = 'ugg-store-system'

const ZONES = [
  { id: 1, label: '買二送一', desc: '任選同區 3 款，最低定價免費', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', badge: 'bg-orange-100 text-orange-700' },
  { id: 2, label: '買一送一', desc: '任選同區 2 款，最低定價免費', color: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-100',   badge: 'bg-rose-100 text-rose-700' },
  { id: 3, label: '買一送二', desc: '任選同區 3 款，最低兩款免費', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', badge: 'bg-violet-100 text-violet-700' },
]

function formatPrice(p) {
  const n = getPriceNumber(p)
  return isNaN(n) ? '—' : `$${n.toLocaleString()}`
}

function getPriceNumber(p) {
  const match = String(p || '').replace(/,/g, '').match(/\d+/)
  return match ? parseInt(match[0], 10) : NaN
}

function parseOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function valueInOptionalRange(value, min, max) {
  if (min === null && max === null) return true
  if (value === null || value === undefined || isNaN(value)) return false

  if (min !== null && max === null) return value >= min
  if (min === null && max !== null) return value <= max

  const low = Math.min(min, max)
  const high = Math.max(min, max)

  if (value < low) return false
  if (value > high) return false
  return true
}

function compareOptionalNumbers(a, b, direction) {
  const aMissing = a === null || a === undefined || isNaN(a)
  const bMissing = b === null || b === undefined || isNaN(b)
  if (aMissing && bMissing) return 0
  if (aMissing) return 1
  if (bMissing) return -1
  return direction === 'asc' ? a - b : b - a
}

function sortUsedGameList(list, sortState) {
  return [...list].sort((a, b) => {
    const aValue = sortState.key === 'weight' ? a.weight : getPriceNumber(a.price)
    const bValue = sortState.key === 'weight' ? b.weight : getPriceNumber(b.price)
    const primary = compareOptionalNumbers(aValue, bValue, sortState.direction)
    if (primary !== 0) return primary

    return (parseInt(b.price) || 0) - (parseInt(a.price) || 0)
  })
}

function normalizeText(value) {
  return String(value || '').toLowerCase().trim()
}

function gameMatchesQuery(game, query) {
  const q = normalizeText(query)
  if (!q) return true

  return [
    game.name,
    game.englishName,
    game.location,
    game.bundleContents?.join(' '),
  ].some(value => normalizeText(value).includes(q))
}

function gameMatchesUsedFilters(game, filters) {
  const playerMin = parseOptionalNumber(filters.playerMin)
  const playerMax = parseOptionalNumber(filters.playerMax)

  if (filters.zoneId !== 'all' && game.usedZone !== Number(filters.zoneId)) return false

  if (playerMin !== null || playerMax !== null) {
    const targetA = playerMin ?? playerMax
    const targetB = playerMax ?? playerMin
    const targetMin = Math.min(targetA, targetB)
    const targetMax = Math.max(targetA, targetB)

    if (!game.minPlayers || !game.maxPlayers) return false
    if (game.maxPlayers < targetMin || game.minPlayers > targetMax) return false
  }

  return true
}

function getUsedGameKey(game) {
  return game.name
}

function getLegacyUsedGameKey(game) {
  return `${game.id}-${game.name}`
}

function getAllUsedGameKeys(game) {
  return [getUsedGameKey(game), getLegacyUsedGameKey(game)]
}

function isPickedGame(game, pickedGameKeys) {
  return getAllUsedGameKeys(game).some(key => pickedGameKeys.has(key))
}

function isGameSoldOutForSale(game, soldGameNames) {
  if (game.isSoldOut || soldGameNames.has(game.name)) return true
  return (game.bundleMembers || []).some(name => soldGameNames.has(name))
}

function getFirestoreRestUrl(path) {
  const options = db.app?.options || {}
  const projectId = options.projectId || FIRESTORE_REST_PROJECT_FALLBACK
  if (!projectId) return ''

  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const keyQuery = options.apiKey ? `?key=${encodeURIComponent(options.apiKey)}` : ''
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${encodedPath}${keyQuery}`
}

async function fetchFirestoreRestJson(path) {
  const url = getFirestoreRestUrl(path)
  if (!url) return null

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Firestore REST ${response.status}`)
  return response.json()
}

async function fetchPickedKeysFromRest() {
  const data = await fetchFirestoreRestJson(`used_game_pick_state/${USED_GAME_PICK_DOC}`)
  const values = data?.fields?.keys?.arrayValue?.values || []
  return values.map(value => value.stringValue).filter(Boolean)
}

async function fetchSoldGameNamesFromRest() {
  const data = await fetchFirestoreRestJson('soldGames')
  return (data?.documents || [])
    .map(document => decodeURIComponent(String(document.name || '').split('/').pop() || ''))
    .filter(Boolean)
}

function isStaffAccount(member) {
  if (!member) return false
  if (member.isGM) return true

  const values = [
    member.id,
    member.name,
    member.nickname,
    member.memberId,
  ].map(value => String(value || '').trim().toLowerCase())

  return values.some(value => value === 'gm' || value === 'ugg' || value === 'gm-admin' || value === '0000')
}

function UsedGameRow({ game, zone, canPick = false, isPicked, onTogglePicked, onSelect }) {
  const isSoldOut = game.isSoldOut
  const isInStock = isPicked && !isSoldOut
  const isUnavailable = !isInStock
  return (
    <div
      className={`w-full flex items-stretch gap-2 bg-white px-3 py-2.5 transition-colors ${isInStock ? 'bg-emerald-50/70' : 'opacity-65'}`}
    >
      {canPick ? (
        <button
          type="button"
          onClick={() => onTogglePicked(game)}
          aria-label={isPicked ? `取消挪出 ${game.name}` : `標記已挪出 ${game.name}`}
          aria-pressed={isPicked}
          className={`w-11 min-h-11 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all ${
            isPicked
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
              : 'bg-white border-stone-200 text-transparent active:border-emerald-300'
          }`}
        >
          <Check className="w-5 h-5" strokeWidth={3} />
        </button>
      ) : (
        <div
          aria-label={isInStock ? '現場有貨' : '現場暫無現貨'}
          className={`w-11 min-h-11 shrink-0 rounded-xl border-2 flex items-center justify-center ${
            isInStock
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
              : 'bg-stone-50 border-stone-200 text-stone-300'
          }`}
        >
          {isInStock ? <Check className="w-5 h-5" strokeWidth={3} /> : <X className="w-4 h-4" strokeWidth={2.5} />}
        </div>
      )}

      <button
        type="button"
        onClick={() => !isSoldOut && onSelect(game)}
        className={`min-w-0 flex-1 text-left rounded-xl px-1.5 py-1 transition-colors ${isSoldOut ? 'cursor-default' : 'active:bg-stone-50 hover:bg-stone-50'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={`text-sm leading-snug font-medium ${isInStock ? 'text-emerald-700' : 'text-stone-500'} ${isUnavailable ? 'line-through decoration-2 decoration-stone-300' : ''}`}>
              {game.name}
            </p>
            {game.bundleContents && (
              <p className={`text-[11px] mt-0.5 leading-snug ${isInStock ? 'text-stone-400' : 'text-stone-300 line-through decoration-stone-300'}`}>
                含：{game.bundleContents.join('・')}
              </p>
            )}
          </div>
          <div className="shrink-0 pt-0.5">
            {isSoldOut
              ? <span className="text-[11px] bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full">已售出</span>
              : <span className={`text-sm font-bold ${isInStock ? 'text-emerald-600' : 'text-stone-400 line-through decoration-stone-300'}`}>{formatPrice(game.price)}</span>
            }
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {isInStock ? (
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              現場有貨
            </span>
          ) : (
            <span className="text-[11px] font-semibold bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full">
              現場暫無
            </span>
          )}
          {game.location && (
            <span className="text-[11px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
              {game.location}
            </span>
          )}
          {zone && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${zone.badge}`}>
              {zone.label}
            </span>
          )}
        </div>
      </button>
    </div>
  )
}

function PickedSummary({ pickedCount, totalCount, visiblePickedCount, onClear }) {
  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-emerald-800">揀貨進度</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            已挪出 {pickedCount} / {totalCount} 款
            {visiblePickedCount !== pickedCount ? `，目前篩選中 ${visiblePickedCount} 款已挪出` : ''}
          </p>
        </div>
        {pickedCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="h-9 shrink-0 rounded-xl border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-700 active:bg-emerald-100"
          >
            清空
          </button>
        )}
      </div>
      <div className="mt-2 h-2 rounded-full bg-white overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: totalCount > 0 ? `${Math.round((pickedCount / totalCount) * 100)}%` : '0%' }}
        />
      </div>
    </div>
  )
}

function PickedSyncNotice({ error }) {
  if (!error) return null
  return (
    <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-xs text-red-600 leading-relaxed">
      勾選同步失敗，這台手機目前只會暫存在本機。請檢查網路或 Firestore 權限。
    </div>
  )
}

function FilterNumberInput({ label, value, onChange, placeholder, step = '1' }) {
  return (
    <label className="block min-w-0">
      <span className="block text-[11px] font-semibold text-stone-500 mb-1">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        className="w-full h-11 rounded-xl border border-stone-200 bg-white px-3 text-base text-stone-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />
    </label>
  )
}

function UsedGameList({ games, gamesLoading, loggedInMember }) {
  const canManageUsedGames = isStaffAccount(loggedInMember)
  const cloudLoadedRef = useRef(false)
  const skipNextCloudWriteRef = useRef(false)
  const initialLocalPickedKeysRef = useRef(null)
  const [openZones, setOpenZones] = useState({ 1: true, 2: true, 3: true })
  const [openCabinets, setOpenCabinets] = useState({})
  const [selectedGame, setSelectedGame] = useState(null)
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [usedFilters, setUsedFilters] = useState({
    zoneId: 'all',
    playerMin: '',
    playerMax: '',
  })
  const [sortState, setSortState] = useState({ key: 'price', direction: 'desc' })
  const [viewMode, setViewMode] = useState(() => canManageUsedGames ? 'cabinet' : 'zone')
  const [pickedSyncError, setPickedSyncError] = useState(false)
  const [soldGameNames, setSoldGameNames] = useState(new Set())
  const [pickedGameKeys, setPickedGameKeys] = useState(() => {
    try {
      const keys = JSON.parse(localStorage.getItem('used_game_picked_keys') || '[]')
      initialLocalPickedKeysRef.current = keys
      return new Set(keys)
    } catch {
      initialLocalPickedKeysRef.current = []
      return new Set()
    }
  })

  const usedGames = useMemo(() => {
    const addedBundles = new Set()
    const merged = []
    for (const g of games) {
      if (!g.isUsedSale) continue
      const bundle = memberToBundleMap.get(g.name)
      if (bundle) {
        if (addedBundles.has(bundle.displayName)) continue
        addedBundles.add(bundle.displayName)
        merged.push({ ...g, name: bundle.displayName, bundleContents: bundle.contents, bundleMembers: Array.from(bundle.members) })
      } else {
        merged.push(g)
      }
    }
    return merged
      .map(g => ({ ...g, isSoldOut: isGameSoldOutForSale(g, soldGameNames) }))
  }, [games, soldGameNames])

  const filteredUsedGames = useMemo(() => {
    return usedGames.filter(g => gameMatchesQuery(g, query) && gameMatchesUsedFilters(g, usedFilters))
  }, [usedGames, query, usedFilters])

  const activeFilterCount = useMemo(() => {
    return [
      usedFilters.zoneId !== 'all',
      usedFilters.playerMin !== '',
      usedFilters.playerMax !== '',
      sortState.key !== 'price' || sortState.direction !== 'desc',
    ].filter(Boolean).length
  }, [sortState, usedFilters])

  const hasActiveFilters = activeFilterCount > 0
  const sortLabel = `${sortState.key === 'weight' ? '依 BGG 難度' : '依價格'}${sortState.direction === 'asc' ? '低到高' : '高到低'}排列`

  const updateUsedFilter = (key, value) => {
    setUsedFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearUsedFilters = () => {
    setUsedFilters({
      zoneId: 'all',
      playerMin: '',
      playerMax: '',
    })
    setSortState({ key: 'price', direction: 'desc' })
  }

  const validPickedKeys = useMemo(() => {
    return new Set(usedGames.flatMap(getAllUsedGameKeys))
  }, [usedGames])

  const pickedCount = useMemo(() => {
    return usedGames.filter(g => isPickedGame(g, pickedGameKeys)).length
  }, [pickedGameKeys, usedGames])

  const visiblePickedCount = useMemo(() => {
    return filteredUsedGames.filter(g => isPickedGame(g, pickedGameKeys)).length
  }, [filteredUsedGames, pickedGameKeys])

  const matchingNonUsedGames = useMemo(() => {
    const q = normalizeText(query)
    if (!q) return []
    return games
      .filter(g => !g.isUsedSale && gameMatchesQuery(g, query))
      .slice(0, 5)
  }, [games, query])

  const byZone = useMemo(() => {
    const map = { 1: [], 2: [], 3: [], 0: [] }
    filteredUsedGames.forEach(g => {
      const z = g.usedZone || 0
      if (map[z]) map[z].push(g)
    })

    Object.keys(map).forEach(key => {
      map[key] = sortUsedGameList(map[key], sortState)
    })

    return map
  }, [filteredUsedGames, sortState])

  const zoneById = useMemo(() => {
    return ZONES.reduce((acc, zone) => ({ ...acc, [zone.id]: zone }), {})
  }, [])

  const visibleZones = useMemo(() => {
    if (usedFilters.zoneId === 'all') return ZONES
    return ZONES.filter(zone => zone.id === Number(usedFilters.zoneId))
  }, [usedFilters.zoneId])

  const byCabinet = useMemo(() => {
    const collator = new Intl.Collator('zh-Hant-TW', { numeric: true, sensitivity: 'base' })
    const map = new Map()
    filteredUsedGames.forEach(g => {
      const cabinet = g.location?.trim() || '未填櫃位'
      if (!map.has(cabinet)) map.set(cabinet, [])
      map.get(cabinet).push(g)
    })

    return Array.from(map.entries())
      .sort(([a], [b]) => collator.compare(a, b))
      .map(([cabinet, list]) => ({
        cabinet,
        list: sortUsedGameList(list, sortState).sort((a, b) => (a.usedZone || 99) - (b.usedZone || 99)),
      }))
  }, [filteredUsedGames, sortState])

  const toggle = (id) => setOpenZones(prev => ({ ...prev, [id]: !prev[id] }))
  const toggleCabinet = (cabinet) => setOpenCabinets(prev => ({ ...prev, [cabinet]: !(prev[cabinet] ?? true) }))
  const togglePicked = (game) => {
    const key = getUsedGameKey(game)
    setPickedGameKeys(prev => {
      const next = new Set(prev)
      if (isPickedGame(game, next)) getAllUsedGameKeys(game).forEach(k => next.delete(k))
      else next.add(key)
      return next
    })
  }
  const clearPicked = () => setPickedGameKeys(new Set())

  useEffect(() => {
    if (!canManageUsedGames && viewMode === 'cabinet') setViewMode('zone')
  }, [canManageUsedGames, viewMode])

  useEffect(() => {
    const pickRef = doc(db, 'used_game_pick_state', USED_GAME_PICK_DOC)
    let cancelled = false
    const applyPickState = (snap) => {
      if (cancelled) return
      cloudLoadedRef.current = true
      setPickedSyncError(false)

      if (!snap.exists()) {
        const localKeys = Array.isArray(initialLocalPickedKeysRef.current) ? initialLocalPickedKeysRef.current : []
        if (canManageUsedGames && localKeys.length > 0) {
          setDoc(pickRef, {
            keys: localKeys,
            updatedAt: serverTimestamp(),
            updatedBy: loggedInMember?.name || loggedInMember?.id || '',
          }, { merge: true }).catch(err => {
            console.error('used game initial pick save:', err)
            setPickedSyncError(true)
          })
        }
        return
      }

      const keys = Array.isArray(snap.data().keys) ? snap.data().keys : []
      skipNextCloudWriteRef.current = true
      setPickedGameKeys(new Set(keys.map(key => String(key))))
    }
    const loadPickStateFromRest = () => {
      fetchPickedKeysFromRest().then(keys => {
        if (cancelled) return
        cloudLoadedRef.current = true
        setPickedSyncError(false)
        skipNextCloudWriteRef.current = true
        setPickedGameKeys(new Set(keys.map(key => String(key))))
      }).catch(err => {
        console.error('used game pick REST load:', err)
        cloudLoadedRef.current = true
        setPickedSyncError(true)
      })
    }

    getDoc(pickRef).then(applyPickState).catch(err => {
      console.warn('used game pick initial load fallback:', err)
      cloudLoadedRef.current = true
      setPickedSyncError(true)
      loadPickStateFromRest()
    })

    const unsubscribe = onSnapshot(
      pickRef,
      applyPickState,
      err => {
        console.warn('used game pick sync fallback:', err)
        cloudLoadedRef.current = true
        setPickedSyncError(true)
        loadPickStateFromRest()
      }
    )
    const fallbackTimer = setInterval(loadPickStateFromRest, 15000)

    return () => {
      cancelled = true
      unsubscribe()
      clearInterval(fallbackTimer)
    }
  }, [canManageUsedGames, loggedInMember])

  useEffect(() => {
    let cancelled = false
    const applySoldNames = (names) => {
      if (!cancelled) setSoldGameNames(new Set(names))
    }
    const loadSoldNamesFromRest = () => {
      fetchSoldGameNamesFromRest().then(applySoldNames).catch(err => {
        console.error('used game sold REST sync:', err)
      })
    }
    const unsubscribe = onSnapshot(
      collection(db, 'soldGames'),
      snap => {
        applySoldNames(snap.docs.map(d => d.id))
      },
      err => {
        console.warn('used game sold sync fallback:', err)
        loadSoldNamesFromRest()
      }
    )
    loadSoldNamesFromRest()
    const fallbackTimer = setInterval(loadSoldNamesFromRest, 15000)

    return () => {
      cancelled = true
      unsubscribe()
      clearInterval(fallbackTimer)
    }
  }, [])

  useEffect(() => {
    const keys = Array.from(pickedGameKeys)
    localStorage.setItem('used_game_picked_keys', JSON.stringify(keys))

    if (!canManageUsedGames || !cloudLoadedRef.current) return

    if (skipNextCloudWriteRef.current) {
      skipNextCloudWriteRef.current = false
      return
    }

    const pickRef = doc(db, 'used_game_pick_state', USED_GAME_PICK_DOC)
    setDoc(pickRef, {
      keys,
      updatedAt: serverTimestamp(),
      updatedBy: loggedInMember?.name || loggedInMember?.id || '',
    }, { merge: true }).then(() => {
      setPickedSyncError(false)
    }).catch(err => {
      console.error('used game pick save:', err)
      setPickedSyncError(true)
    })
  }, [pickedGameKeys, canManageUsedGames, loggedInMember])

  useEffect(() => {
    setPickedGameKeys(prev => {
      const next = new Set(Array.from(prev).filter(key => validPickedKeys.has(key)))
      return next.size === prev.size ? prev : next
    })
  }, [validPickedKeys])

  if (gamesLoading) {
    return <div className="flex items-center justify-center py-16 text-stone-400 text-sm">載入中…</div>
  }

  return (
    <div className="space-y-3">
      <div className="sticky top-2 z-20 bg-white/95 border border-stone-100 rounded-2xl p-3 shadow-sm space-y-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <label className="block text-xs font-semibold text-stone-500" htmlFor="used-game-search">
            搜尋二手遊戲
          </label>
          <span className="text-[11px] text-stone-400 shrink-0">
            {filteredUsedGames.length} / {usedGames.length} 款
          </span>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="used-game-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="輸入遊戲名稱、英文名或櫃位"
            className="w-full h-12 rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-10 text-base text-stone-700 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="清除搜尋"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-stone-400 active:bg-stone-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(prev => !prev)}
            aria-expanded={filtersOpen}
            className={`w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              hasActiveFilters
                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                : 'bg-stone-50 text-stone-500 border border-stone-100 active:bg-stone-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            排序 / 篩選
            {hasActiveFilters && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-orange-500 text-white text-[11px] leading-5">
                {activeFilterCount}
              </span>
            )}
            {filtersOpen
              ? <ChevronUp className="w-4 h-4 ml-auto mr-3 text-stone-400" />
              : <ChevronDown className="w-4 h-4 ml-auto mr-3 text-stone-400" />
            }
          </button>

          {filtersOpen && (
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3 space-y-3">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-xs font-bold text-stone-600">指定分區</p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearUsedFilters}
                      className="text-xs font-semibold text-stone-400 active:text-orange-600"
                    >
                      清除篩選
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: '全部分區' },
                    ...ZONES.map(zone => ({ id: String(zone.id), label: zone.label })),
                  ].map(option => {
                    const active = usedFilters.zoneId === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => updateUsedFilter('zoneId', option.id)}
                        className={`h-11 rounded-xl text-sm font-semibold transition-all ${
                          active
                            ? 'bg-stone-800 text-white shadow-sm'
                            : 'bg-white text-stone-500 border border-stone-200 active:bg-stone-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-600 mb-2">價格排序</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { direction: 'desc', label: '價格高到低' },
                    { direction: 'asc', label: '價格低到高' },
                  ].map(option => {
                    const active = sortState.key === 'price' && sortState.direction === option.direction
                    return (
                      <button
                        key={option.direction}
                        type="button"
                        onClick={() => setSortState({ key: 'price', direction: option.direction })}
                        className={`h-11 rounded-xl text-sm font-semibold transition-all ${
                          active
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'bg-white text-stone-500 border border-stone-200 active:bg-stone-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-600 mb-2">BGG 難度排序</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { direction: 'desc', label: '難度高到低' },
                    { direction: 'asc', label: '難度低到高' },
                  ].map(option => {
                    const active = sortState.key === 'weight' && sortState.direction === option.direction
                    return (
                      <button
                        key={option.direction}
                        type="button"
                        onClick={() => setSortState({ key: 'weight', direction: option.direction })}
                        className={`h-11 rounded-xl text-sm font-semibold transition-all ${
                          active
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'bg-white text-stone-500 border border-stone-200 active:bg-stone-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-600 mb-2">指定人數區間</p>
                <div className="grid grid-cols-2 gap-2">
                  <FilterNumberInput
                    label="最少人數"
                    value={usedFilters.playerMin}
                    onChange={(value) => updateUsedFilter('playerMin', value)}
                    placeholder="例如 2"
                  />
                  <FilterNumberInput
                    label="最多人數"
                    value={usedFilters.playerMax}
                    onChange={(value) => updateUsedFilter('playerMax', value)}
                    placeholder="例如 4"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`grid gap-2 ${canManageUsedGames ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {[
            ...(canManageUsedGames ? [{ id: 'cabinet', label: '櫃子排列', icon: Boxes }] : []),
            { id: 'zone', label: '優惠分區', icon: List },
          ].map(mode => {
            const Icon = mode.icon
            const active = viewMode === mode.id
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  active
                    ? 'bg-stone-800 text-white shadow-sm'
                    : 'bg-stone-50 text-stone-500 border border-stone-100 active:bg-stone-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {mode.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-xs text-amber-700 leading-relaxed">
        <span className="font-bold">現貨說明：</span>6/20 13:00 週年慶二手出清開始後，有綠色勾勾的是目前現場有貨；被槓掉的是尚未移到現場或已售出。現場賣出後會即時更新為缺貨。<br />
        <span className="font-bold">購買說明：</span>同一區內遊戲可享優惠，不同區不合併計算，售完為止。<br />
        <span className="font-bold">結帳聲明：</span>結帳前請務必檢查清點配件，二手清倉遊戲結帳售出後恕不退換及補件。
      </div>

      {canManageUsedGames && (
        <>
          <PickedSummary
            pickedCount={pickedCount}
            totalCount={usedGames.length}
            visiblePickedCount={visiblePickedCount}
            onClear={clearPicked}
          />
          <PickedSyncNotice error={pickedSyncError} />
        </>
      )}

      {(query || hasActiveFilters) && filteredUsedGames.length === 0 && (
        <div className="bg-white border border-stone-100 rounded-2xl px-4 py-5 text-center">
          {query && matchingNonUsedGames.length > 0 ? (
            <>
              <p className="text-sm font-bold text-stone-700">館內有這款，但目前不是二手販售</p>
              <p className="text-xs text-stone-400 mt-1">
                {matchingNonUsedGames.map(g => g.name).join('、')}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-stone-700">查不到符合條件的二手遊戲</p>
              <p className="text-xs text-stone-400 mt-1">可換個分區、放寬人數區間，或調整搜尋字再試一次。</p>
            </>
          )}
        </div>
      )}

      {viewMode === 'zone' && filteredUsedGames.length > 0 && (
        <>
          {visibleZones.map(zone => {
            const list = byZone[zone.id]
            const isOpen = openZones[zone.id]
            return (
              <div key={zone.id} className={`rounded-2xl border ${zone.border} overflow-hidden`}>
                <button
                  type="button"
                  onClick={() => toggle(zone.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 ${zone.bg}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`text-sm font-bold ${zone.color}`}>{zone.label}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${zone.badge}`}>
                      {list.length} 款
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] text-stone-400 text-right leading-snug">{zone.desc}</span>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                    }
                  </div>
                </button>

                {isOpen && (
                  <div className="divide-y divide-stone-50">
                    {list.length === 0 ? (
                      <p className="px-4 py-4 text-xs text-stone-400 text-center">尚無遊戲（分區設定中）</p>
                    ) : (
                      list.map(g => (
                        <UsedGameRow
                          key={g.id}
                          game={g}
                          zone={zone}
                          canPick={canManageUsedGames}
                          isPicked={isPickedGame(g, pickedGameKeys)}
                          onTogglePicked={togglePicked}
                          onSelect={setSelectedGame}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {canManageUsedGames && viewMode === 'cabinet' && filteredUsedGames.length > 0 && (
        <div className="space-y-3">
          {byCabinet.map(({ cabinet, list }) => {
            const isOpen = openCabinets[cabinet] ?? true
            return (
              <div key={cabinet} className="rounded-2xl border border-stone-100 overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleCabinet(cabinet)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-stone-50"
                >
                  <div className="min-w-0 text-left">
                    <p className="text-base font-bold text-stone-800 truncate">{cabinet}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">要從這個櫃子拿 {list.length} 款</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">
                      {list.length} 款
                    </span>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-stone-400" />
                      : <ChevronDown className="w-4 h-4 text-stone-400" />
                    }
                  </div>
                </button>
                {isOpen && (
                  <div className="divide-y divide-stone-50">
                    {list.map(g => (
                      <UsedGameRow
                        key={g.id}
                        game={g}
                        zone={zoneById[g.usedZone]}
                        canPick={canManageUsedGames}
                        isPicked={isPickedGame(g, pickedGameKeys)}
                        onTogglePicked={togglePicked}
                        onSelect={setSelectedGame}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {byZone[0].length > 0 && (
        <p className="text-center text-xs text-stone-400 pt-1">
          另有 {byZone[0].length} 款分區設定中，敬請期待
        </p>
      )}

      <p className="text-center text-xs text-stone-300 pt-2">
        顯示 {filteredUsedGames.length} / {usedGames.length} 款・{viewMode === 'cabinet' ? `依櫃位排列，區內${sortLabel}` : sortLabel}
      </p>

      {selectedGame && (
        <GameCard
          game={selectedGame}
          defaultOpen={true}
          hideCard={true}
          onModalClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  )
}

export default function EventBoardPage({ games = [], gamesLoading = false, loggedInMember = null }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('events')

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      try {
        const q = query(collection(db, 'events'), where('active', '==', true))
        const snap = await getDocs(q)
        setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date || '').localeCompare(a.date || '')))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const cfg = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.other

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-stone-800">🗓️ 活動看板</h2>
        <p className="text-xs text-stone-400 mt-0.5">最新活動、賽事與公告</p>
      </div>

      {/* 頁籤 */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-5">
        {[
          { id: 'events', label: '📋 活動公告' },
          { id: 'used-games', label: '🎲 二手遊戲' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t.id
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'events' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-stone-400 text-sm">載入中…</div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-stone-400 text-sm">目前沒有進行中的活動，敬請期待！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => setSelected(selected?.id === ev.id ? null : ev)}
                  className="w-full text-left bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:border-orange-200 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {ev.imageUrl && (
                      <img src={ev.imageUrl} alt={ev.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg(ev.type).color}`}>
                          {cfg(ev.type).label}
                        </span>
                        {ev.date && (
                          <span className="text-[11px] text-stone-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{ev.date}{ev.endDate && ` ～ ${ev.endDate}`}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-stone-800 text-sm leading-snug">{ev.title}</h3>
                      {!selected || selected.id !== ev.id ? (
                        <p className="text-xs text-stone-400 mt-1 line-clamp-2">{ev.description}</p>
                      ) : null}
                    </div>
                    <ChevronRight className={`w-4 h-4 text-stone-300 shrink-0 transition-transform ${selected?.id === ev.id ? 'rotate-90' : ''}`} />
                  </div>
                  {selected?.id === ev.id && ev.description && (
                    <div className="mt-3 pt-3 border-t border-stone-100 text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                      {ev.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="mt-8 bg-stone-50 rounded-2xl p-4 text-center">
            <p className="text-xs text-stone-400">追蹤烏嘎嘎官方 LINE 帳號，最新活動不漏接</p>
          </div>
        </>
      )}

      {tab === 'used-games' && (
        <UsedGameList games={games} gamesLoading={gamesLoading} loggedInMember={loggedInMember} />
      )}
    </div>
  )
}
