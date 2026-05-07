import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Hourglass as HourglassIcon } from 'lucide-react';

const PRESETS = [
  { label: '15秒', value: 15 },
  { label: '20秒', value: 20 },
  { label: '30秒', value: 30 },
  { label: '40秒', value: 40 },
  { label: '1分鐘', value: 60 },
];

export default function HourglassPage() {
  const [totalTime, setTotalTime] = useState(30);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  
  // Custom time input states
  const [inputMinutes, setInputMinutes] = useState('0');
  const [inputSeconds, setInputSeconds] = useState('30');

  const timerRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      lastUpdateRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = (now - lastUpdateRef.current) / 1000;
        lastUpdateRef.current = now;
        
        setTimeLeft(prev => {
          const next = prev - delta;
          if (next <= 0) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            return 0;
          }
          return next;
        });
      }, 50); // High update rate for smooth animation
    } else if (!isRunning && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft]);

  const handleStartPause = () => {
    if (timeLeft <= 0) return;
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(totalTime);
  };

  const setPreset = (sec) => {
    setIsRunning(false);
    setTotalTime(sec);
    setTimeLeft(sec);
    setInputMinutes(Math.floor(sec / 60).toString());
    setInputSeconds((sec % 60).toString());
  };

  const applyCustomTime = () => {
    const m = parseInt(inputMinutes) || 0;
    const s = parseInt(inputSeconds) || 0;
    const totalSec = m * 60 + s;
    if (totalSec > 0) {
      setIsRunning(false);
      setTotalTime(totalSec);
      setTimeLeft(totalSec);
    }
  };

  const progress = totalTime > 0 ? Math.max(0, Math.min(1, timeLeft / totalTime)) : 0;
  // progress: 1 means full top, 0 means empty top

  // 時間格式化 (MM:SS)
  const displayMin = Math.floor(Math.ceil(timeLeft) / 60);
  const displaySec = Math.ceil(timeLeft) % 60;
  const timeString = `${displayMin.toString().padStart(2, '0')}:${displaySec.toString().padStart(2, '0')}`;

  return (
    <div style={{ maxWidth: 512, margin: '0 auto', padding: '16px 16px 60px', minHeight: 'calc(100vh - 60px)', background: '#F5F2EB', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 900, color: '#1c1917', margin: '16px 0 20px', letterSpacing: 1 }}>數位沙漏</h2>

      {/* 自訂時間 */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid #e5e7eb', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ fontWeight: 700, color: '#57534e' }}>自訂</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
          <input
            type="number" min="0" max="99" value={inputMinutes}
            onChange={(e) => setInputMinutes(e.target.value)}
            disabled={isRunning}
            style={{ width: 60, padding: 8, borderRadius: 8, border: '1px solid #d6d3d1', textAlign: 'center', fontSize: 16, fontWeight: 700 }}
          />
          <span style={{ color: '#78716c', fontWeight: 700 }}>分</span>
          <input
            type="number" min="0" max="59" value={inputSeconds}
            onChange={(e) => setInputSeconds(e.target.value)}
            disabled={isRunning}
            style={{ width: 60, padding: 8, borderRadius: 8, border: '1px solid #d6d3d1', textAlign: 'center', fontSize: 16, fontWeight: 700 }}
          />
          <span style={{ color: '#78716c', fontWeight: 700 }}>秒</span>
        </div>
        <button 
          onClick={applyCustomTime} disabled={isRunning}
          style={{ background: '#44403c', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: isRunning ? 'not-allowed' : 'pointer', opacity: isRunning ? 0.5 : 1 }}
        >
          設定
        </button>
      </div>

      {/* 動畫區 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', position: 'relative' }}>
        
        {/* 精緻 SVG 沙漏 */}
        <div style={{ position: 'relative', width: 160, height: 280, filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.15))' }}>
          <svg viewBox="0 0 100 200" width="160" height="280">
            <defs>
              <clipPath id="topGlass">
                <path d="M 25 15 C 25 50, 45 80, 48 98 C 48 100, 52 100, 52 98 C 55 80, 75 50, 75 15 Z" />
              </clipPath>
              <clipPath id="bottomGlass">
                <path d="M 48 102 C 45 120, 25 150, 25 185 L 75 185 C 75 150, 55 120, 52 102 C 52 100, 48 100, 48 102 Z" />
              </clipPath>
              <linearGradient id="sandGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="glassReflection" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                <stop offset="25%" stopColor="rgba(255,255,255,0.1)" />
                <stop offset="75%" stopColor="rgba(255,255,255,0.0)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
              </linearGradient>
              <linearGradient id="woodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#92400e" />
                <stop offset="50%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
            </defs>

            {/* 後方木柱 */}
            <rect x="22" y="5" width="4" height="190" fill="#451a03" />
            <rect x="74" y="5" width="4" height="190" fill="#451a03" />

            {/* 玻璃背景 */}
            <path d="M 25 15 C 25 50, 45 80, 48 98 C 48 100, 52 100, 52 98 C 55 80, 75 50, 75 15 Z" fill="rgba(255,255,255,0.4)" />
            <path d="M 48 102 C 45 120, 25 150, 25 185 L 75 185 C 75 150, 55 120, 52 102 C 52 100, 48 100, 48 102 Z" fill="rgba(255,255,255,0.4)" />

            {/* 上半部沙子 */}
            <rect x="0" y={15 + (1 - progress) * 85} width="100" height={progress * 85} fill="url(#sandGrad)" clipPath="url(#topGlass)" style={{ transition: 'y 0.1s linear, height 0.1s linear' }} />
            
            {/* 漏沙水柱 */}
            {isRunning && timeLeft > 0 && (
              <rect x="49" y="100" width="2" height={(185 - (1 - progress) * 85) - 100} fill="url(#sandGrad)" opacity="0.9" />
            )}

            {/* 下半部沙子 */}
            <rect x="0" y={185 - (1 - progress) * 85} width="100" height={(1 - progress) * 85} fill="url(#sandGrad)" clipPath="url(#bottomGlass)" style={{ transition: 'y 0.1s linear, height 0.1s linear' }} />

            {/* 玻璃反光與邊緣 */}
            <path d="M 25 15 C 25 50, 45 80, 48 98 C 48 100, 52 100, 52 98 C 55 80, 75 50, 75 15 Z" fill="url(#glassReflection)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
            <path d="M 48 102 C 45 120, 25 150, 25 185 L 75 185 C 75 150, 55 120, 52 102 C 52 100, 48 100, 48 102 Z" fill="url(#glassReflection)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />

            {/* 前方木柱 */}
            <rect x="12" y="5" width="8" height="190" rx="3" fill="url(#woodGrad)" stroke="#451a03" strokeWidth="0.5" />
            <rect x="80" y="5" width="8" height="190" rx="3" fill="url(#woodGrad)" stroke="#451a03" strokeWidth="0.5" />

            {/* 頂部木蓋 */}
            <rect x="5" y="0" width="90" height="12" rx="4" fill="url(#woodGrad)" stroke="#451a03" strokeWidth="1" />
            <rect x="10" y="12" width="80" height="4" fill="#451a03" />

            {/* 底部木蓋 */}
            <rect x="10" y="184" width="80" height="4" fill="#451a03" />
            <rect x="5" y="188" width="90" height="12" rx="4" fill="url(#woodGrad)" stroke="#451a03" strokeWidth="1" />
          </svg>
        </div>

        {/* 倒數數字 */}
        <div style={{ fontSize: 64, fontWeight: 900, color: timeLeft === 0 ? '#ef4444' : '#1c1917', fontVariantNumeric: 'tabular-nums', marginTop: 24, textShadow: '0 2px 10px rgba(0,0,0,0.05)', transition: 'color 0.3s' }}>
          {timeString}
        </div>
        {timeLeft === 0 && <div className="animate-bounce" style={{ color: '#ef4444', fontWeight: 700, fontSize: 20, marginTop: 8 }}>時間到！</div>}

      </div>

      {/* 控制按鈕 */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
        <button 
          onClick={handleStop}
          style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff', border: '2px solid #e5e7eb', color: '#57534e', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        >
          <Square size={24} fill="currentColor" />
        </button>
        <button 
          onClick={handleStartPause}
          style={{ width: 80, height: 80, borderRadius: '50%', background: isRunning ? '#f59e0b' : '#1c1917', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transition: 'all 0.2s' }}
        >
          {isRunning ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" style={{ marginLeft: 6 }} />}
        </button>
      </div>

      {/* 預設時間按鈕 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {PRESETS.map(preset => (
          <button
            key={preset.value}
            onClick={() => setPreset(preset.value)}
            style={{ padding: '10px 16px', background: totalTime === preset.value ? '#fef3c7' : '#fff', border: totalTime === preset.value ? '2px solid #f59e0b' : '1px solid #e5e7eb', borderRadius: 12, color: totalTime === preset.value ? '#d97706' : '#57534e', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
