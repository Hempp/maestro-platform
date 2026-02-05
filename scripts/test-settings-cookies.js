const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';

async function testSettings() {
  console.log('Starting cookie test...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. Navigate to dashboard
    console.log('1. Navigating to dashboard...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });

    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('   Not authenticated!');
      await browser.close();
      return;
    }

    // 2. Get all cookies
    console.log('\n2. Checking cookies...');
    const cookies = await page.cookies();
    console.log('   Cookies:', cookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));

    // 3. Test direct API call from page context
    console.log('\n3. Testing API call from page context...');
    const apiResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/user/settings', {
          method: 'GET',
          credentials: 'include'
        });
        return {
          status: response.status,
          ok: response.ok,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('   GET result:', apiResult.status, apiResult.ok ? 'OK' : 'FAILED');

    // 4. Test PUT call from page context
    console.log('\n4. Testing PUT call from page context...');
    const putResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/user/settings', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: 'Test ' + Date.now() })
        });
        return {
          status: response.status,
          ok: response.ok,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('   PUT result:', putResult.status, putResult.ok ? 'OK' : 'FAILED');
    if (!putResult.ok) {
      console.log('   PUT error:', putResult.data);
    }

    // 5. Check for Supabase auth cookies specifically
    console.log('\n5. Checking Supabase cookies...');
    const supabaseCookies = cookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'));
    if (supabaseCookies.length > 0) {
      supabaseCookies.forEach(c => {
        console.log(`   - ${c.name}: ${c.value.substring(0, 30)}...`);
      });
    } else {
      console.log('   No Supabase cookies found!');
      console.log('   All cookies:', cookies.map(c => c.name));
    }

    console.log('\nTest completed!');

  } catch (error) {
    console.error('\nError:', error.message);
  } finally {
    await new Promise(r => setTimeout(r, 3000));
    await browser.close();
  }
}

testSettings();
