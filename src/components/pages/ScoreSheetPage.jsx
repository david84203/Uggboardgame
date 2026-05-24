import React, { useState, useCallback } from 'react';
import { Plus, Minus, RotateCcw, Upload } from 'lucide-react';
import ScoreUploadModal from '../ScoreUploadModal';

const DEFAULT_PLAYERS = 4;
const DEFAULT_ROWS = 5;

function makeGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(''));
}

function SetupView({ onStart, games }) {
  const [gameSearch, setGameSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [showGameDropdown, setShowGameDropdown] = useState(false);

  const filteredGames = !selectedGame && gameSearch.trim()
    ? (games || []).filter(g => g.name.includes(gameSearch) || (g.englishName && g.englishName.toLowerCase().includes(gameSearch.toLowerCase()))).slice(0, 6)
    : [];

  const handleStart = () => {
    const gameInfo = selectedGame ? { gameId: selectedGame.id, gameName: selectedGame.name } : { gameId: null, gameName: gameSearch.trim() };
    onStart(gameInfo);
  };

  return (
    <div style={{ maxWidth:512, margin:'0 auto', padding:'16px 16px 100px', minHeight:'calc(100vh-60px)', background:'#F5F2EB' }}>
      <h2 style={{ textAlign:'center', fontSize:22, fontWeight:900, color:'#1c1917', margin:'16px 0 20px', letterSpacing:1 }}>數位計分紙</h2>

      <div style={{ background:'#fff', borderRadius:16, padding:20, marginBottom:12, border:'1px solid #e5e7eb' }}>
        <div style={{ fontWeight:700, color:'#57534e', marginBottom:10 }}>
          遊戲名稱 <span style={{ fontWeight:400, fontSize:12, color:'#a8a29e' }}>（選填）</span>
          <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4, fontWeight: 400 }}>⚠️ 若未填寫遊戲名稱，計分後將無法上傳分數</div>
        </div>
        {selectedGame ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:12, padding:'10px 14px' }}>
            <span style={{ fontWeight:600, color:'#1c1917' }}>{selectedGame.name}</span>
            <button onClick={() => { setSelectedGame(null); setGameSearch(''); }} style={{ fontSize:12, color:'#ea580c', background:'none', border:'none', cursor:'pointer' }}>更換</button>
          </div>
        ) : (
          <div style={{ position:'relative' }}>
            <input
              type="text"
              placeholder="搜尋遊戲名稱…"
              value={gameSearch}
              onChange={e => { setGameSearch(e.target.value); setShowGameDropdown(true); }}
              onFocus={() => setShowGameDropdown(true)}
              onBlur={() => setTimeout(() => setShowGameDropdown(false), 150)}
              style={{ width:'100%', border:'1px solid #e5e7eb', borderRadius:10, padding:'10px 14px', fontSize:14, color:'#1c1917', background:'#f5f5f4', outline:'none', boxSizing:'border-box' }}
            />
            {showGameDropdown && filteredGames.length > 0 && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, boxShadow:'0 4px 12px rgba(0,0,0,0.1)', zIndex:50, maxHeight:180, overflowY:'auto', marginTop:4 }}>
                {filteredGames.map(g => (
                  <button key={g.id} onMouseDown={() => { setSelectedGame(g); setGameSearch(g.name); setShowGameDropdown(false); }}
                    style={{ width:'100%', textAlign:'left', padding:'10px 14px', background:'none', border:'none', borderBottom:'1px solid #f5f5f4', cursor:'pointer', fontSize:14, color:'#1c1917' }}>
                    {g.name}
                    {g.englishName && g.englishName !== 'N/A' && <span style={{ color:'#a8a29e', fontSize:12, marginLeft:6 }}>{g.englishName}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <button onClick={handleStart} style={{ width:'100%', padding:'16px 0', background:'#c2410c', border:'none', borderRadius:16, color:'#fff', fontWeight:700, fontSize:18, cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
        開始計分 →
      </button>
    </div>
  );
}

export default function ScoreSheetPage({ games }) {
  const [setupDone, setSetupDone] = useState(false);
  const [gameInfo, setGameInfo] = useState(null);
  const [playerCount, setPlayerCount] = useState(DEFAULT_PLAYERS);
  const [rowCount, setRowCount] = useState(DEFAULT_ROWS);
  const [playerNames, setPlayerNames] = useState(() => Array(8).fill(''));
  const [rowLabels, setRowLabels] = useState(() => Array(20).fill(''));
  const [cells, setCells] = useState(() => makeGrid(DEFAULT_ROWS, DEFAULT_PLAYERS));
  const [showUploadModal, setShowUploadModal] = useState(false);

  // 同步格子大小
  const syncGrid = (newRows, newCols, oldCells) => {
    return Array.from({ length: newRows }, (_, r) =>
      Array.from({ length: newCols }, (_, c) =>
        oldCells[r]?.[c] ?? ''
      )
    );
  };

  const handleAddPlayer = () => {
    if (playerCount >= 8) return;
    const nc = playerCount + 1;
    setPlayerCount(nc);
    setCells(prev => syncGrid(rowCount, nc, prev));
  };

  const handleRemovePlayer = () => {
    if (playerCount <= 1) return;
    const nc = playerCount - 1;
    setPlayerCount(nc);
    setCells(prev => syncGrid(rowCount, nc, prev));
  };

  const handleAddRow = () => {
    if (rowCount >= 20) return;
    const nr = rowCount + 1;
    setRowCount(nr);
    setCells(prev => syncGrid(nr, playerCount, prev));
  };

  const handleRemoveRow = () => {
    if (rowCount <= 1) return;
    const nr = rowCount - 1;
    setRowCount(nr);
    setCells(prev => syncGrid(nr, playerCount, prev));
  };

  const handleCell = useCallback((r, c, val) => {
    setCells(prev => {
      const next = prev.map(row => [...row]);
      next[r][c] = val;
      return next;
    });
  }, []);

  const handleReset = () => {
    if (!window.confirm('確定要清除所有分數嗎？')) return;
    setCells(makeGrid(rowCount, playerCount));
  };

  // 計算每位玩家總分
  const totals = Array.from({ length: playerCount }, (_, c) =>
    cells.reduce((sum, row) => sum + (parseFloat(row[c]) || 0), 0)
  );

  const maxTotal = Math.max(...totals);

  // 共用 cell 樣式
  const cellStyle = {
    border: '1px solid #e2e8f0',
    padding: '4px',
    minWidth: 72,
    height: 52,
  };

  const inputStyle = {
    width: '100%', height: '100%',
    border: 'none', background: 'transparent',
    textAlign: 'center', fontSize: 18, fontWeight: 600,
    color: '#1c1917', outline: 'none', padding: '0 4px',
  };

  const labelInputStyle = {
    width: '100%', height: '100%',
    border: 'none', background: 'transparent',
    textAlign: 'left', fontSize: 15, fontWeight: 600,
    color: '#57534e', outline: 'none', padding: '0 8px',
  };

  if (!setupDone) {
    return <SetupView onStart={(info) => { setGameInfo(info); setSetupDone(true); }} games={games} />
  }

  return (
    <div style={{ background: '#F5F2EB', minHeight: 'calc(100vh - 60px)', paddingBottom: 32 }}>
      {/* 頂部工具列 */}
      <div style={{ background: '#1c1917', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 14, marginRight: 4 }}>數位計分紙</span>

        {/* 玩家欄位 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '4px 8px' }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>玩家</span>
          <button onClick={handleRemovePlayer} style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
          <span style={{ fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{playerCount}</span>
          <button onClick={handleAddPlayer} style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
        </div>

        {/* 項目列 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '4px 8px' }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>項目</span>
          <button onClick={handleRemoveRow} style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
          <span style={{ fontSize: 14, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{rowCount}</span>
          <button onClick={handleAddRow} style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
        </div>

        <button onClick={() => {
          if (gameInfo?.gameName) {
            if (window.confirm('確定要結束計分，並將成績上傳至排行榜嗎？')) {
              setShowUploadModal(true);
            }
          } else {
            alert('已結束計分！\n（未指定遊戲名稱，無法上傳成績）');
          }
        }} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 10, padding: '4px 10px', color: '#fcd34d', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          結束計分
        </button>
        <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '4px 10px', color: '#fca5a5', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <RotateCcw size={12} /> 清除
        </button>
      </div>

      {/* 計分表格 */}
      <div style={{ overflowX: 'auto', margin: 12 }}>
        <table style={{ borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', width: '100%', minWidth: `${120 + playerCount * 68}px` }}>
          <thead>
            {/* 玩家名稱列 */}
            <tr style={{ background: '#292524' }}>
              <th style={{ ...cellStyle, minWidth: 110, background: '#1c1917', borderColor: '#44403c' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '0 8px' }}>計分項目</span>
              </th>
              {Array.from({ length: playerCount }).map((_, c) => (
                <th key={c} style={{ ...cellStyle, background: c % 2 === 0 ? '#292524' : '#2c2825', borderColor: '#44403c' }}>
                  <input
                    type="text" maxLength={8}
                    placeholder={`玩家 ${c + 1}`}
                    value={playerNames[c]}
                    onChange={e => setPlayerNames(prev => { const n = [...prev]; n[c] = e.target.value; return n; })}
                    style={{ ...inputStyle, color: '#fff', fontWeight: 700, fontSize: 16 }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 計分列 */}
            {Array.from({ length: rowCount }).map((_, r) => (
              <tr key={r} style={{ background: r % 2 === 0 ? '#fff' : '#fafaf9' }}>
                <td style={{ ...cellStyle, minWidth: 110, background: r % 2 === 0 ? '#f5f5f4' : '#eeece9', borderColor: '#e7e5e4' }}>
                  <input
                    type="text" maxLength={16}
                    placeholder={`項目 ${r + 1}`}
                    value={rowLabels[r]}
                    onChange={e => setRowLabels(prev => { const n = [...prev]; n[r] = e.target.value; return n; })}
                    style={{ ...labelInputStyle, color: '#57534e' }}
                  />
                </td>
                {Array.from({ length: playerCount }).map((_, c) => (
                  <td key={c} style={{ ...cellStyle, borderColor: '#e7e5e4', background: r % 2 === 0 ? '#fff' : '#fafaf9' }}>
                    <input
                      type="number" inputMode="numeric"
                      value={cells[r]?.[c] ?? ''}
                      onChange={e => handleCell(r, c, e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                ))}
              </tr>
            ))}

            {/* 總分列 */}
            <tr style={{ background: '#1c1917' }}>
              <td style={{ ...cellStyle, background: '#1c1917', borderColor: '#44403c', paddingLeft: 8 }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 15, paddingLeft: 8 }}>總計</span>
              </td>
              {totals.map((total, c) => (
                <td key={c} style={{ ...cellStyle, background: total === maxTotal && total > 0 ? '#d97706' : '#292524', borderColor: '#44403c', textAlign: 'center' }}>
                  <span style={{ color: total === maxTotal && total > 0 ? '#fff' : '#e7e5e4', fontWeight: 900, fontSize: 20 }}>
                    {total % 1 === 0 ? total : total.toFixed(1)}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#a8a29e', marginTop: 8 }}>
        點擊任何欄位即可編輯・總計自動計算・最高分以金色標示
      </p>

      {showUploadModal && (
        <ScoreUploadModal
          result={{
            players: Array.from({ length: playerCount }, (_, c) => ({
              name: playerNames[c] || `玩家${c + 1}`,
              total: totals[c],
              categories: Object.fromEntries(
                Array.from({ length: rowCount }, (_, r) => [
                  rowLabels[r] || `項目${r + 1}`,
                  parseFloat(cells[r]?.[c]) || 0,
                ])
              ),
            })),
            source: 'scoresheet',
          }}
          games={games}
          defaultGameName={gameInfo?.gameName || ''}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}
