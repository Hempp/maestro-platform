const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = '/tmp/puppeteer-screenshots';

async function testSettings() {
  console.log('Starting detailed Puppeteer test...\n');

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // Track all API responses
  const apiResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      apiResponses.push({
        url: url.replace(BASE_URL, ''),
        status: response.status(),
        method: response.request().method()
      });
    }
  });

  try {
    // 1. Go to dashboard
    console.log('1. Navigating to dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });

    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('   Not authenticated. Please log in first.');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/1-login.png` });
      return;
    }

    console.log('   Authenticated!\n');

    // 2. Navigate to settings
    console.log('2. Navigating to settings...');
    await page.goto(`${BASE_URL}/dashboard/settings`, { waitUntil: 'networkidle2' });

    // Wait for settings to load
    await page.waitForSelector('input[placeholder="Your name"]', { timeout: 5000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/2-settings-loaded.png` });

    // Check initial API responses
    const settingsResponses = apiResponses.filter(r => r.url.includes('/api/user/settings'));
    console.log('   Settings API responses:', settingsResponses);

    // 3. Modify the display name
    console.log('\n3. Modifying display name...');
    const displayNameInput = await page.$('input[placeholder="Your name"]');

    if (displayNameInput) {
      const testValue = 'TestUser_' + Date.now();
      await displayNameInput.click({ clickCount: 3 }); // Select all
      await displayNameInput.type(testValue);
      console.log('   Entered:', testValue);
    } else {
      console.log('   Display name input not found!');
    }

    // 4. Find and monitor the save button
    console.log('\n4. Saving...');
    apiResponses.length = 0; // Clear previous responses

    // Find the Save button
    const saveButton = await page.evaluateHandle(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent?.includes('Save')) return btn;
      }
      return null;
    });

    if (saveButton) {
      // Get initial button state
      const initialText = await page.evaluate(btn => btn.textContent, saveButton);
      const initialClasses = await page.evaluate(btn => btn.className, saveButton);
      console.log('   Initial button text:', initialText);
      console.log('   Initial button classes:', initialClasses.substring(0, 80) + '...');

      // Click save
      await saveButton.click();
      console.log('   Clicked Save button');

      // Wait for response
      await new Promise(r => setTimeout(r, 500));

      // Check button state during save
      const savingText = await page.evaluate(btn => btn.textContent, saveButton);
      console.log('   Button text during save:', savingText);

      // Wait for save to complete
      await new Promise(r => setTimeout(r, 2500));

      // Check final button state
      const finalText = await page.evaluate(btn => btn.textContent, saveButton);
      const finalClasses = await page.evaluate(btn => btn.className, saveButton);
      console.log('   Final button text:', finalText);
      console.log('   Final button classes:', finalClasses.substring(0, 80) + '...');

      // Check for PUT response
      const putResponses = apiResponses.filter(r => r.method === 'PUT');
      console.log('\n   PUT API responses:', putResponses);

      await page.screenshot({ path: `${SCREENSHOT_DIR}/3-after-save.png` });

      if (putResponses.length > 0 && putResponses[0].status === 200) {
        console.log('\n   SUCCESS: Settings saved!');
      } else if (putResponses.length > 0 && putResponses[0].status === 401) {
        console.log('\n   ERROR: Authentication failed on save (401)');
      } else if (putResponses.length === 0) {
        console.log('\n   WARNING: No PUT request detected');
      } else {
        console.log('\n   ERROR: Save failed with status', putResponses[0]?.status);
      }
    } else {
      console.log('   Save button not found!');
    }

    console.log('\n5. All API responses during test:');
    apiResponses.forEach(r => {
      console.log(`   ${r.method} ${r.url} -> ${r.status}`);
    });

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
