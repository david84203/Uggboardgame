import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Pause, PlayCircle, Volume2, VolumeX } from 'lucide-react';

export default function ChessClockPage() {
  const [isSetup, setIsSetup] = useState(true);

  const [playerCount, setPlayerCount] = useState(4);
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);

  // 聲音設定
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState('beep'); // 'beep' | 'tick'
  const [soundThreshold, setSoundThreshold] = useState(10);

  // 計時狀態（帶入聲音設定的快照，避免設定變更影響進行中的計時）
  const soundSettingsRef = useRef({ soundEnabled, soundType, soundThreshold });

  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);

  const timerRef = useRef(null);
  const totalSeconds = minutes * 60 + seconds;

  function changePlayerCount(delta) {
    const next = Math.min(10, Math.max(2, playerCount + delta));
    setPlayerCount(next);
    setPlayerNames(prev => {
      const arr = [...prev];
      while (arr.length < next) arr.push('');
      return arr.slice(0, next);
    });
  }

  function updatePlayerName(index, name) {
    setPlayerNames(prev => prev.map((n, i) => i === index ? name : n));
  }

  function getDisplayName(index) {
    return playerNames[index]?.trim() || `玩家 ${index + 1}`;
  }

  // 嗶嗶聲
  const playBeep = (isLong = false) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = isLong ? 'square' : 'sine';
      oscillator.frequency.setValueAtTime(isLong ? 500 : 880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(isLong ? 0.3 : 0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (isLong ? 1.0 : 0.2));
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + (isLong ? 1.0 : 0.2));
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  // 滴答聲
  const playTick = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.07);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.07);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  useEffect(() => {
    if (!isRunning || timeLeft === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        const { soundEnabled: se, soundType: st, soundThreshold: sth } = soundSettingsRef.current;

        if (next === 0) {
          if (se) playBeep(true);
        } else if (next <= sth && next > 0 && se) {
          if (st === 'tick') playTick();
          else playBeep(false);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft === 0]);

  const handleStartSetup = () => {
    if (totalSeconds === 0) {
      alert("請設定大於 0 的時間！");
      return;
    }
    soundSettingsRef.current = { soundEnabled, soundType, soundThreshold };
    setCurrentPlayer(1);
    setTimeLeft(totalSeconds);
    setIsRunning(false);
    setIsSetup(false);
  };

  const handleBigButtonClick = () => {
    if (!isRunning && timeLeft === totalSeconds) {
      setIsRunning(true);
    } else {
      setCurrentPlayer(prev => (prev % playerCount) + 1);
      setTimeLeft(totalSeconds);
      setIsRunning(true);
    }
  };

  const handlePauseToggle = () => setIsRunning(!isRunning);

  const handleExit = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    setIsSetup(true);
  };

  const formatTime = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isSetup) {
    return (
      <div className="max-w-lg mx-auto p-6 pb-24 min-h-[calc(100vh-60px)] flex flex-col bg-[#F5F2EB]">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 mt-4">
          <h2 className="text-2xl font-bold text-stone-800 mb-8 text-center">桌遊棋鐘設定</h2>

          <div className="space-y-6">
            {/* 玩家人數設定 */}
            <div>
              <label className="block text-stone-600 font-bold mb-3">玩家人數</label>
              <div className="flex items-center justify-between bg-stone-50 rounded-2xl p-2 border border-stone-200">
                <button
                  onClick={() => changePlayerCount(-1)}
                  className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-stone-600 hover:bg-stone-100"
                >
                  -
                </button>
                <span className="text-2xl font-black text-stone-800">{playerCount} 人</span>
                <button
                  onClick={() => changePlayerCount(1)}
                  className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-stone-600 hover:bg-stone-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* 玩家名字輸入 */}
            <div>
              <label className="block text-stone-600 font-bold mb-3">玩家名字（選填）</label>
              <div className="space-y-2">
                {Array.from({ length: playerCount }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-bold text-stone-400">{i + 1}</span>
                    <input
                      type="text"
                      value={playerNames[i] || ''}
                      onChange={e => updatePlayerName(i, e.target.value)}
                      placeholder={`玩家 ${i + 1}`}
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 text-sm focus:outline-none focus:border-orange-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 倒數時間設定 */}
            <div>
              <label className="block text-stone-600 font-bold mb-3">每回合思考時間</label>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-stone-50 rounded-2xl p-4 border border-stone-200 flex flex-col items-center">
                  <span className="text-xs text-stone-400 font-bold mb-1">分鐘</span>
                  <input
                    type="number"
                    min="0" max="60"
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                    className="w-full bg-transparent text-center text-3xl font-black text-stone-800 focus:outline-none"
                  />
                </div>
                <span className="text-2xl font-bold text-stone-300">:</span>
                <div className="flex-1 bg-stone-50 rounded-2xl p-4 border border-stone-200 flex flex-col items-center">
                  <span className="text-xs text-stone-400 font-bold mb-1">秒數</span>
                  <input
                    type="number"
                    min="0" max="59"
                    value={seconds}
                    onChange={(e) => setSeconds(Number(e.target.value))}
                    className="w-full bg-transparent text-center text-3xl font-black text-stone-800 focus:outline-none"
                  />
                </div>
              </div>
              {/* 常用快速設定 */}
              <div className="flex gap-2 justify-center mt-3">
                {[30, 60, 90, 120].map(sec => (
                  <button
                    key={sec}
                    onClick={() => {
                      setMinutes(Math.floor(sec / 60));
                      setSeconds(sec % 60);
                    }}
                    className="px-3 py-1.5 text-sm bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 font-medium"
                  >
                    {sec}秒
                  </button>
                ))}
              </div>
            </div>

            {/* 聲音設定 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-stone-600 font-bold">倒數提示音</label>
                <button
                  onClick={() => setSoundEnabled(v => !v)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm transition-colors ${
                    soundEnabled
                      ? 'bg-orange-100 text-orange-700 border border-orange-300'
                      : 'bg-stone-100 text-stone-400 border border-stone-200'
                  }`}
                >
                  {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  {soundEnabled ? '開啟' : '關閉'}
                </button>
              </div>

              {soundEnabled && (
                <div className="space-y-3 pl-1">
                  {/* 聲音類型 */}
                  <div className="flex gap-2">
                    {[
                      { value: 'beep', label: '嗶嗶聲', desc: '電子提示音' },
                      { value: 'tick', label: '滴答聲', desc: '時鐘滴答音' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSoundType(opt.value)}
                        className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-bold transition-colors ${
                          soundType === opt.value
                            ? 'border-orange-400 bg-orange-50 text-orange-700'
                            : 'border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100'
                        }`}
                      >
                        <div>{opt.label}</div>
                        <div className="text-xs font-normal opacity-70 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* 從幾秒開始 */}
                  <div>
                    <p className="text-sm text-stone-500 mb-2">從最後幾秒開始提示</p>
                    <div className="flex gap-2 flex-wrap">
                      {[3, 5, 10, 15, 20].map(s => (
                        <button
                          key={s}
                          onClick={() => setSoundThreshold(s)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
                            soundThreshold === s
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                          }`}
                        >
                          {s} 秒
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleStartSetup}
              className="w-full mt-6 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Play fill="currentColor" />
              確認並準備開始
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isTimeUp = timeLeft === 0;

  return (
    <div className="max-w-lg mx-auto min-h-[calc(100vh-60px)] flex flex-col bg-[#F5F2EB]">
      {/* 玩家標示 */}
      <div className="flex-none pt-8 pb-4 flex justify-center">
        <div className="px-8 py-3 bg-stone-800 text-white rounded-full text-2xl font-black shadow-md tracking-wider">
          {getDisplayName(currentPlayer - 1)}
        </div>
      </div>

      {/* 點擊區域 (超大按鈕) */}
      <button
        onClick={handleBigButtonClick}
        className={`flex-1 mx-4 mb-4 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 transition-all duration-150 flex flex-col items-center justify-center group active:scale-[0.98] overflow-hidden ${
          isTimeUp
            ? 'bg-red-500 border-red-600 text-white'
            : !isRunning && timeLeft === totalSeconds
              ? 'bg-amber-400 border-amber-500 text-amber-900'
              : 'bg-white border-stone-200 text-stone-800'
        }`}
      >
        <div className="rotate-90 flex flex-col items-center justify-center w-max">
          {isTimeUp ? (
            <div className="text-center animate-pulse">
              <div className="text-8xl font-black mb-4 tracking-widest">時間到</div>
              <div className="text-3xl font-bold opacity-80">點擊換下一位</div>
            </div>
          ) : !isRunning && timeLeft === totalSeconds ? (
            <div className="text-center">
              <div className="text-4xl font-black mb-6 opacity-80 tracking-widest">準備就緒</div>
              <PlayCircle size={100} className="mx-auto mb-6 opacity-90" />
              <div className="text-3xl font-bold tracking-widest">點擊開始</div>
            </div>
          ) : (
            <div className="text-center flex flex-col items-center">
              <div className="text-[25vh] font-black leading-none tracking-tighter tabular-nums drop-shadow-sm">
                {formatTime(timeLeft)}
              </div>
              <div className="text-3xl font-bold opacity-40 mt-4 tracking-widest uppercase">
                {isRunning ? 'Tap to Next' : 'Paused'}
              </div>
            </div>
          )}
        </div>
      </button>

      {/* 底部控制列 */}
      <div className="flex-none p-6 pt-0 flex gap-4">
        <button
          onClick={handlePauseToggle}
          disabled={!isRunning && timeLeft === totalSeconds}
          className="flex-1 py-4 flex items-center justify-center gap-2 bg-stone-200 text-stone-700 rounded-2xl font-bold text-lg active:bg-stone-300 disabled:opacity-50 disabled:active:scale-100"
        >
          {isRunning ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          {isRunning ? '暫停' : '繼續'}
        </button>
        <button
          onClick={handleExit}
          className="flex-1 py-4 flex items-center justify-center gap-2 bg-stone-800 text-white rounded-2xl font-bold text-lg active:bg-stone-900"
        >
          <Square fill="currentColor" size={20} />
          離開
        </button>
      </div>
    </div>
  );
}
