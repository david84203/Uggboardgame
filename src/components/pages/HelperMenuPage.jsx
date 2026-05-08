import React from 'react';
import { Calculator, Timer, Moon, Flower2, Star, Trophy, TableProperties, Lock, Hourglass, Bell } from 'lucide-react';

export default function HelperMenuPage({ onSelect }) {
  return (
    <div className="max-w-lg mx-auto p-4 pt-6">
      <h2 className="text-center text-stone-600 font-medium mb-6 tracking-wider text-lg">
        實用桌遊輔助 APP
      </h2>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* 計分輔助程式 */}
        <button 
          onClick={() => onSelect('helper-scoring-hub')}
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-stone-200 hover:shadow-md hover:-translate-y-1 transition-all group text-center h-full"
        >
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors mb-3">
            <Calculator className="text-orange-600" size={28} />
          </div>
          <h3 className="text-base font-bold text-stone-800 mb-1 leading-tight">計分輔助程式</h3>
          <p className="text-stone-500 text-xs leading-relaxed">包含萬用計分、農家樂、數位計分紙</p>
        </button>

        {/* 桌遊棋鐘 */}
        <button 
          onClick={() => onSelect('helper-clock')}
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-stone-200 hover:shadow-md hover:-translate-y-1 transition-all group text-center h-full"
        >
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors mb-3">
            <Timer className="text-blue-600" size={28} />
          </div>
          <h3 className="text-base font-bold text-stone-800 mb-1 leading-tight">桌遊回合棋鐘</h3>
          <p className="text-stone-500 text-xs leading-relaxed">單回合固定時間倒數，一鍵換人</p>
        </button>

        {/* 搶答鈴 */}
        <button 
          onClick={() => onSelect('helper-service-bell')}
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-stone-200 hover:shadow-md hover:-translate-y-1 transition-all group text-center h-full"
        >
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors mb-3">
            <Bell className="text-red-600" size={28} />
          </div>
          <h3 className="text-base font-bold text-stone-800 mb-1 leading-tight">搶答鈴</h3>
          <p className="text-stone-500 text-xs leading-relaxed">反應遊戲必備，內建多種搶答音效</p>
        </button>

        {/* 數位沙漏 */}
        <button 
          onClick={() => onSelect('helper-hourglass')}
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-stone-200 hover:shadow-md hover:-translate-y-1 transition-all group text-center h-full"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors mb-3">
            <Hourglass className="text-emerald-600" size={28} />
          </div>
          <h3 className="text-base font-bold text-stone-800 mb-1 leading-tight">數位沙漏</h3>
          <p className="text-stone-500 text-xs leading-relaxed">帶有沙漏動畫的倒數計時器</p>
        </button>

        {/* 陣營遊戲語音旁白 */}
        <button 
          onClick={() => onSelect('helper-voice-hub')}
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-stone-200 hover:shadow-md hover:-translate-y-1 transition-all group text-center h-full"
        >
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors mb-3">
            <Moon className="text-indigo-600" size={28} />
          </div>
          <h3 className="text-base font-bold text-stone-800 mb-1 leading-tight">陣營遊戲語音旁白</h3>
          <p className="text-stone-500 text-xs leading-relaxed">多款陣營遊戲自動語音主持</p>
        </button>

        {/* Star Player 起始玩家選擇器 */}
        <button
          onClick={() => onSelect('helper-star-player')}
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-stone-200 hover:shadow-md hover:-translate-y-1 transition-all group text-center h-full"
        >
          <div className="w-14 h-14 rounded-full bg-yellow-50 flex items-center justify-center shrink-0 group-hover:bg-yellow-100 transition-colors mb-3">
            <Star className="text-yellow-500" size={28} />
          </div>
          <h3 className="text-base font-bold text-stone-800 mb-1 leading-tight">起始玩家抽籤</h3>
          <p className="text-stone-500 text-xs leading-relaxed">多點觸控抽籤，公平決定先手</p>
        </button>
      </div>
    </div>
  );
}
