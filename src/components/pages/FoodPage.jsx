const FOOD_ITEMS = [
  { name: '泡麵加蛋', price: 70, category: 'food' },
  { name: '米漢堡', desc: '豬肉～超好吃', price: 75, category: 'food', highlight: true },
  { name: '炸物拼盤', desc: '薯條＋雞米花＋雞塊 x6', price: 120, category: 'food' },
];

const DRINK_ITEMS = [
  { name: '可樂', price: 25, category: 'drink' },
  { name: '可爾必思', price: 25, category: 'drink' },
];

const SNACK_ITEMS = [
  { name: '科學麵', unit: '一包', price: 15 },
  { name: '迷你品客（紅）', unit: '一包', price: 15 },
  { name: '迷你品客（綠）', unit: '一包', price: 15 },
  { name: '果汁牛奶', unit: '一瓶', price: 20 },
  { name: '韓式沙琪瑪', unit: '一包', price: 20 },
  { name: '巧克力酥餅', unit: '一包', price: 25 },
  { name: 'Mini 可樂果', unit: '一包', price: 25 },
  { name: 'Mini 卡迪那', unit: '一包', price: 25 },
  { name: '明治小熊餅乾', unit: '一包', price: 25 },
  { name: '多利多滋隨手包', unit: '一包', price: 30 },
  { name: '健達繽紛樂', unit: '一條', price: 35 },
  { name: '超司口味品客', unit: '一罐', price: 35 },
  { name: '玉米糙米脆片', unit: '一包', price: 35 },
  { name: '義美小泡芙', unit: '一包', price: 35 },
  { name: '八寶粥', unit: '一罐', price: 40 },
  { name: '卡迪那薯條', unit: '一包', price: 40 },
];

export default function FoodPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

      {/* ===== 餐點 ===== */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 flex items-center gap-2">
          <span className="text-white text-base">🍽️</span>
          <h2 className="font-bold text-white text-base">餐點</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {FOOD_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-700 text-base font-medium">{item.name}</span>
                  {item.highlight && (
                    <span className="text-xs bg-red-50 text-red-500 font-semibold px-1.5 py-0.5 rounded-full">推薦</span>
                  )}
                </div>
                {item.desc && (
                  <p className="text-sm text-stone-400 mt-0.5">{item.desc}</p>
                )}
              </div>
              <span className="text-orange-600 font-bold text-base">{item.price} 元</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 飲料 ===== */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2.5 flex items-center gap-2">
          <span className="text-white text-base">🥤</span>
          <h2 className="font-bold text-white text-base">飲料</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {DRINK_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-stone-700 text-base font-medium">{item.name}</span>
              <span className="text-orange-600 font-bold text-base">{item.price} 元</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 套餐優惠 ===== */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-xl shrink-0">🎉</span>
        <div>
          <h3 className="font-bold text-amber-700 text-base mb-1">套餐組合優惠</h3>
          <p className="text-stone-600 text-base leading-relaxed">
            凡點任意餐點，加點飲料<span className="font-bold text-orange-600">折 5 元</span>！
          </p>
        </div>
      </div>

      {/* ===== 誠實商店 ===== */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 px-4 py-2.5 flex items-center gap-2">
          <span className="text-white text-base">🏪</span>
          <h2 className="font-bold text-white text-base">誠實商店</h2>
        </div>

        {/* 說明文字 */}
        <div className="px-4 py-3 bg-amber-50 border-b border-stone-100">
          <p className="text-sm text-stone-600 leading-relaxed">
            可至 <span className="font-bold text-amber-700">1樓 H5 櫃位</span>或<span className="font-bold text-amber-700">2樓樓梯轉角鐵架</span>選購，零食不定期調整品項，如有品項未標明價格可洽詢店員，若選購區無價目表上的品項為正常現象。
          </p>
        </div>

        {/* 零食價目表 */}
        <div className="divide-y divide-stone-100">
          {SNACK_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-stone-700 text-base font-medium">{item.name}</span>
                <span className="text-xs text-stone-400">({item.unit})</span>
              </div>
              <span className="text-orange-600 font-bold text-base">{item.price} 元</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 供餐時間 & 注意事項 ===== */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">⏰</span>
          <p className="text-stone-700 text-base font-bold">
            供餐時間至 <span className="text-orange-600">21:00</span>
          </p>
        </div>
        <div className="border-t border-stone-200 pt-2.5 space-y-1.5">
          <p className="text-sm text-stone-500 leading-relaxed flex items-start gap-2">
            <span className="shrink-0">•</span>
            <span>用餐完畢請放至回收台</span>
          </p>
          <p className="text-sm text-stone-500 leading-relaxed flex items-start gap-2">
            <span className="shrink-0">•</span>
            <span>吃喝都請小心，不要打翻</span>
          </p>
        </div>
      </div>

      {/* ===== 底部提示 ===== */}
      <p className="text-center text-sm text-stone-400 pb-2">
        如有任何疑問，歡迎洽詢店員 🙏
      </p>

    </div>
  );
}
