import { useState } from 'react'
import { Trophy, ChevronDown } from 'lucide-react'
import { useGameLeaderboard } from '../hooks/useScorecard'

function formatDate(ts) {
  if (!ts?.seconds) return ''
  const d = new Date(ts.seconds * 1000)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function GameLeaderboard({ gameName }) {
  const { leaderboard, loading } = useGameLeaderboard(gameName)
  const [expanded, setExpanded] = useState(null)

  if (loading || leaderboard.length === 0) return null

  return (
    <div className="mb-6">
      <p className="text-xs text-stone-500 font-bold mb-3 flex items-center gap-1.5">
        <Trophy className="w-3.5 h-3.5 text-amber-500" />
        歷史排行榜 Top {leaderboard.length}
      </p>
      <div className="space-y-1.5">
        {leaderboard.map((entry, i) => (
          <div key={i}>
            <button
              onClick={() => setExpanded(entry.categories ? (expanded === i ? null : i) : null)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition text-left ${
                i === 0 ? 'bg-amber-50 border border-amber-100' : 'bg-stone-50 hover:bg-stone-100'
              }`}
            >
              <span className="text-sm w-5 shrink-0 text-center font-bold text-stone-500">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
              </span>
              <span className="flex-1 text-sm font-medium text-stone-800 truncate">{entry.playerName}</span>
              <span className="font-bold text-stone-800 text-sm tabular-nums">{entry.total}</span>
              <span className="text-[11px] text-stone-400 ml-0.5">{formatDate(entry.submittedAt)}</span>
              {entry.categories && (
                <ChevronDown
                  size={13}
                  className={`text-stone-400 transition-transform shrink-0 ${expanded === i ? 'rotate-180' : ''}`}
                />
              )}
            </button>

            {expanded === i && entry.categories && (
              <div className="mx-2 mt-1 px-3 py-2 bg-amber-50/60 border border-amber-100 rounded-xl grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(entry.categories).map(([label, val]) => (
                  <div key={label} className="flex justify-between gap-2 text-xs">
                    <span className="text-stone-400 truncate">{label}</span>
                    <span className="font-bold text-stone-700 shrink-0">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
