import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { Calendar, Tag, ChevronRight } from 'lucide-react'

const TYPE_CONFIG = {
  tournament: { label: '比賽', color: 'bg-red-50 text-red-600 border-red-100' },
  new_game:   { label: '新遊戲', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  promo:      { label: '優惠', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  other:      { label: '公告', color: 'bg-blue-50 text-blue-600 border-blue-100' },
}

export default function EventBoardPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      try {
        const q = query(
          collection(db, 'events'),
          where('active', '==', true)
        )
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
    </div>
  )
}
