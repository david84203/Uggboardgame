import fs from 'fs';
const data = JSON.parse(fs.readFileSync('fuzzy_results.json', 'utf8'));

let md = `# 模糊比對人工確認清單\n\n`;
md += `以下是庫存系統找不到精確名稱，但根據演算法找出的高度相似（可能是同款）遊戲。\n`;
md += `打勾 \`[x]\` 代表「確認它們是同一款遊戲」，後續我會自動把 **Google Sheet 裡的名字** 改成 **庫存系統的名字** 以達成同步。\n\n`;

md += `## 🟢 高度相似 (建議確認)\n`;
data.results.filter(r => r.score >= 0.7).forEach(r => {
  md += `- [ ] 庫存：**${r.inventory}**  →  Sheet：**${r.best}** (相似度: ${Math.round(r.score*100)}%)\n`;
});

md += `\n## 🟡 中度相似 (請留意確認)\n`;
data.results.filter(r => r.score >= 0.45 && r.score < 0.7).forEach(r => {
  md += `- [ ] 庫存：**${r.inventory}**  →  Sheet：**${r.best}** (相似度: ${Math.round(r.score*100)}%)\n`;
});

md += `\n> [!NOTE]\n> 如果上面有我列錯的（根本是不同遊戲），請保持空格 \`[ ]\` 即可。\n`;
md += `> 確認完畢後，請告訴我，我會執行腳本幫你自動修改！\n`;

fs.writeFileSync('C:\\Users\\bboylu\\.gemini\\antigravity\\brain\\c59ef70c-db76-48d7-9a38-582daaed0082\\fuzzy_match_review.md', md);
