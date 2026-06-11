import { useState } from 'react'
import { X, Search, Plus, Trash2 } from 'lucide-react'
import useActiveRentals from '../hooks/useActiveRentals'

// 租金公式與門市系統一致：定價總和每滿 500 元收 50 元（無條件進位）
function calcRentalFee(totalPrice) {
  if (!totalPrice || totalPrice <= 0) return 0
  return Math.ceil(totalPrice / 500) * 50
}

function parsePrice(price) {
  const n = parseInt(String(price ?? '').replace(/,/g, ''), 10)
  return isNaN(n) ? 0 : n
}

function formatReturnDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  return parts.length === 3 ? `${parseInt(parts[1])}/${parseInt(parts[2])} 歸還` : dateStr
}

const emptyRow = { game: null, search: '', showDropdown: false }

export default function RentalEstimator({ allGames = [], onClose }) {
  const { getRentalInfo } = useActiveRentals()
  const [rows, setRows] = useState([{ ...emptyRow }])

  const selectedGames = rows.filter(r => r.game)
  const totalPrice = selectedGames.reduce((sum, r) => sum + parsePrice(r.game.price), 0)
  const rentalFee = calcRentalFee(totalPrice)
  const hasUnpriced = selectedGames.some(r => parsePrice(r.game.price) <= 0)

  function updateRow(idx, patch) {
    setRows(rs => rs.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }

  function removeRow(idx) {
    if (rows.length <= 1) { setRows([{ ...emptyRow }]); return }
    setRows(rs => rs.filter((_, i) => i !== idx))
  }

  function getSuggestions(search) {
    if (!search.trim()) return []
    const q = search.trim().toLowerCase()
    return allGames
      .filter(g => !g.isSoldOut)
      .filter(g => g.name.toLowerCase().includes(q) || (g.englishName || '').toLowerCase().includes(q))
      .slice(0, 8)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center sm:justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-sm sm:mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-stone-100 sticky top-0 bg-white rounded-t-3xl z-30">
          <h2 className="text-lg font-bold text-stone-800">🧮 租金試算</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-stone-100"><X size={20} /></button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-stone-400">搜尋想租的遊戲，立即試算押金與租金，並查看是否被租借中。</p>

          {/* 遊戲清單 */}
          <div className="space-y-2">
            {rows.map((row, idx) => {
              const suggestions = getSuggestions(row.search)
              const info = row.game ? getRentalInfo(row.game) : null
              const price = row.game ? parsePrice(row.game.price) : 0
              return (
                <div key={idx}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 relative">
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          value={row.search}
                          onChange={e => updateRow(idx, { search: e.target.value, game: null, showDropdown: true })}
                          onFocus={() => updateRow(idx, { showDropdown: true })}
                          onBlur={() => setTimeout(() => updateRow(idx, { showDropdown: false }), 150)}
                          placeholder={`搜尋遊戲名稱 ${idx + 1}`}
                          className="w-full pl-8 pr-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                        />
                      </div>
                      {row.showDropdown && !row.game && suggestions.length > 0 && (
                        <div className="absolute z-20 top-full mt-1 w-full bg-white border border-stone-100 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                          {suggestions.map(g => {
                            const sInfo = getRentalInfo(g)
                            return (
                              <button
                                key={g.id}
                                onMouseDown={e => { e.preventDefault(); updateRow(idx, { game: g, search: g.name, showDropdown: false }) }}
                                className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm border-b border-stone-50 last:border-0 flex items-center justify-between gap-2"
                              >
                                <span className="font-medium text-stone-800 min-w-0 truncate">{g.name}</span>
                                <span className="shrink-0 flex items-center gap-1.5">
                                  {sInfo.rented && <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">租借中</span>}
                                  {parsePrice(g.price) > 0 && <span className="text-xs text-stone-400">${parsePrice(g.price)}</span>}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    <div className="w-20 px-2 py-2 border border-stone-100 bg-stone-50 rounded-xl text-sm text-right text-stone-600">
                      {row.game ? (price > 0 ? `$${price}` : '－') : <span className="text-stone-300">$ 定價</span>}
                    </div>
                    <button
                      onClick={() => removeRow(idx)}
                      disabled={!row.game && !row.search && rows.length <= 1}
                      className="p-2 mt-0.5 rounded-xl text-stone-300 hover:text-red-400 hover:bg-red-50 disabled:opacity-0 disabled:pointer-events-none transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* 選定後的狀態列 */}
                  {row.game && (
                    <div className="mt-1 ml-1 flex items-center gap-2 text-xs">
                      {info.rented ? (
                        <span className="text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full font-medium">
                          🔴 租借中{info.returnDate ? `（預計 ${formatReturnDate(info.returnDate)}）` : ''}
                        </span>
                      ) : (
                        <span className="text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full font-medium">
                          ✅ 可租借
                        </span>
                      )}
                      {price <= 0 && <span className="text-stone-400">定價未登錄，請洽櫃台</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button
            onClick={() => setRows(rs => [...rs, { ...emptyRow }])}
            className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600"
          >
            <Plus size={14} />
            新增遊戲
          </button>

          {/* 試算結果 */}
          {totalPrice > 0 && (
            <div className="bg-stone-50 rounded-xl px-3 py-2.5 space-y-1 text-sm">
              <div className="flex justify-between text-stone-500">
                <span>押金（定價總和）</span>
                <span className="font-medium text-stone-700">${totalPrice}</span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-1.5">
                <span className="text-stone-600 font-medium">租金</span>
                <span className="font-bold text-orange-600 text-base">${rentalFee}</span>
              </div>
              {hasUnpriced && (
                <p className="text-xs text-stone-400 pt-1">※ 部分遊戲定價未登錄，未列入計算</p>
              )}
            </div>
          )}

          <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 text-xs text-orange-600 space-y-1">
            <p>・押金為遊戲定價總和，歸還時全額退還</p>
            <p>・租金每滿 $500 收 $50（未滿以 $500 計）</p>
            <p>・此為試算結果，僅供參考；租借請至烏嘎嘎櫃台辦理</p>
          </div>
        </div>

        <div className="p-4 border-t border-stone-100">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50">
            關閉
          </button>
        </div>
      </div>
    </div>
  )
}
