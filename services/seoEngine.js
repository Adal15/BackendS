const { crawlPage } = require('./crawlerService');
const https = require('https');
const axios = require('axios');

const agent = new https.Agent({ rejectUnauthorized: false });
const reqConfig = {
    timeout: 5000,
    validateStatus: false,
    httpsAgent: agent,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
};

// ─── helpers ───────────────────────────────────────────────────────────────

const checkUrlExists = async (url) => {
    try {
        const res = await axios.get(url, reqConfig);
        return (res.status >= 200 && res.status < 400);
    } catch (e) { return false; }
};

const checkCustom404 = async (baseUrl) => {
    try {
        const res = await axios.get(`${baseUrl}/thisshouldnotexist-random-12345`, reqConfig);
        if (res.status === 404 && res.data) return res.data.length > 500;
        return false;
    } catch (e) { return false; }
};

const checkWwwCanonical = async (url) => {
    try {
        const urlObj = new URL(url);
        const hasWww = urlObj.hostname.startsWith('www.');
        const otherHostname = hasWww ? urlObj.hostname.replace('www.', '') : `www.${urlObj.hostname}`;
        const otherUrl = `${urlObj.protocol}//${otherHostname}`;
        const res = await axios.get(otherUrl, { maxRedirects: 0, validateStatus: false, timeout: 5000 });
        if (res.status >= 300 && res.status < 400) {
            const location = res.headers.location;
            if (location && location.includes(urlObj.hostname)) return true;
        }
        return false;
    } catch (e) { return false; }
};

// Common English stop words to ignore during keyword extraction
const STOP_WORDS = new Set([
    'the','and','is','in','it','of','to','a','an','that','this','was','for','on','are','with',
    'as','at','be','by','from','or','but','not','have','had','he','she','we','they','you','i',
    'do','did','will','would','could','should','may','might','can','has','its','your','our',
    'their','my','his','her','what','which','who','when','where','how','all','so','if','no',
    'more','also','up','out','about','into','over','after','then','than','these','those','some',
    'such','there','here','been','just','get','new','other','page','site','web','click'
]);

const extractKeywords = ($) => {
    // Pull visible text from body, strip scripts/styles
    $('script, style, noscript').remove();
    const text = $('body').text() || '';
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const freq = {};
    for (const w of words) {
        if (!STOP_WORDS.has(w)) freq[w] = (freq[w] || 0) + 1;
    }
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));
};

const checkMediaQueries = async (content, $) => {
    // Check inline <style> blocks first
    const inlineStyles = [];
    $('style').each((_, el) => inlineStyles.push($(el).html() || ''));
    if (inlineStyles.join('').includes('@media')) return true;

    // Try fetching the first external stylesheet
    const firstSheet = $('link[rel="stylesheet"]').attr('href');
    if (firstSheet) {
        try {
            const url = firstSheet.startsWith('http') ? firstSheet : null;
            if (url) {
                const res = await axios.get(url, { ...reqConfig, timeout: 4000 });
                if (res.data && typeof res.data === 'string' && res.data.includes('@media')) return true;
            }
        } catch (_) { /* ignore */ }
    }
    return false;
};

// ─── main analyzer ─────────────────────────────────────────────────────────

const analyzeSEO = async (url) => {
    const { $, content, loadTime } = await crawlPage(url);
    const urlObj = new URL(url);
    const origin = urlObj.origin;

    let issues = [];
    let technicalScore = 100;

    // ── Technical checks (parallel HTTP) ────────────────────────────────────
    const [hasRobotsTxt, hasSitemap, hasCustom404, isWwwOptimized] = await Promise.all([
        checkUrlExists(`${origin}/robots.txt`),
        checkUrlExists(`${origin}/sitemap.xml`),
        checkCustom404(origin),
        checkWwwCanonical(url)
    ]);

    if (!hasRobotsTxt) {
        issues.push({ category: 'Technical', issue: 'Missing robots.txt', impact: 'High', recommendation: 'Create a /robots.txt file to guide search engine crawlers. At minimum, include User-agent: * and a Sitemap: directive.' });
        technicalScore -= 5;
    }
    if (!hasSitemap) {
        issues.push({ category: 'Technical', issue: 'Missing XML Sitemap', impact: 'Medium', recommendation: 'Generate and submit a sitemap.xml to help search engines discover and index your pages faster.' });
        technicalScore -= 5;
    }
    if (!hasCustom404) {
        issues.push({ category: 'Technical', issue: 'Missing Custom 404 Page', impact: 'Low', recommendation: 'Create a custom 404 error page to improve user experience when visitors reach broken links.' });
    }
    if (!isWwwOptimized) {
        issues.push({ category: 'Technical', issue: 'WWW Canonicalization Issue', impact: 'Medium', recommendation: 'Ensure both www and non-www versions of your domain redirect (301) to a single canonical version.' });
        technicalScore -= 5;
    }

    // ── Title analysis ───────────────────────────────────────────────────────
    const titleText = $('title').text().trim();
    const titleLength = titleText.length;
    let titleStatus;
    if (!titleText) { titleStatus = 'missing'; }
    else if (titleLength < 10) { titleStatus = 'short'; }
    else if (titleLength > 60) { titleStatus = 'long'; }
    else { titleStatus = 'ok'; }

    if (titleStatus === 'missing') {
        issues.push({ category: 'On-Page', issue: 'Missing Title Tag', impact: 'High', recommendation: 'Add a descriptive <title> tag between 50–60 characters.' });
        technicalScore -= 20;
    } else if (titleStatus === 'long') {
        issues.push({ category: 'On-Page', issue: 'Title Too Long', impact: 'Medium', recommendation: `Your title is ${titleLength} chars. Keep it under 60 characters to avoid truncation in search results.` });
        technicalScore -= 5;
    } else if (titleStatus === 'short') {
        issues.push({ category: 'On-Page', issue: 'Title Too Short', impact: 'Low', recommendation: `Your title is only ${titleLength} chars. Aim for 50–60 characters to maximise keyword real-estate.` });
    }

    // ── Meta description analysis ────────────────────────────────────────────
    const metaDescText = ($('meta[name="description"]').attr('content') || '').trim();
    const metaDescLength = metaDescText.length;
    let metaDescStatus;
    if (!metaDescText) { metaDescStatus = 'missing'; }
    else if (metaDescLength < 50) { metaDescStatus = 'short'; }
    else if (metaDescLength > 160) { metaDescStatus = 'long'; }
    else { metaDescStatus = 'ok'; }

    if (metaDescStatus === 'missing') {
        issues.push({ category: 'On-Page', issue: 'Missing Meta Description', impact: 'High', recommendation: 'Add a <meta name="description"> tag with a compelling summary (150–160 chars).' });
        technicalScore -= 15;
    } else if (metaDescStatus === 'long') {
        issues.push({ category: 'On-Page', issue: 'Meta Description Too Long', impact: 'Medium', recommendation: `Your meta description is ${metaDescLength} chars. Keep it under 160 characters to avoid truncation in SERPs.` });
        technicalScore -= 3;
    } else if (metaDescStatus === 'short') {
        issues.push({ category: 'On-Page', issue: 'Meta Description Too Short', impact: 'Low', recommendation: `Your meta description is only ${metaDescLength} chars. Expand it to 150–160 characters.` });
    }

    // ── H1 analysis ──────────────────────────────────────────────────────────
    const h1Elements = $('h1');
    const h1Count = h1Elements.length;
    const h1Texts = [];
    h1Elements.each((_, el) => { const t = $(el).text().trim(); if (t) h1Texts.push(t); });

    if (h1Count === 0) {
        issues.push({ category: 'On-Page', issue: 'Missing H1 Tag', impact: 'High', recommendation: 'Add exactly one <h1> tag per page with your primary keyword.' });
        technicalScore -= 10;
    } else if (h1Count > 1) {
        issues.push({ category: 'On-Page', issue: 'Multiple H1 Tags', impact: 'Medium', recommendation: `Found ${h1Count} H1 tags. Use only one <h1> per page — it signals the main topic to search engines.` });
        technicalScore -= 5;
    }

    // ── H2 analysis ──────────────────────────────────────────────────────────
    const h2Elements = $('h2');
    const h2Count = h2Elements.length;
    const h2Texts = [];
    h2Elements.each((_, el) => { const t = $(el).text().trim(); if (t) h2Texts.push(t); });

    if (h2Count === 0) {
        issues.push({ category: 'On-Page', issue: 'No H2 Tags Found', impact: 'Low', recommendation: 'Add H2 tags to organise your content into sections. This improves readability and helps crawlers understand page structure.' });
    }

    // ── Favicon ──────────────────────────────────────────────────────────────
    const hasFavicon = $('link[rel="icon"]').length > 0 || $('link[rel="shortcut icon"]').length > 0;
    if (!hasFavicon) {
        issues.push({ category: 'Technical', issue: 'Missing Favicon', impact: 'Low', recommendation: 'Add a favicon (<link rel="icon" href="/favicon.ico">) for better browser tab visibility and branding.' });
        technicalScore -= 2;
    }

    // ── Image alt analysis ───────────────────────────────────────────────────
    const totalImages = $('img').length;
    let imagesWithAlt = 0;
    const missingAltImages = [];
    $('img').each((_, el) => {
        const alt = $(el).attr('alt');
        const src = $(el).attr('src') || '';
        const hasAlt = alt !== undefined && alt.trim().length > 0;
        if (hasAlt) {
            imagesWithAlt++;
        } else {
            // Build a clean snippet for display
            const srcPart = src ? ` src="${src.length > 60 ? src.slice(0, 60) + '...' : src}"` : '';
            const altPart = alt === undefined ? '' : ` alt=""`;
            missingAltImages.push({
                src,
                snippet: `<img${srcPart}${altPart}>`
            });
        }
    });

    const imageAltRatio = totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 100;
    if (imageAltRatio < 100) {
        issues.push({ category: 'On-Page', issue: 'Missing Image Alt Tags', impact: 'Medium', recommendation: `Add descriptive alt attributes to all images. Currently ${imageAltRatio}% covered. Alt text improves accessibility and image SEO.` });
        technicalScore -= Math.round((100 - imageAltRatio) * 0.1);
    }

    // ── Links analysis ───────────────────────────────────────────────────────
    let internalLinks = 0;
    let externalLinks = 0;
    $('a[href]').each((_, link) => {
        const href = $(link).attr('href') || '';
        if (href.startsWith('/') || href.includes(urlObj.hostname)) {
            internalLinks++;
        } else if (href.startsWith('http')) {
            externalLinks++;
        }
    });
    const linkRatioWarning = internalLinks < 5;
    if (linkRatioWarning) {
        issues.push({ category: 'On-Page', issue: 'Too Few Internal Links', impact: 'Medium', recommendation: `Only ${internalLinks} internal links found. Add more internal links to help search engines crawl your site and distribute page authority.` });
    }

    // ── Responsive design ────────────────────────────────────────────────────
    const hasViewportMeta = $('meta[name="viewport"]').length > 0;
    const hasMediaQueries = await checkMediaQueries(content, $);
    if (!hasViewportMeta) {
        issues.push({ category: 'Technical', issue: 'Missing Viewport Meta Tag', impact: 'High', recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for proper mobile rendering.' });
        technicalScore -= 8;
    }

    // ── Keywords extraction ──────────────────────────────────────────────────
    const keywords = extractKeywords($);
    const topKeyword = keywords[0]?.word || '';
    const keywordsInTitle = topKeyword ? titleText.toLowerCase().includes(topKeyword) : false;
    const keywordsInDesc  = topKeyword ? metaDescText.toLowerCase().includes(topKeyword) : false;

    if (topKeyword && !keywordsInTitle) {
        issues.push({ category: 'On-Page', issue: 'Primary Keyword Not in Title', impact: 'Medium', recommendation: `Include your main keyword "${topKeyword}" in the <title> tag to signal relevance to search engines.` });
    }
    if (topKeyword && !keywordsInDesc) {
        issues.push({ category: 'On-Page', issue: 'Primary Keyword Not in Meta Description', impact: 'Low', recommendation: `Include your main keyword "${topKeyword}" in the meta description to improve click-through rates.` });
    }

    // ── Performance score ─────────────────────────────────────────────────────
    let performanceScore;
    if (!loadTime || loadTime === 0) { performanceScore = 80; }
    else if (loadTime < 1000)  { performanceScore = 100; }
    else if (loadTime < 2000)  { performanceScore = 90; }
    else if (loadTime < 3500)  { performanceScore = 80; }
    else if (loadTime < 5000)  { performanceScore = 65; }
    else if (loadTime < 8000)  { performanceScore = 50; }
    else                        { performanceScore = 30; }

    technicalScore = Math.max(0, technicalScore);
    const seoScore = Math.floor((technicalScore + performanceScore) / 2);

    return {
        seoScore,
        technicalScore,
        performanceScore,
        issues,
        // technical
        hasRobotsTxt,
        hasSitemap,
        hasFavicon,
        hasCustom404,
        isWwwOptimized,
        // title
        titleText,
        titleLength,
        titleStatus,
        // meta description
        metaDescText,
        metaDescLength,
        metaDescStatus,
        // headings
        h1Count,
        h1Texts,
        h2Count,
        h2Texts,
        // images
        totalImages,
        imageAltRatio,
        missingAltImages,
        // links
        internalLinks,
        externalLinks,
        linkRatioWarning,
        // keywords
        keywords,
        keywordsInTitle,
        keywordsInDesc,
        // responsive
        hasViewportMeta,
        hasMediaQueries,
        // accessibility
        homepageReachable: true   // crawl succeeded if we reach here
    };
};

module.exports = { analyzeSEO };
