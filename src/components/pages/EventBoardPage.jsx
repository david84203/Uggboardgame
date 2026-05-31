import { useState, useEffect, useMemo } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { Calendar, ChevronRight, ChevronDown, ChevronUp, Tag } from 'lucide-react'

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
]

const memberToBundleMap = new Map()
for (const b of BUNDLES) for (const m of b.members) memberToBundleMap.set(m, b)

const ZONES = [
  { id: 1, label: '買二送一', desc: '任選同區 3 款，最低定價免費', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', badge: 'bg-orange-100 text-orange-700' },
  { id: 2, label: '買一送一', desc: '任選同區 2 款，最低定價免費', color: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-100',   badge: 'bg-rose-100 text-rose-700' },
  { id: 3, label: '買一送二', desc: '任選同區 3 款，最低兩款免費', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', badge: 'bg-violet-100 text-violet-700' },
]

function formatPrice(p) {
  const n = parseInt(p)
  return isNaN(n) ? '—' : `$${n.toLocaleString()}`
}

function UsedGameList({ games, gamesLoading }) {
  const [openZones, setOpenZones] = useState({ 1: true, 2: true, 3: true })

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

  const byZone = useMemo(() => {
    const map = { 1: [], 2: [], 3: [], 0: [] }
    usedGames.forEach(g => {
      const z = g.usedZone || 0
      if (map[z]) map[z].push(g)
    })
    return map
  }, [usedGames])

  const toggle = (id) => setOpenZones(prev => ({ ...prev, [id]: !prev[id] }))

  if (gamesLoading) {
    return <div className="flex items-center justify-center py-16 text-stone-400 text-sm">載入中…</div>
  }

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-xs text-amber-700 leading-relaxed">
        <span className="font-bold">購買說明：</span>同一區內遊戲可享優惠，不同區不合併計算。售完為止。
      </div>

      {ZONES.map(zone => {
        const list = byZone[zone.id]
        const isOpen = openZones[zone.id]
        return (
          <div key={zone.id} className={`rounded-2xl border ${zone.border} overflow-hidden`}>
            <button
              onClick={() => toggle(zone.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 ${zone.bg}`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`text-sm font-bold ${zone.color}`}>{zone.label}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${zone.badge}`}>
                  {list.length} 款
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-stone-400">{zone.desc}</span>
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
                    <div key={g.id} className={`flex items-start justify-between px-4 py-2.5 bg-white ${g.isSoldOut ? 'opacity-50' : ''}`}>
                      <div className="flex-1 mr-3">
                        <p className={`text-sm text-stone-700 leading-snug ${g.isSoldOut ? 'line-through' : ''}`}>
                          {g.name}
                        </p>
                        {g.bundleContents && (
                          <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">
                            含：{g.bundleContents.join('・')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        {g.isSoldOut
                          ? <span className="text-[11px] bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full">已售出</span>
                          : <span className={`text-sm font-bold ${zone.color}`}>{formatPrice(g.price)}</span>
                        }
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}

      {byZone[0].length > 0 && (
        <p className="text-center text-xs text-stone-400 pt-1">
          另有 {byZone[0].length} 款分區設定中，敬請期待
        </p>
      )}

      <p className="text-center text-xs text-stone-300 pt-2">共 {usedGames.length} 款・依定價由高至低排列</p>
    </div>
  )
}

export default function EventBoardPage({ games = [], gamesLoading = false }) {
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
        <UsedGameList games={games} gamesLoading={gamesLoading} />
      )}
    </div>
  )
}
