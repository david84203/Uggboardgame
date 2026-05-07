import React from 'react';
import { Calculator, Timer, Moon, Flower2, Star, Trophy, TableProperties, Lock, Hourglass, Bell } from 'lucide-react';

export default function HelperMenuPage({ onSelect }) {
  return (
    <div className="max-w-lg mx-auto p-4 pt-6">
      <h2 className="text-center text-stone-600 font-medium mb-6 tracking-wider text-lg">
        實用桌遊輔助 APP
      </h2>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* 萬用計分器 (已鎖定) */}
        <button 
          onClick={() => alert('萬用計分器為會員專屬功能，請先登入會員！')}
          className="relative flex flex-col items-center p-4 bg-white/60 rounded-2xl shadow-sm border border-stone-200 transition-all group overflow-hidden text-center h-full"
        >
          {/* 鎖定遮罩 */}
          <div className="absolute inset-0 bg-stone-50/50 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-stone-800 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <Lock size={14} /> 會員專屬
            </div>
          </div>
          
          <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center shrink-0 opacity-70 mb-3">
            <Trophy className="text-stone-400" size={28} />
          </div>
          <div className="opacity-70 flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <h3 className="text-base font-bold text-stone-800 leading-tight">萬用計分器</h3>
              <Lock size={14} className="text-stone-400" />
            </div>
            <p className="text-stone-500 text-xs leading-relaxed">適用任何桌遊即時排名與回合管理</p>
          </div>
        </button>

        {/* 農家樂計分器 */}
        <button 
          onClick={() => onSelect('helper-agricola')}
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-stone-200 hover:shadow-md hover:-translate-y-1 transition-all group text-center h-full"
        >
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors mb-3">
            <Calculator className="text-orange-600" size={28} />
          </div>
          <h3 className="text-base font-bold text-stone-800 mb-1 leading-tight">農家樂計分器</h3>
          <p className="text-stone-500 text-xs leading-relaxed">Agricola 專用計分表支援五人</p>
        </button>

        {/* 數位計分紙 */}
        <button 
          onClick={() => onSelect('helper-scoresheet')}
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-stone-200 hover:shadow-md hover:-translate-y-1 transition-all group text-center h-full"
        >
          <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition-colors mb-3">
            <TableProperties className="text-teal-600" size={28} />
          </div>
          <h3 className="text-base font-bold text-stone-800 mb-1 leading-tight">數位計分紙</h3>
          <p className="text-stone-500 text-xs leading-relaxed">自訂項目與玩家，自動結算總分</p>
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

        {/* 奶酪大盜語音旁白 */}
        <button 
          onClick={() => onSelect('helper-cheese-thief')}
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-stone-200 hover:shadow-md hover:-translate-y-1 transition-all group text-center h-full"
        >
          <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors mb-3">
            <Moon className="text-purple-600" size={28} />
          </div>
          <h3 className="text-base font-bold text-stone-800 mb-1 leading-tight">奶酪大盜旁白</h3>
          <p className="text-stone-500 text-xs leading-relaxed">Cheese Thief 自動語音主持</p>
        </button>

        {/* 血與刃的白薔薇語音旁白 */}
        <button
          onClick={() => onSelect('helper-blades-rose')}
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-stone-200 hover:shadow-md hover:-translate-y-1 transition-all group text-center h-full"
        >
          <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors mb-3">
            <Flower2 className="text-rose-600" size={28} />
          </div>
          <h3 className="text-base font-bold text-stone-800 mb-1 leading-tight">血與刃的白薔薇旁白</h3>
          <p className="text-stone-500 text-xs leading-relaxed">Blades &amp; Rose 自動語音主持</p>
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
