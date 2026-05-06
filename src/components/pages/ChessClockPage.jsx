import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, Pause, PlayCircle } from 'lucide-react';

export default function ChessClockPage() {
  const [isSetup, setIsSetup] = useState(true);
  
  // 設定狀態
  const [playerCount, setPlayerCount] = useState(4);
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);
  
  // 計時狀態
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60); // 總秒數
  const [isRunning, setIsRunning] = useState(false);
  
  // 使用 useRef 來儲存 setInterval ID，確保能正確清除
  const timerRef = useRef(null);
  
  const totalSeconds = minutes * 60 + seconds;

  const playBeep = (isLong = false) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = isLong ? 'square' : 'sine';
      oscillator.frequency.setValueAtTime(isLong ? 500 : 880, audioCtx.currentTime); 
      
      gainNode.gain.setValueAtTime(isLong ? 0.3 : 0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (isLong ? 1.0 : 0.2));
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + (isLong ? 1.0 : 0.2));
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  // 處理計時邏輯
  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 10 && next > 0) {
          playBeep(false); // 短嗶聲
        } else if (next === 0) {
          playBeep(true);  // 長嗶聲
          clearInterval(timerRef.current);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const handleStartSetup = () => {
    if (totalSeconds === 0) {
      alert("請設定大於 0 的時間！");
      return;
    }
    setCurrentPlayer(1);
    setTimeLeft(totalSeconds);
    setIsRunning(false); // 進入畫面時先不計時
    setIsSetup(false);
  };

  const handleBigButtonClick = () => {
    if (!isRunning) {
      // 第一次點擊：開始計時
      setIsRunning(true);
    } else {
      // 計時中點擊：換下一位玩家並重置時間
      setCurrentPlayer(prev => (prev % playerCount) + 1);
      setTimeLeft(totalSeconds);
    }
  };

  const handlePauseToggle = () => {
    setIsRunning(!isRunning);
  };

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
                  onClick={() => setPlayerCount(Math.max(2, playerCount - 1))}
                  className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-stone-600 hover:bg-stone-100"
                >
                  -
                </button>
                <span className="text-2xl font-black text-stone-800">{playerCount} 人</span>
                <button 
                  onClick={() => setPlayerCount(Math.min(10, playerCount + 1))}
                  className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-stone-600 hover:bg-stone-100"
                >
                  +
                </button>
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
            </div>

            {/* 常用按鈕 (Quick Set) */}
            <div className="flex gap-2 justify-center pt-2">
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

  // 決定背景顏色（時間到時變紅）
  const isTimeUp = timeLeft === 0;
  
  return (
    <div className="max-w-lg mx-auto min-h-[calc(100vh-60px)] flex flex-col bg-[#F5F2EB]">
      {/* 玩家標示 */}
      <div className="flex-none pt-8 pb-4 flex justify-center">
        <div className="px-8 py-3 bg-stone-800 text-white rounded-full text-2xl font-black shadow-md tracking-wider">
          玩家 {currentPlayer}
        </div>
      </div>

      {/* 點擊區域 (超大按鈕) */}
      <div className="flex-1 p-3 flex items-stretch justify-center pb-4">
        <button 
          onClick={handleBigButtonClick}
          className={`w-full h-full rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 transition-all duration-150 flex flex-col items-center justify-center group active:scale-[0.98] ${
            isTimeUp 
              ? 'bg-red-500 border-red-600 text-white' 
              : !isRunning && timeLeft === totalSeconds
                ? 'bg-amber-400 border-amber-500 text-amber-900'
                : 'bg-white border-stone-200 text-stone-800'
          }`}
        >
          {isTimeUp ? (
            <div className="text-center animate-pulse">
              <div className="text-7xl font-black mb-4">時間到</div>
              <div className="text-xl font-bold opacity-80">點擊換下一位玩家</div>
            </div>
          ) : !isRunning && timeLeft === totalSeconds ? (
            <div className="text-center">
              <div className="text-3xl font-black mb-4 opacity-80">準備就緒</div>
              <PlayCircle size={80} className="mx-auto mb-4 opacity-90" />
              <div className="text-2xl font-bold">點擊開始</div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-[7rem] font-black leading-none tracking-tighter tabular-nums drop-shadow-sm">
                {formatTime(timeLeft)}
              </div>
              <div className="text-xl font-bold opacity-40 mt-4 tracking-widest uppercase">
                {isRunning ? 'Tap to Next' : 'Paused'}
              </div>
            </div>
          )}
        </button>
      </div>

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
