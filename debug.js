import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173/');
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 1000));

  // Click on "實用 APP 選單"
  // The tab for "實用 APP 選單" has text "輔助 APP" or something? 
  // Let's just click the button that sets activeTab to 'helper-menu'
  // Or we can just evaluate code to set activeTab
  // Let's just navigate to where active tab is 'helper-scoring-hub'
  
  await browser.close();
})();
