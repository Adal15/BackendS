const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const crawlPage = async (url) => {
    const SAMPLES = 3;
    let loadTimes = [];
    let content = null;
    let $ = null;

    for (let i = 0; i < SAMPLES; i++) {
        try {
            const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            const performanceTiming = JSON.parse(
                await page.evaluate(() => JSON.stringify(window.performance.timing))
            );
            let sample = 0;
            if (performanceTiming.loadEventEnd > 0) {
                sample = performanceTiming.loadEventEnd - performanceTiming.navigationStart;
            }
            loadTimes.push(sample);

            // Only grab HTML content on the first sample
            if (i === 0) {
                content = await page.content();
                $ = cheerio.load(content);
            }

            await browser.close();
        } catch (error) {
            console.error(`Crawler sample ${i + 1} error: ${error.message}`);
            if (i === 0) throw error; // fail fast only on first sample
        }
    }

    // Use the median load time across samples to avoid skew from network spikes
    loadTimes.sort((a, b) => a - b);
    const median = loadTimes[Math.floor(loadTimes.length / 2)];

    return { content, $, loadTime: median };
};

module.exports = { crawlPage };
