import React from 'react';
import { Calculator, Timer } from 'lucide-react';

export default function HelperMenuPage({ onSelect }) {
  return (
    <div className="max-w-lg mx-auto p-4 pt-6">
      <h2 className="text-center text-stone-600 font-medium mb-6 tracking-wider text-lg">
        實用桌遊輔助 APP
      </h2>
      
      <div className="grid gap-4">
        {/* 農家樂計分器 */}
        <button 
          onClick={() => onSelect('helper-agricola')}
          className="flex items-center p-5 bg-white rounded-2xl shadow-sm border border-stone-200 hover:shadow-md hover:-translate-y-1 transition-all group"
        >
          <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
            <Calculator className="text-orange-600" size={28} />
          </div>
          <div className="ml-4 text-left">
            <h3 className="text-xl font-bold text-stone-800 mb-1">農家樂計分器</h3>
            <p className="text-stone-500 text-sm">農家樂 Agricola 專用計分表，支援五人</p>
          </div>
        </button>

        {/* 桌遊棋鐘 */}
        <button 
          onClick={() => onSelect('helper-clock')}
          className="flex items-center p-5 bg-white rounded-2xl shadow-sm border border-stone-200 hover:shadow-md hover:-translate-y-1 transition-all group"
        >
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
            <Timer className="text-blue-600" size={28} />
          </div>
          <div className="ml-4 text-left">
            <h3 className="text-xl font-bold text-stone-800 mb-1">桌遊回合棋鐘</h3>
            <p className="text-stone-500 text-sm">單回合固定時間倒數，一鍵換人</p>
          </div>
        </button>
      </div>
    </div>
  );
}
