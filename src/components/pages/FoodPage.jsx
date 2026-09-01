import { useEffect, useState } from 'react';
import Papa from 'papaparse';

// Google Sheet「餐點價目」分頁
// 欄位：類別 / 品名 / 說明 / 單位 / 價格 / 推薦 / 停售
//
// 走 gviz 端點而非「發布到網路」的 pub URL：Sheet 本身已是「知道連結的任何人可檢視」，
// gviz 讀得到且幾乎即時（pub 的 CSV 有約 5 分鐘快取），也不必去動工作表1 的發布設定。
const MENU_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw/gviz/tq?tqx=out:csv&gid=2121065632';

const TICKED = ['v', 'V', 'ˇ', '✓', '√', '✔', '1'];
const isTicked = (raw) => TICKED.includes((raw || '').trim());

function useMenu() {
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    fetch(`${MENU_CSV_URL}&_=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((csv) => {
        const { data } = Papa.parse(csv, {
          header: true,
          skipEmptyLines: 'greedy',
          transformHeader: (h) => h.trim(),
        });

        const items = data
          .map((row) => ({
            category: (row['類別'] || '').trim(),
            name: (row['品名'] || '').trim(),
            desc: (row['說明'] || '').trim(),
            unit: (row['單位'] || '').trim(),
            price: (row['價格'] || '').trim(),
            highlight: isTicked(row['推薦']),
            stopped: isTicked(row['停售']),
          }))
          .filter((it) => it.name && it.price && !it.stopped);

        if (!items.length) throw new Error('價目表沒有資料');
        if (alive) setMenu(items);
      })
      .catch((err) => {
        console.error('❌ 價目表載入失敗:', err);
        if (alive) setError(err);
      });

    return () => { alive = false; };
  }, []);

  return { menu, error };
}

function Price({ children }) {
  return <span className="text-orange-600 font-bold text-base shrink-0">{children} 元</span>;
}

function Section({ title, icon, gradient, children }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
      <div className={`bg-gradient-to-r ${gradient} px-4 py-2.5 flex items-center gap-2`}>
        <span className="text-white text-base">{icon}</span>
        <h2 className="font-bold text-white text-base">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function FoodPage() {
  const { menu, error } = useMenu();

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center space-y-3">
        <div className="text-4xl">🙏</div>
        <p className="text-stone-700 text-base font-bold">價目表暫時載入不了</p>
        <p className="text-stone-500 text-sm leading-relaxed">
          請重新整理再試一次，<br />或直接洽詢店員詢問價格。
        </p>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-stone-400 text-base">價目表載入中…</p>
      </div>
    );
  }

  const pick = (cat) => menu.filter((it) => it.category === cat);
  const foods = pick('餐點');
  const drinks = pick('飲料');
  const snacks = pick('零食');

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

      {/* ===== 餐點 ===== */}
      {foods.length > 0 && (
        <Section title="餐點" icon="🍽️" gradient="from-orange-500 to-amber-500">
          <div className="divide-y divide-stone-100">
            {foods.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5">
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
                <Price>{item.price}</Price>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ===== 飲料 ===== */}
      {drinks.length > 0 && (
        <Section title="飲料" icon="🥤" gradient="from-sky-500 to-cyan-500">
          <div className="divide-y divide-stone-100">
            {drinks.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div>
                  <span className="text-stone-700 text-base font-medium">{item.name}</span>
                  {item.desc && (
                    <p className="text-sm text-stone-400 mt-0.5">{item.desc}</p>
                  )}
                </div>
                <Price>{item.price}</Price>
              </div>
            ))}
          </div>
        </Section>
      )}

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
      {snacks.length > 0 && (
        <Section title="誠實商店" icon="🏪" gradient="from-yellow-500 to-amber-500">
          <div className="px-4 py-3 bg-amber-50 border-b border-stone-100">
            <p className="text-sm text-stone-600 leading-relaxed">
              可至 <span className="font-bold text-amber-700">1樓 H5 櫃位</span>或<span className="font-bold text-amber-700">2樓樓梯轉角鐵架</span>選購，零食不定期調整品項，如有品項未標明價格可洽詢店員，若選購區無價目表上的品項為正常現象。
            </p>
          </div>
          <div className="divide-y divide-stone-100">
            {snacks.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-stone-700 text-base font-medium">{item.name}</span>
                  {item.unit && <span className="text-xs text-stone-400">({item.unit})</span>}
                </div>
                <Price>{item.price}</Price>
              </div>
            ))}
          </div>
        </Section>
      )}

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
