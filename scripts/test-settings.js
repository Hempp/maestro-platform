const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = '/tmp/puppeteer-screenshots';

async function testSettings() {
  console.log('Starting Puppeteer test...\n');

  // Create screenshot directory
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. Go to dashboard
    console.log('1. Navigating to dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });

    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('   -> Redirected to login page');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/1-login.png` });
      console.log('   Screenshot saved: 1-login.png');
      console.log('\n   Not authenticated. Please log in manually.');
    } else {
      console.log('   Authenticated!\n');

      // 2. Navigate to settings
      console.log('2. Navigating to settings...');
      await page.goto(`${BASE_URL}/dashboard/settings`, { waitUntil: 'networkidle2' });
      await page.screenshot({ path: `${SCREENSHOT_DIR}/2-settings.png` });
      console.log('   Screenshot saved: 2-settings.png');

      // 3. Wait for page to load
      await page.waitForSelector('h1', { timeout: 5000 });
      const title = await page.$eval('h1', el => el.textContent);
      console.log('   Page title:', title);

      // 4. Find display name input and modify it
      console.log('\n3. Testing form...');
      const inputs = await page.$$('input:not([disabled])');
      console.log(`   Found ${inputs.length} editable inputs`);

      if (inputs.length > 0) {
        const testValue = 'Test ' + Date.now();
        await inputs[0].click({ clickCount: 3 });
        await inputs[0].type(testValue);
        console.log(`   Entered: "${testValue}"`);
      }

      // 5. Click Save button
      console.log('\n4. Saving...');
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.evaluate(el => el.textContent);
        if (text && text.includes('Save')) {
          await btn.click();
          console.log('   Clicked Save button');
          break;
        }
      }

      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: `${SCREENSHOT_DIR}/3-after-save.png` });
      console.log('   Screenshot saved: 3-after-save.png');

      // Check save result
      const btns = await page.$$('button');
      for (const btn of btns) {
        const text = await btn.evaluate(el => el.textContent);
        if (text && (text.includes('Save') || text.includes('Saved'))) {
          console.log('   Button now shows:', text);
          break;
        }
      }
    }

    console.log('\nTest completed!');
    console.log(`Screenshots at: ${SCREENSHOT_DIR}/`);

  } catch (error) {
    console.error('\nError:', error.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error.png` });
  } finally {
    await new Promise(r => setTimeout(r, 3000));
    await browser.close();
  }
}

testSettings();
