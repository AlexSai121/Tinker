const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5173/');
  
  // Wait a bit for React to attempt rendering
  await new Promise(resolve => setTimeout(resolve, 3000));

  await page.screenshot({ path: 'tmp/ui-home.png', fullPage: true });
  
  await browser.close();
})();
