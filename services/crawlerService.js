const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
];

const crawlPage = async (url) => {
    const SAMPLES = url.includes('google.com') ? 1 : 2; // don't spam search engines
    let loadTimes = [];
    let content = null;
    let $ = null;
    let contentHeaders = {};

    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    for (let i = 0; i < SAMPLES; i++) {
        try {
            const browser = await puppeteer.launch({ 
                headless: 'new', 
                args: ['--no-sandbox', '--disable-setuid-sandbox'] 
            });
            const page = await browser.newPage();
            
            // Set a random user agent for stealth
            await page.setUserAgent(ua);
            
            // Set viewport to look like a real desktop/mobile
            await page.setViewport({ width: 1280, height: 800 });

            // Add extra headers
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
            });

            console.log(`[Crawler] Navigating to ${url}...`);
            const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
            const responseHeaders = response ? response.headers() : {};

            const performanceTiming = JSON.parse(
                await page.evaluate(() => JSON.stringify(window.performance.timing))
            );
            let sample = 0;
            if (performanceTiming.loadEventEnd > 0) {
                sample = performanceTiming.loadEventEnd - performanceTiming.navigationStart;
            }
            loadTimes.push(sample);

            if (i === 0) {
                content = await page.content();
                $ = cheerio.load(content);
                contentHeaders = responseHeaders;
            }

            await browser.close();
            
            // If it's a search engine, add a small delay between samples if SAMPLES > 1
            if (SAMPLES > 1 && i < SAMPLES - 1) {
                await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
            }
        } catch (error) {
            console.error(`Crawler sample ${i + 1} error: ${error.message}`);
            if (i === 0) throw error;
        }
    }

    loadTimes.sort((a, b) => a - b);
    const median = loadTimes[Math.floor(loadTimes.length / 2)];

    return { content, $, loadTime: median, headers: contentHeaders };
};

const takeMobileSnapshot = async (url) => {
    try {
        const snapshotsDir = path.join(__dirname, '..', 'uploads', 'snapshots');
        if (!fs.existsSync(snapshotsDir)) {
            fs.mkdirSync(snapshotsDir, { recursive: true });
        }

        const filename = `snapshot-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
        const filePath = path.join(snapshotsDir, filename);

        const browser = await puppeteer.launch({ 
            headless: 'new', 
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        
        // Mobile-like viewport (iPhone 14)
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');

        console.log(`[Crawler] Taking mobile snapshot for ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Wait a bit for animations/images to settle
        await new Promise(r => setTimeout(r, 2000));
        
        await page.screenshot({ path: filePath });
        await browser.close();

        console.log(`[Crawler] Snapshot saved: ${filename}`);
        return `/uploads/snapshots/${filename}`;
    } catch (error) {
        console.error(`[Crawler] Failed to take snapshot: ${error.message}`);
        return '';
    }
};

module.exports = { crawlPage, takeMobileSnapshot };
