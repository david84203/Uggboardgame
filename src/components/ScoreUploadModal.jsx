import { useState } from 'react'
import { X, Search, Trophy, Upload } from 'lucide-react'
import { uploadScorecard } from '../hooks/useScorecard'

export default function ScoreUploadModal({ result, games, defaultGameName, onClose }) {
  const [gameSearch, setGameSearch] = useState(defaultGameName || '')
  const [selectedGame, setSelectedGame] = useState(() => {
    if (!defaultGameName || !games?.length) return null
    return games.find(g => g.name === defaultGameName) || null
  })
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  const filteredGames = !selectedGame && gameSearch.trim()
    ? (games || []).filter(g =>
        g.name.includes(gameSearch) ||
        (g.englishName && g.englishName.toLowerCase().includes(gameSearch.toLowerCase()))
      ).slice(0, 6)
    : []

  async function handleUpload() {
    const gameName = selectedGame?.name || gameSearch.trim()
    if (!gameName) return
    setUploading(true)
    try {
      await uploadScorecard({
        gameId: selectedGame?.id || null,
        gameName,
        players: result.players,
        source: result.source,
      })
      setUploaded(true)
    } catch (e) {
      console.error('upload scorecard error', e)
    } finally {
      setUploading(false)
    }
  }

  const canUpload = !uploading && (selectedGame || gameSearch.trim())

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center sm:justify-center z-[60]">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm sm:mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            上傳計分卡
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-100"><X size={18} /></button>
        </div>

        {uploaded ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="font-bold text-stone-800 mb-1">上傳成功！</p>
            <p className="text-sm text-stone-400 mb-4">計分紀錄已加入排行榜</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600">
              關閉
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* 遊戲選擇 */}
            <div>
              <label className="text-xs text-stone-500 font-bold block mb-1.5">遊戲名稱 *</label>
              {selectedGame ? (
                <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
                  <span className="font-medium text-stone-800 text-sm">{selectedGame.name}</span>
                  <button onClick={() => { setSelectedGame(null); setGameSearch('') }}
                    className="text-xs text-orange-500 hover:underline">更換</button>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      autoFocus
                      value={gameSearch}
                      onChange={e => setGameSearch(e.target.value)}
                      placeholder="搜尋遊戲名稱…"
                      className="w-full pl-8 pr-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                    />
                  </div>
                  {filteredGames.length > 0 && (
                    <div className="mt-1 border border-stone-100 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                      {filteredGames.map(g => (
                        <button key={g.id}
                          onClick={() => { setSelectedGame(g); setGameSearch(g.name) }}
                          className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm border-b border-stone-50 last:border-0">
                          <span className="font-medium">{g.name}</span>
                          {g.englishName && g.englishName !== 'N/A' && (
                            <span className="text-stone-400 text-xs ml-1.5">{g.englishName}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 計分結果預覽 */}
            <div>
              <p className="text-xs text-stone-500 font-bold mb-2">本局計分結果</p>
              <div className="space-y-1.5">
                {[...result.players].sort((a, b) => b.total - a.total).map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-stone-50 rounded-xl">
                    <span className="text-sm font-medium text-stone-700">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {p.name || `玩家${i + 1}`}
                    </span>
                    <span className="font-bold text-stone-800">{p.total} 分</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm hover:bg-stone-50">
                取消
              </button>
              <button onClick={handleUpload} disabled={!canUpload}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-40 flex items-center justify-center gap-1.5">
                {uploading ? '上傳中…' : <><Upload size={14} />確認上傳</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
