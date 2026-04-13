const axios = require('axios');
const https = require('https');

async function checkHtml() {
    const url = 'https://www.jtsmiddleeast.com/';
    try {
        const res = await axios.get(url, {
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = res.data;
        console.log('HTML Length:', html.length);
        const fbIndex = html.indexOf('facebook.com');
        if (fbIndex !== -1) {
            console.log('Facebook found at index:', fbIndex);
            console.log('Snippet:', html.substring(fbIndex - 50, fbIndex + 100));
        } else {
            console.log('Facebook NOT found in raw HTML');
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkHtml();
