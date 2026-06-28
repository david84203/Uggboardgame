import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

// 尋找最適合的中文語音（支援 Android、iOS 各種平台）
function getBestChineseVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  const preferred = ['zh-TW', 'zh-HK', 'zh-CN', 'zh'];
  for (const lang of preferred) {
    const v = voices.find(v => v.lang === lang || v.lang.startsWith(lang));
    if (v) return v;
  }
  return voices[0] || null;
}

// 數字轉國字（1~99 夠用），讓語音念得自然
function numToZh(n) {
  const d = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (n < 10) return d[n];
  if (n < 20) return n === 10 ? '十' : '十' + d[n % 10];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return d[tens] + '十' + (ones ? d[ones] : '');
}

const PRESETS = [5, 9, 15, 30];
const INTRO_TEXT = '請大家閉上眼睛。老實人請睜開眼睛，拿起題目卡，偷看背面的答案。';
const END_TEXT = '時間到，請老實人放下卡片並閉上眼睛，請大家睜開眼睛。';

export default function BsKingPage() {
  const [phase, setPhase] = useState('idle'); // idle | intro | running | done
  const [total, setTotal] = useState(9);
  const [timeLeft, setTimeLeft] = useState(9);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const timerRef = useRef(null);
  const timeLeftRef = useRef(9);
  const voiceEnabledRef = useRef(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;

  // 預熱語音清單（部分瀏覽器首次 getVoices 會是空的）
  useEffect(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices();
  }, []);

  // 元件卸載時收尾
  useEffect(() => () => {
    clearInterval(timerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  const speak = (text) => {
    if (!voiceEnabledRef.current || !window.speechSynthesis || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    const voice = getBestChineseVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'zh-TW';
    u.rate = 1; u.pitch = 1; u.volume = 1;
    window.speechSynthesis.speak(u);
  };

  // 念完一句話再執行 cb（附逾時保險，避免某些平台 onend 不觸發而卡住）
  const speakThen = (text, cb) => {
    if (!voiceEnabledRef.current || !window.speechSynthesis || !text) { cb(); return; }
    const u = new SpeechSynthesisUtterance(text);
    const voice = getBestChineseVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'zh-TW';
    u.rate = 1; u.pitch = 1; u.volume = 1;
    let done = false;
    const finish = () => { if (done) return; done = true; cb(); };
    const fallback = setTimeout(finish, Math.max(2500, text.length * 220) + 1500);
    u.onend = () => { clearTimeout(fallback); finish(); };
    u.onerror = () => { clearTimeout(fallback); finish(); };
    window.speechSynthesis.speak(u);
  };

  // 時間到的長嗶聲
  const playEndBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 1.0);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  // 倒數一拍（發聲動作放在 setState 外面，避免開發模式被呼叫兩次而念兩遍）
  const tick = () => {
    const next = timeLeftRef.current - 1;
    timeLeftRef.current = next;
    setTimeLeft(next);
    if (next > 0) {
      speak(numToZh(next));
    } else {
      clearInterval(timerRef.current);
      timerRef.current = null;
      speak(END_TEXT);
      playEndBeep();
      setPhase('done');
    }
  };

  const beginCountdown = () => {
    clearInterval(timerRef.current);
    timeLeftRef.current = total;
    setTimeLeft(total);
    setPhase('running');
    speak(numToZh(total)); // 立刻喊出第一個數字
    timerRef.current = setInterval(tick, 1000);
  };

  const start = () => {
    window.speechSynthesis?.cancel();
    clearInterval(timerRef.current);
    setPhase('intro');
    speakThen(INTRO_TEXT, beginCountdown); // 語音關閉時會直接進倒數
  };

  const reset = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    window.speechSynthesis?.cancel();
    setPhase('idle');
    setTimeLeft(total);
  };

  // ===== 設定畫面 =====
  if (phase === 'idle') {
    return (
      <div className="max-w-lg mx-auto p-6 pb-24 min-h-[calc(100vh-60px)] flex flex-col bg-[#F5F2EB]">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 mt-4">
          <h2 className="text-2xl font-bold text-stone-800 mb-1 text-center">瞎掰王 偷看計時</h2>
          <p className="text-center text-stone-500 text-sm mb-8 leading-relaxed">
            按下開始後，App 會先請大家閉眼、<br />
            老實人偷看題目背面答案，再大聲倒數。
          </p>

          <div className="space-y-6">
            {/* 秒數設定 */}
            <div>
              <label className="block text-stone-600 font-bold mb-3 text-center">偷看秒數</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setTotal(t => Math.max(3, t - 1))}
                  className="w-12 h-12 rounded-xl bg-stone-100 shadow-sm flex items-center justify-center text-2xl font-bold text-stone-600 hover:bg-stone-200"
                >
                  -
                </button>
                <span className="text-5xl font-black text-stone-800 tabular-nums w-24 text-center">{total}</span>
                <button
                  onClick={() => setTotal(t => Math.min(60, t + 1))}
                  className="w-12 h-12 rounded-xl bg-stone-100 shadow-sm flex items-center justify-center text-2xl font-bold text-stone-600 hover:bg-stone-200"
                >
                  +
                </button>
              </div>
              <div className="flex gap-2 justify-center mt-4">
                {PRESETS.map(s => (
                  <button
                    key={s}
                    onClick={() => setTotal(s)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
                      total === s
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    {s} 秒
                  </button>
                ))}
              </div>
              <p className="text-center text-stone-400 text-xs mt-3">標準瞎掰王是 9 秒</p>
            </div>

            {/* 語音開關 */}
            <div className="flex items-center justify-between">
              <label className="text-stone-600 font-bold">語音主持</label>
              <button
                onClick={() => setVoiceEnabled(v => !v)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm transition-colors ${
                  voiceEnabled
                    ? 'bg-orange-100 text-orange-700 border border-orange-300'
                    : 'bg-stone-100 text-stone-400 border border-stone-200'
                }`}
              >
                {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                {voiceEnabled ? '開啟' : '關閉'}
              </button>
            </div>

            <button
              onClick={start}
              className="w-full mt-2 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Play fill="currentColor" />
              開始
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== 開場引導畫面 =====
  if (phase === 'intro') {
    return (
      <div className="max-w-lg mx-auto min-h-[calc(100vh-60px)] flex flex-col bg-[#F5F2EB]">
        <div className="flex-1 mx-4 mt-6 mb-4 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 bg-white border-stone-200 text-stone-800 flex flex-col items-center justify-center text-center px-8">
          <div className="text-7xl mb-6">🙈</div>
          <div className="text-3xl font-black mb-3 leading-snug">請大家閉上眼睛</div>
          <div className="text-lg text-stone-500 leading-relaxed">老實人睜眼，<br />拿起題目卡偷看背面答案</div>
        </div>
        <div className="flex-none p-6 pt-0">
          <button
            onClick={beginCountdown}
            className="w-full py-4 flex items-center justify-center gap-2 bg-orange-600 text-white rounded-2xl font-bold text-lg active:bg-orange-700"
          >
            跳過，直接倒數
          </button>
        </div>
      </div>
    );
  }

  // ===== 倒數 / 結束畫面 =====
  const isDone = phase === 'done';
  return (
    <div className="max-w-lg mx-auto min-h-[calc(100vh-60px)] flex flex-col bg-[#F5F2EB]">
      <div
        className={`flex-1 mx-4 mt-6 mb-4 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 flex flex-col items-center justify-center transition-colors duration-200 ${
          isDone ? 'bg-red-500 border-red-600 text-white' : 'bg-white border-stone-200 text-stone-800'
        }`}
      >
        {isDone ? (
          <div className="text-center animate-pulse">
            <div className="text-7xl font-black tracking-widest mb-3">時間到</div>
            <div className="text-2xl font-bold opacity-80">放下卡片，睜眼！</div>
          </div>
        ) : (
          <div className="text-[40vw] sm:text-[16rem] font-black leading-none tabular-nums drop-shadow-sm">
            {timeLeft}
          </div>
        )}
      </div>

      <div className="flex-none p-6 pt-0 flex gap-4">
        <button
          onClick={reset}
          className="flex-1 py-4 flex items-center justify-center gap-2 bg-stone-200 text-stone-700 rounded-2xl font-bold text-lg active:bg-stone-300"
        >
          <RotateCcw size={20} />
          重設
        </button>
        <button
          onClick={start}
          className="flex-1 py-4 flex items-center justify-center gap-2 bg-orange-600 text-white rounded-2xl font-bold text-lg active:bg-orange-700"
        >
          <Play fill="currentColor" size={20} />
          {isDone ? '再來一次' : '重新開始'}
        </button>
      </div>
    </div>
  );
}
