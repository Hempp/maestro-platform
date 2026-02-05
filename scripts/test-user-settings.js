const puppeteer = require('puppeteer');

const BASE_URL = 'https://pla-ten-eosin.vercel.app';
const TEST_EMAIL = 'testadmin@phazurlabs.com';
const TEST_PASSWORD = 'TestAdmin123!';

async function testUserSettings() {
  console.log('Testing User Settings Page...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 900 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. Login
    console.log('1. Logging in...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    await page.waitForSelector('#email', { timeout: 10000 });
    const emailInput = await page.$('#email');
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(TEST_EMAIL);

    const passwordInput = await page.$('input[type="password"]');
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(TEST_PASSWORD);

    await page.click('button[type="submit"]');
    console.log('   Login submitted');

    await new Promise(r => setTimeout(r, 4000));

    const loginUrl = page.url();
    if (loginUrl.includes('/login')) {
      console.log('   Login failed');
      await browser.close();
      return;
    }
    console.log('   Authenticated!');

    // 2. Navigate to user settings
    console.log('\n2. Navigating to user settings...');
    await page.goto(`${BASE_URL}/dashboard/settings`, { waitUntil: 'networkidle2', timeout: 30000 });

    const settingsUrl = page.url();
    console.log('   URL:', settingsUrl);

    await new Promise(r => setTimeout(r, 2000));

    // 3. Check page title/header
    console.log('\n3. Checking page header...');
    const header = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : null;
    });
    console.log('   Header:', header || 'Not found');

    // 4. Check which sections are visible
    console.log('\n4. Checking visible sections...');
    const sections = await page.evaluate(() => {
      const sectionTitles = [];
      document.querySelectorAll('h2').forEach(h2 => {
        sectionTitles.push(h2.textContent.trim());
      });
      return sectionTitles;
    });

    if (sections.length > 0) {
      sections.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));
    } else {
      console.log('   No sections found');
    }

    // 5. Count controls
    console.log('\n5. Checking controls...');
    const controls = await page.evaluate(() => {
      const toggles = document.querySelectorAll('button[class*="rounded-full"][class*="h-5"]').length;
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="number"]').length;
      const textareas = document.querySelectorAll('textarea').length;
      const selects = document.querySelectorAll('select').length;
      return { toggles, inputs, textareas, selects };
    });
    console.log(`   Toggles: ${controls.toggles}`);
    console.log(`   Input fields: ${controls.inputs}`);
    console.log(`   Textareas: ${controls.textareas}`);
    console.log(`   Selects: ${controls.selects}`);

    // 6. Check for specific settings fields
    console.log('\n6. Checking for key settings...');
    const keySettings = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        hasDisplayName: body.includes('Display Name') || body.includes('display name'),
        hasNotifications: body.includes('Notification') || body.includes('notification'),
        hasTheme: body.includes('Theme') || body.includes('theme'),
        hasPrivacy: body.includes('Privacy') || body.includes('privacy'),
        hasAccessibility: body.includes('Accessibility') || body.includes('accessibility'),
      };
    });
    Object.entries(keySettings).forEach(([key, value]) => {
      console.log(`   ${key}: ${value ? 'Yes' : 'No'}`);
    });

    // 7. Take screenshot
    console.log('\n7. Taking screenshot...');
    await page.screenshot({ path: '/tmp/user-settings-test.png', fullPage: true });
    console.log('   Screenshot saved: /tmp/user-settings-test.png');

    // 8. Test save functionality
    console.log('\n8. Testing Save button...');
    const saveResult = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.trim() === 'Save') {
          btn.click();
          return 'Clicked';
        }
      }
      return 'Not found';
    });
    console.log('   Save button:', saveResult);

    if (saveResult === 'Clicked') {
      await new Promise(r => setTimeout(r, 2000));
      const status = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent.trim();
          if (['Save', 'Saving...', 'Saved', 'Error'].includes(text)) {
            return text;
          }
        }
        return 'Unknown';
      });
      console.log('   Status after save:', status);
    }

    // Summary
    console.log('\n========================================');
    console.log('   USER SETTINGS TEST RESULTS');
    console.log('========================================');
    console.log(`   Header: ${header || 'Unknown'}`);
    console.log(`   Sections visible: ${sections.length}`);
    console.log(`   Toggles: ${controls.toggles}`);
    console.log(`   Inputs: ${controls.inputs}`);
    console.log(`   Save: ${saveResult}`);
    console.log('========================================\n');

    console.log('Browser will stay open for 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));

  } catch (error) {
    console.error('\nError:', error.message);
    await page.screenshot({ path: '/tmp/user-settings-error.png' });
    console.log('Error screenshot saved');
  } finally {
    await browser.close();
  }
}

testUserSettings();
