import { useState, useEffect, useMemo, useRef } from 'react'
import { collection, query, where, getDocs, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { Calendar, ChevronRight, ChevronDown, ChevronUp, Search, List, Boxes, X, Check } from 'lucide-react'
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
]

const memberToBundleMap = new Map()
for (const b of BUNDLES) for (const m of b.members) memberToBundleMap.set(m, b)

const USED_GAME_PICK_DOC = 'current'

const ZONES = [
  { id: 1, label: '買二送一', desc: '任選同區 3 款，最低定價免費', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', badge: 'bg-orange-100 text-orange-700' },
  { id: 2, label: '買一送一', desc: '任選同區 2 款，最低定價免費', color: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-100',   badge: 'bg-rose-100 text-rose-700' },
  { id: 3, label: '買一送二', desc: '任選同區 3 款，最低兩款免費', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', badge: 'bg-violet-100 text-violet-700' },
]

function formatPrice(p) {
  const n = parseInt(p)
  return isNaN(n) ? '—' : `$${n.toLocaleString()}`
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

function getUsedGameKey(game) {
  return `${game.id}-${game.name}`
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
  const isDisabled = game.isSoldOut
  const showPicked = canPick && isPicked
  return (
    <div
      className={`w-full flex items-stretch gap-2 bg-white px-3 py-2.5 transition-colors ${showPicked ? 'bg-emerald-50/70' : ''} ${isDisabled ? 'opacity-60' : ''}`}
    >
      {canPick && (
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
      )}

      <button
        type="button"
        onClick={() => !isDisabled && onSelect(game)}
        className={`min-w-0 flex-1 text-left rounded-xl px-1.5 py-1 transition-colors ${isDisabled ? 'cursor-default' : 'active:bg-stone-50 hover:bg-stone-50'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={`text-sm leading-snug font-medium ${showPicked ? 'text-emerald-700' : 'text-stone-700'} ${isDisabled ? 'line-through' : ''}`}>
              {game.name}
            </p>
            {game.bundleContents && (
              <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">
                含：{game.bundleContents.join('・')}
              </p>
            )}
          </div>
          <div className="shrink-0 pt-0.5">
            {isDisabled
              ? <span className="text-[11px] bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full">已售出</span>
              : <span className={`text-sm font-bold ${showPicked ? 'text-emerald-600' : zone?.color || 'text-stone-700'}`}>{formatPrice(game.price)}</span>
            }
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {showPicked && (
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              已挪出
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

function UsedGameList({ games, gamesLoading, loggedInMember }) {
  const canManageUsedGames = isStaffAccount(loggedInMember)
  const cloudLoadedRef = useRef(false)
  const skipNextCloudWriteRef = useRef(false)
  const [openZones, setOpenZones] = useState({ 1: true, 2: true, 3: true })
  const [openCabinets, setOpenCabinets] = useState({})
  const [selectedGame, setSelectedGame] = useState(null)
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState(() => canManageUsedGames ? 'cabinet' : 'zone')
  const [pickedSyncError, setPickedSyncError] = useState(false)
  const [pickedGameKeys, setPickedGameKeys] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('used_game_picked_keys') || '[]'))
    } catch {
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
        merged.push({ ...g, name: bundle.displayName, bundleContents: bundle.contents })
      } else {
        merged.push(g)
      }
    }
    return merged.sort((a, b) => (parseInt(b.price) || 0) - (parseInt(a.price) || 0))
  }, [games])

  const filteredUsedGames = useMemo(() => {
    return usedGames.filter(g => gameMatchesQuery(g, query))
  }, [usedGames, query])

  const validPickedKeys = useMemo(() => {
    return new Set(usedGames.map(getUsedGameKey))
  }, [usedGames])

  const pickedCount = useMemo(() => {
    let count = 0
    validPickedKeys.forEach(key => {
      if (pickedGameKeys.has(key)) count += 1
    })
    return count
  }, [pickedGameKeys, validPickedKeys])

  const visiblePickedCount = useMemo(() => {
    return filteredUsedGames.filter(g => pickedGameKeys.has(getUsedGameKey(g))).length
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
    return map
  }, [filteredUsedGames])

  const zoneById = useMemo(() => {
    return ZONES.reduce((acc, zone) => ({ ...acc, [zone.id]: zone }), {})
  }, [])

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
        list: list.sort((a, b) => (a.usedZone || 99) - (b.usedZone || 99) || (parseInt(b.price) || 0) - (parseInt(a.price) || 0)),
      }))
  }, [filteredUsedGames])

  const toggle = (id) => setOpenZones(prev => ({ ...prev, [id]: !prev[id] }))
  const toggleCabinet = (cabinet) => setOpenCabinets(prev => ({ ...prev, [cabinet]: !(prev[cabinet] ?? true) }))
  const togglePicked = (game) => {
    const key = getUsedGameKey(game)
    setPickedGameKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  const clearPicked = () => setPickedGameKeys(new Set())

  useEffect(() => {
    if (!canManageUsedGames && viewMode === 'cabinet') setViewMode('zone')
  }, [canManageUsedGames, viewMode])

  useEffect(() => {
    if (!canManageUsedGames) return undefined

    const pickRef = doc(db, 'used_game_pick_state', USED_GAME_PICK_DOC)
    return onSnapshot(
      pickRef,
      snap => {
        cloudLoadedRef.current = true
        setPickedSyncError(false)
        const keys = snap.exists() && Array.isArray(snap.data().keys) ? snap.data().keys : []
        skipNextCloudWriteRef.current = true
        setPickedGameKeys(new Set(keys.map(key => String(key))))
      },
      err => {
        console.error('used game pick sync:', err)
        cloudLoadedRef.current = true
        setPickedSyncError(true)
      }
    )
  }, [canManageUsedGames])

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
        <span className="font-bold">購買說明：</span>同一區內遊戲可享優惠，不同區不合併計算。售完為止。
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

      {query && filteredUsedGames.length === 0 && (
        <div className="bg-white border border-stone-100 rounded-2xl px-4 py-5 text-center">
          {matchingNonUsedGames.length > 0 ? (
            <>
              <p className="text-sm font-bold text-stone-700">館內有這款，但目前不是二手販售</p>
              <p className="text-xs text-stone-400 mt-1">
                {matchingNonUsedGames.map(g => g.name).join('、')}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-stone-700">查不到這款二手遊戲</p>
              <p className="text-xs text-stone-400 mt-1">可換個關鍵字，或確認工作表名稱是否一致。</p>
            </>
          )}
        </div>
      )}

      {viewMode === 'zone' && filteredUsedGames.length > 0 && (
        <>
          {ZONES.map(zone => {
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
                          isPicked={pickedGameKeys.has(getUsedGameKey(g))}
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
                        isPicked={pickedGameKeys.has(getUsedGameKey(g))}
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
        共 {usedGames.length} 款・{viewMode === 'cabinet' ? '依櫃位排列' : '依定價由高至低排列'}
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
