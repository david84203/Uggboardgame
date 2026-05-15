const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const csvPath = path.join(__dirname, 'temp_sheet.csv');
const imagesDir = path.join(__dirname, 'public', 'images');

const csvText = fs.readFileSync(csvPath, 'utf8');
const lines = csvText.split('\n');
const headerIndex = lines.findIndex(line => line.includes('中文名稱'));
const cleanedCsv = headerIndex >= 0 ? lines.slice(headerIndex).join('\n') : csvText;

Papa.parse(cleanedCsv, {
  header: true,
  skipEmptyLines: 'greedy',
  transformHeader: (header) => header.trim(),
  complete: (results) => {
    let renamedCount = 0;
    
    results.data.forEach((row, originalIndex) => {
      const sheetRowNumber = headerIndex + originalIndex + 2;
      let englishName = row['英文名稱'];
      
      if (englishName && englishName.trim() !== '') {
        const safeName = englishName.replace(/[\\/:*?"<>|]/g, '-').trim();
        
        ['jpg', 'png', 'webp', 'jpeg'].forEach(ext => {
          const oldPath = path.join(imagesDir, `row-${sheetRowNumber}.${ext}`);
          const newPath = path.join(imagesDir, `${safeName}.${ext}`);
          
          if (fs.existsSync(oldPath)) {
            console.log(`Renaming: row-${sheetRowNumber}.${ext} -> ${safeName}.${ext}`);
            fs.renameSync(oldPath, newPath);
            renamedCount++;
          }
        });
      }
    });
    
    console.log(`Done! Renamed ${renamedCount} images.`);
  }
});
