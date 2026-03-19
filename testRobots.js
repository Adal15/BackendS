const axios = require('axios');

const checkUrlExists = async (url) => {
    try {
        const res = await axios.get(url, {
            timeout: 5000,
            validateStatus: false,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log(`${url} returns status: ${res.status}`);
        return (res.status >= 200 && res.status < 400);
    } catch (e) {
        console.error(`${url} error:`, e.message);
        return false;
    }
};

(async () => {
    const urls = [
        'https://islamicbookzone.com/robots.txt',
        'https://islamicbookzone.com/sitemap.xml',
        'https://example.com/robots.txt'
    ];
    for (const u of urls) {
        const exists = await checkUrlExists(u);
        console.log(`${u} Exists => ${exists}`);
    }
})();
