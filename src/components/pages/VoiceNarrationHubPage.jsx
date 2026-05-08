import React from 'react';
import { Flower2 } from 'lucide-react';

export default function VoiceNarrationHubPage({ onSelect }) {
  return (
    <div className="max-w-lg mx-auto p-4 pt-6">
      <h2 className="text-center text-stone-600 font-medium mb-6 tracking-wider text-lg">
        選擇語音旁白遊戲
      </h2>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* 奶酪大盜語音旁白 */}
        <button 
          onClick={() => onSelect('helper-cheese-thief')}
          className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-stone-200 hover:shadow-md hover:-translate-y-1 transition-all group text-center h-full"
        >
          <div className="w-14 h-14 rounded-full bg-yellow-50 flex items-center justify-center shrink-0 group-hover:bg-yellow-100 transition-colors mb-3">
            <span className="text-3xl">🧀</span>
          </div>
          <h3 className="text-base font-bold text-stone-800 mb-1 leading-tight">奶酪大盜</h3>
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
          <h3 className="text-base font-bold text-stone-800 mb-1 leading-tight">血與刃的白薔薇</h3>
          <p className="text-stone-500 text-xs leading-relaxed">Blades &amp; Rose 自動語音主持</p>
        </button>
      </div>
    </div>
  );
}
