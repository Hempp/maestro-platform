const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'testadmin@phazurlabs.com';
const TEST_PASSWORD = 'TestAdmin123!';

async function testAdminSettings() {
  console.log('Testing Admin Settings with Tier-Based Access...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 900 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. Try to sign up first
    console.log('1. Attempting to sign up new test account...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    // Click "Sign up" link
    const signUpClicked = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        if (link.textContent?.toLowerCase().includes('sign up')) {
          link.click();
          return true;
        }
      }
      return false;
    });

    if (signUpClicked) {
      console.log('   Navigating to signup page...');
      await new Promise(r => setTimeout(r, 2000));
    }

    // Check if we're on signup page
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    if (currentUrl.includes('signup') || currentUrl.includes('register')) {
      console.log('   On signup page, filling form...');

      // Wait for form
      await page.waitForSelector('input', { timeout: 5000 });
      await new Promise(r => setTimeout(r, 500));

      // Fill Full Name first (it's the first input)
      const allInputs = await page.$$('input');
      if (allInputs.length > 0) {
        // First input is usually name
        await allInputs[0].click({ clickCount: 3 });
        await allInputs[0].type('Test Admin User');
        console.log('   Full Name entered');
      }

      // Fill email (second input or by type)
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        await emailInput.click({ clickCount: 3 });
        await emailInput.type(TEST_EMAIL);
        console.log('   Email entered');
      }

      // Fill password
      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.click({ clickCount: 3 });
        await passwordInput.type(TEST_PASSWORD);
        console.log('   Password entered');
      }

      await page.screenshot({ path: '/tmp/admin-settings-signup-form.png' });

      // Click Create Account button
      await page.click('button[type="submit"]');
      console.log('   Create Account clicked');

      await page.screenshot({ path: '/tmp/admin-settings-after-signup.png' });

      // Wait for redirect to dashboard
      console.log('   Waiting for redirect...');
      await new Promise(r => setTimeout(r, 5000));

      const afterSignupUrl = page.url();
      console.log('   After signup URL:', afterSignupUrl);

      if (afterSignupUrl.includes('dashboard') || !afterSignupUrl.includes('signup')) {
        console.log('   Signup successful! Now authenticated.');
      } else {
        console.log('   Signup may have failed or requires email verification');
      }
    } else {
      // Try to login directly
      console.log('   Not on signup page, trying to login...');

      // Fill login form
      await page.waitForSelector('#email', { timeout: 10000 });
      const loginEmail = await page.$('#email');
      await loginEmail.click({ clickCount: 3 });
      await loginEmail.type(TEST_EMAIL);

      const loginPassword = await page.$('input[type="password"]');
      await loginPassword.click({ clickCount: 3 });
      await loginPassword.type(TEST_PASSWORD);

      await page.click('button[type="submit"]');
      console.log('   Login submitted');

      await new Promise(r => setTimeout(r, 3000));
    }

    // Force fresh login to pick up the admin role
    console.log('\n2. Logging in fresh...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

    // Check if already logged in (redirected away from login)
    let loginUrl = page.url();
    if (!loginUrl.includes('/login')) {
      console.log('   Already logged in, logging out first...');
      // Go to a page and manually clear cookies or find logout
      await page.evaluate(() => {
        // Clear auth cookies
        document.cookie.split(";").forEach(c => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      });
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    }

    // Fill login form
    await page.waitForSelector('#email', { timeout: 10000 });
    const loginEmail = await page.$('#email');
    await loginEmail.click({ clickCount: 3 });
    await loginEmail.type(TEST_EMAIL);

    const loginPassword = await page.$('input[type="password"]');
    await loginPassword.click({ clickCount: 3 });
    await loginPassword.type(TEST_PASSWORD);

    await page.click('button[type="submit"]');
    console.log('   Login submitted');

    await new Promise(r => setTimeout(r, 4000));

    loginUrl = page.url();
    console.log('   After login URL:', loginUrl);

    if (loginUrl.includes('/login')) {
      console.log('   Login failed');
      await page.screenshot({ path: '/tmp/admin-settings-login-failed.png' });
      await browser.close();
      return;
    }

    console.log('   Authenticated!');

    // 3. Navigate to admin settings
    console.log('\n3. Navigating to admin settings...');
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle2', timeout: 30000 });

    const adminUrl = page.url();
    console.log('   URL:', adminUrl);

    if (adminUrl.includes('/login')) {
      console.log('   Redirected to login - user may not have admin access');
      await browser.close();
      return;
    }

    await new Promise(r => setTimeout(r, 2000));

    // 4. Check for tier badge
    console.log('\n4. Checking for TierBadge...');
    const tierBadge = await page.evaluate(() => {
      const badge = document.querySelector('header span[class*="rounded-full"]');
      return badge ? badge.textContent : null;
    });
    console.log('   Tier Badge:', tierBadge || 'Not found');

    // 5. Check which sections are visible
    console.log('\n5. Checking visible sections...');
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

    // 6. Check access level
    console.log('\n6. Checking access level...');
    const accessInfo = await page.evaluate(() => {
      const hasLimitedAccess = document.body.innerText.includes('Limited Access');
      const hasAccessDenied = document.body.innerText.includes('Access Denied');
      return { hasLimitedAccess, hasAccessDenied };
    });

    if (accessInfo.hasAccessDenied) {
      console.log('   ACCESS DENIED - User is not an admin');
    } else if (accessInfo.hasLimitedAccess) {
      console.log('   LIMITED ACCESS - Non-super admin');
    } else {
      console.log('   FULL ACCESS - Super admin');
    }

    // 7. Count controls
    console.log('\n7. Checking controls...');
    const controls = await page.evaluate(() => {
      const toggles = document.querySelectorAll('button[class*="rounded-full"][class*="h-5"]').length;
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="number"]').length;
      return { toggles, inputs };
    });
    console.log(`   Toggles: ${controls.toggles}`);
    console.log(`   Input fields: ${controls.inputs}`);

    // 8. Take screenshot
    console.log('\n8. Taking screenshot...');
    await page.screenshot({ path: '/tmp/admin-settings-test.png', fullPage: true });
    console.log('   Screenshot saved: /tmp/admin-settings-test.png');

    // 9. Test save functionality
    console.log('\n9. Testing Save button...');
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
    console.log('   ADMIN SETTINGS TEST RESULTS');
    console.log('========================================');
    console.log(`   Tier: ${tierBadge || 'Unknown'}`);
    console.log(`   Sections visible: ${sections.length}`);
    console.log(`   Toggles: ${controls.toggles}`);
    console.log(`   Inputs: ${controls.inputs}`);
    console.log(`   Access: ${accessInfo.hasAccessDenied ? 'DENIED' : accessInfo.hasLimitedAccess ? 'LIMITED' : 'FULL'}`);
    console.log('========================================\n');

    console.log('Browser will stay open for 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));

  } catch (error) {
    console.error('\nError:', error.message);
    await page.screenshot({ path: '/tmp/admin-settings-error.png' });
    console.log('Error screenshot saved');
  } finally {
    await browser.close();
  }
}

testAdminSettings();
