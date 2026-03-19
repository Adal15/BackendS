const puppeteer = require('puppeteer');
const axios = require('axios');
const https = require('https');

async function safeGoto(page, url) {
    // First attempt: HTTPS
    try {
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        console.log('✅ Loaded via HTTPS');
        return true;
    } catch (err) {
        console.log('❌ HTTPS failed:', err.message);
    }

    // Second attempt: HTTP fallback
    try {
        const httpUrl = url.replace('https://', 'http://');
        console.log('⚠️ Retrying with HTTP:', httpUrl);

        await page.goto(httpUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        console.log('✅ Loaded via HTTP');
        return true;
    } catch (err) {
        console.log('❌ HTTP also failed:', err.message);
        throw err; // now реально fail
    }
}


async function testUrl(name, url) {
    console.log(`\n--- Testing ${name} (${url}) ---`);
    console.log('Testing Axios...');
    try {
        // const res = await axios.get(url, {
        //     headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
        //     timeout: 10000
        // });
        const res = await axios.get(url, {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false // ✅ bypass SSL validation
            }),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });
        console.log('Axios success! Status:', res.status);
    } catch (e) {
        console.error('Axios failed:', e.message);
    }

    console.log('Testing Puppeteer...');
    let browser;
    try {
        // browser = await puppeteer.launch({
        //     headless: 'new',
        //     args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--disable-web-security']
        // });
        browser = await puppeteer.launch({
            headless: 'new',
            ignoreHTTPSErrors: true, // ✅ IMPORTANT
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--disable-web-security'
            ]
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log('Puppeteer success!');
    } catch (e) {
        console.error('Puppeteer failed:', e.message);
    } finally {
        if (browser) await browser.close();
    }
}

(async () => {
    await testUrl('Google', 'https://www.google.com');
    await testUrl('Islamic Book Zone', 'https://islamicbookzone.com/');
    await testUrl('JTS Middle East', 'https://jtsmiddleeast.com/');
})();
