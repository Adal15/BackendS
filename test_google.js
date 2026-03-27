const { crawlPage } = require('./services/crawlerService');
const cheerio = require('cheerio');
const fs = require('fs');

async function testGoogle() {
    const keyword = 'microsoft';
    const domain = 'microsoft.com';
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=10&hl=en`;
    
    console.log(`Crawling: ${searchUrl}`);
    const { content, $ } = await crawlPage(searchUrl);
    
    fs.writeFileSync('google_debug.html', content);
    console.log('Saved google_debug.html');

    const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    console.log(`Searching for: ${cleanDomain}`);

    let found = false;
    $('div.g, div.MjjYud, div.tF2Cxc, a').each((i, el) => {
        const link = $(el).attr('href') || $(el).find('a').attr('href');
        if (link && link.toLowerCase().includes(cleanDomain)) {
            console.log(`Found link! index: ${i}, href: ${link}`);
            found = true;
        }
    });

    if (!found) {
        console.log('Domain NOT found in results.');
        // List first 5 links
        console.log('First 5 links found:');
        $('a').slice(0, 5).each((i, el) => console.log($(el).attr('href')));
    }
}

testGoogle().catch(console.error);
