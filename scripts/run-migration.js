const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SUPABASE_SQL_URL = 'https://supabase.com/dashboard/project/cpwowfcqkltnjcixmaaf/sql/new';
const MIGRATION_PATH = path.join(__dirname, '../supabase/migrations/20260205000000_settings_tables.sql');

async function runMigration() {
  console.log('Starting Puppeteer with Chrome to run migration...\n');

  // Read migration SQL
  const migrationSQL = fs.readFileSync(MIGRATION_PATH, 'utf8');
  console.log('Loaded migration SQL (' + migrationSQL.length + ' characters)\n');

  // Use system Chrome with user profile to leverage existing sessions
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    defaultViewport: null, // Use default viewport
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      // Use a separate profile to avoid conflicts
      '--user-data-dir=/tmp/puppeteer-brave-profile',
    ]
  });

  const page = await browser.newPage();

  try {
    // Navigate to Supabase SQL editor
    console.log('1. Navigating to Supabase SQL Editor...');
    await page.goto(SUPABASE_SQL_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Check if we need to login
    let currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    if (currentUrl.includes('sign-in') || currentUrl.includes('login')) {
      console.log('\n========================================');
      console.log('   SUPABASE LOGIN REQUIRED');
      console.log('   Please log in manually in Chrome');
      console.log('   Waiting up to 3 minutes...');
      console.log('========================================\n');

      // Wait for URL to change away from sign-in page
      let attempts = 0;
      while (attempts < 180) { // 3 minutes
        await new Promise(r => setTimeout(r, 1000));
        currentUrl = page.url();
        if (!currentUrl.includes('sign-in') && !currentUrl.includes('login')) {
          console.log('   Login detected! Continuing...\n');
          break;
        }
        attempts++;
        if (attempts % 10 === 0) {
          console.log(`   Still waiting for login... (${attempts}s)`);
        }
      }

      if (currentUrl.includes('sign-in') || currentUrl.includes('login')) {
        console.log('   Login timeout. Exiting.');
        await browser.close();
        return;
      }
    }

    // Wait for the SQL editor to load
    console.log('2. Waiting for SQL editor to load...');
    await new Promise(r => setTimeout(r, 3000));

    try {
      await page.waitForSelector('.monaco-editor, [data-testid="sql-editor"], textarea', { timeout: 30000 });
    } catch {
      console.log('   Editor selector not found, trying alternative approach...');
    }

    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: '/tmp/puppeteer-screenshots/migration-1-editor.png' });
    console.log('   Screenshot saved: migration-1-editor.png');

    console.log('\n3. Focusing SQL editor...');

    await page.evaluate(() => {
      const monaco = document.querySelector('.monaco-editor .view-lines');
      if (monaco) { monaco.click(); return; }
      const container = document.querySelector('.monaco-editor');
      if (container) { container.click(); return; }
      const textarea = document.querySelector('textarea');
      if (textarea) { textarea.focus(); textarea.click(); }
    });

    await new Promise(r => setTimeout(r, 500));

    console.log('4. Clearing editor and pasting SQL...');
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.up('Meta');
    await new Promise(r => setTimeout(r, 200));
    await page.keyboard.press('Backspace');
    await new Promise(r => setTimeout(r, 500));

    // Paste SQL using clipboard
    await page.evaluate((sql) => {
      navigator.clipboard.writeText(sql);
    }, migrationSQL);

    await page.keyboard.down('Meta');
    await page.keyboard.press('v');
    await page.keyboard.up('Meta');

    console.log('   SQL pasted via clipboard');
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: '/tmp/puppeteer-screenshots/migration-2-pasted.png' });
    console.log('   Screenshot saved: migration-2-pasted.png');

    console.log('\n5. Looking for Run button...');

    const clicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent?.trim().toLowerCase() || '';
        if (text === 'run' || (text.includes('run') && !text.includes('running') && text.length < 15)) {
          btn.click();
          return btn.textContent;
        }
      }
      return null;
    });

    if (clicked) {
      console.log('   Clicked button:', clicked);
    } else {
      console.log('   Run button not found, trying keyboard shortcut (Cmd+Enter)...');
      await page.keyboard.down('Meta');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Meta');
    }

    console.log('\n6. Waiting for migration to execute...');
    await new Promise(r => setTimeout(r, 8000));

    await page.screenshot({ path: '/tmp/puppeteer-screenshots/migration-3-result.png' });
    console.log('   Screenshot saved: migration-3-result.png');

    const result = await page.evaluate(() => {
      const body = document.body.innerText;
      if (body.includes('Success') || body.includes('success') || body.includes('rows affected')) {
        return 'SUCCESS';
      }
      if (body.includes('error') || body.includes('Error') || body.includes('ERROR')) {
        return 'ERROR - check screenshot';
      }
      return 'UNKNOWN - check screenshot';
    });

    console.log('\n========================================');
    console.log('   MIGRATION RESULT:', result);
    console.log('========================================');
    console.log('\nScreenshots saved to /tmp/puppeteer-screenshots/');
    console.log('Browser will stay open for 15 seconds to verify...\n');

    await new Promise(r => setTimeout(r, 15000));

  } catch (error) {
    console.error('\nError:', error.message);
    try {
      await page.screenshot({ path: '/tmp/puppeteer-screenshots/migration-error.png' });
      console.log('Error screenshot saved');
    } catch {}
  } finally {
    await browser.close();
  }
}

runMigration();
