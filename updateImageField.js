import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const inputFile = 'games.csv';
const imagesDir = path.join(process.cwd(), 'public', 'images');

const extractBggId = (url) => {
  if (!url) return null;
  const match = url.match(/\/boardgame\/(\d+)/) || url.match(/\/boardgameexpansion\/(\d+)/);
  return match ? match[1] : null;
};

const imageFiles = fs.readdirSync(imagesDir);
const imageBaseNames = new Set(imageFiles.map((f) => path.parse(f).name));

let csvText = fs.readFileSync(inputFile, 'utf8').replace(/^﻿/, '');
const lines = csvText.split(/\r?\n/);
const headerIndex = lines.findIndex((line) => line.includes('中文名稱'));
if (headerIndex === -1) {
  console.error('找不到標題列「中文名稱」');
  process.exit(1);
}

const preamble = lines.slice(0, headerIndex);
const dataCsv = lines.slice(headerIndex).join('\n');

const parsed = Papa.parse(dataCsv, {
  header: true,
  skipEmptyLines: false,
  transformHeader: (h) => (h ? h.trim() : h),
});

const fields = parsed.meta.fields.slice();
if (!fields.includes('圖片')) fields.push('圖片');

let matchedCount = 0;
parsed.data.forEach((row, idx) => {
  const bggId = extractBggId(row['BGG連結']);
  const sheetRow = idx + headerIndex + 2;
  const rowKey = `row-${sheetRow}`;
  const hasImage =
    (bggId && imageBaseNames.has(bggId)) || imageBaseNames.has(rowKey);
  row['圖片'] = hasImage ? 'v' : '';
  if (hasImage) matchedCount++;
});

const newCsv = Papa.unparse(parsed.data, { columns: fields, newline: '\n' });
const adjustedPreamble = preamble.map((line) => {
  const cols = line.split(',');
  while (cols.length < fields.length) cols.push('');
  return cols.join(',');
});

const finalCsv = [...adjustedPreamble, newCsv].join('\n');
fs.writeFileSync(inputFile, '﻿' + finalCsv, 'utf8');

console.log(`圖片欄位更新完成：共 ${parsed.data.length} 筆資料，標記 v 共 ${matchedCount} 筆`);
