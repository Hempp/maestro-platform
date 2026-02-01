import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900 });
await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
await page.screenshot({ 
  path: '/tmp/claude/-Users-seg/8a0fcef6-7310-4ffd-be11-94cd368af168/scratchpad/maestro-screenshot.png',
  fullPage: false 
});
await browser.close();
console.log('Screenshot saved');
