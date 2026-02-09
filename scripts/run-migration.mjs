#!/usr/bin/env node

/**
 * SUPABASE MIGRATION RUNNER
 * Uses Puppeteer to run SQL migrations in Supabase Dashboard
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_PROJECT_REF = 'cpwowfcqkltnjcixmaaf';
const SQL_EDITOR_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new`;

const MIGRATION_FILE = process.argv[2] || path.join(__dirname, '../supabase/migrations/20260209000001_usage_tracking.sql');

async function runMigration() {
  console.log('🚀 Starting Supabase Migration Runner...');
  console.log(`📄 Migration file: ${MIGRATION_FILE}`);

  // Read migration SQL
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error(`❌ Migration file not found: ${MIGRATION_FILE}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(MIGRATION_FILE, 'utf-8');
  console.log(`📝 Loaded ${sql.length} characters of SQL`);

  // Launch browser (visible so user can log in if needed)
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    console.log(`🌐 Navigating to Supabase SQL Editor...`);
    await page.goto(SQL_EDITOR_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Check if we need to log in
    const currentUrl = page.url();
    if (currentUrl.includes('sign-in') || currentUrl.includes('login')) {
      console.log('🔐 Please log in to Supabase in the browser window...');
      console.log('   Waiting for you to complete authentication...');

      // Wait for navigation back to the SQL editor
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 300000 // 5 minutes to log in
      });

      // Navigate to SQL editor after login
      await page.goto(SQL_EDITOR_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    }

    console.log('✅ Loaded SQL Editor');

    // Wait for the Monaco editor to be ready
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    console.log('✅ Editor loaded');

    // Clear existing content and paste new SQL
    // Focus on the editor
    await page.click('.monaco-editor');
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.up('Meta');

    // Type the SQL (using clipboard for large content)
    await page.evaluate((sqlContent) => {
      // Try to access Monaco editor instance
      const editor = window.monaco?.editor?.getModels()?.[0];
      if (editor) {
        editor.setValue(sqlContent);
      } else {
        // Fallback: use clipboard
        navigator.clipboard.writeText(sqlContent);
      }
    }, sql);

    // If Monaco setValue didn't work, paste from clipboard
    await page.keyboard.down('Meta');
    await page.keyboard.press('v');
    await page.keyboard.up('Meta');

    console.log('✅ SQL pasted into editor');

    // Find and click the Run button
    await page.waitForSelector('button:has-text("Run"), [aria-label*="Run"], button.run-query', { timeout: 10000 }).catch(() => {});

    // Try multiple selectors for the Run button
    const runButtonSelectors = [
      'button:has-text("Run")',
      '[aria-label="Run query"]',
      'button[type="submit"]',
      '.sql-editor button.bg-brand',
    ];

    let clicked = false;
    for (const selector of runButtonSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click();
          clicked = true;
          console.log('✅ Clicked Run button');
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!clicked) {
      console.log('⚠️  Could not find Run button automatically.');
      console.log('   Please click the Run button manually in the browser.');
    }

    // Wait for query to complete
    console.log('⏳ Waiting for migration to complete...');
    await page.waitForTimeout(5000);

    // Check for success/error indicators
    const pageContent = await page.content();
    if (pageContent.includes('Success') || pageContent.includes('rows affected')) {
      console.log('✅ Migration completed successfully!');
    } else if (pageContent.includes('error') || pageContent.includes('Error')) {
      console.log('⚠️  Migration may have errors. Please check the browser.');
    } else {
      console.log('ℹ️  Migration executed. Please verify results in the browser.');
    }

    // Keep browser open for verification
    console.log('\n📋 Browser will stay open for you to verify the results.');
    console.log('   Press Ctrl+C to close when done.\n');

    // Keep the script running
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('   The browser is still open - you can complete the migration manually.');
    await new Promise(() => {});
  }
}

runMigration();
