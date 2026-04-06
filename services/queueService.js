const Redis = require('ioredis');
const SEOReport = require('../models/Report');
const { analyzeSEO } = require('./seoEngine');

// ── Redis / BullMQ setup with graceful fallback ──────────────────────────────
let seoQueue = null;
let redisReady = false;
let errorLogged = false;

const redisConnection = process.env.REDIS_URI ? new Redis(process.env.REDIS_URI, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,   // don't pile up commands while disconnected
    lazyConnect: true,    // don't auto-connect on require
    retryStrategy: (times) => {
        // Wait 5 s then retry, but stop logging after the first failure
        return 5000;
    },
}) : null;

if (redisConnection) {
    redisConnection.on('error', (err) => {
        if (!errorLogged) {
            console.warn('[Redis] Not available – running without queue (direct mode).');
            console.warn('[Redis] Start Redis on port 6379 to enable background job processing.');
            errorLogged = true;
        }
        redisReady = false;
    });

    redisConnection.on('connect', () => {
        redisReady = true;
        errorLogged = false;
        console.log('[Redis] Connected – queue mode enabled.');

        // Lazily create the queue + worker only when Redis is actually up
        if (!seoQueue) {
            const { Queue, Worker } = require('bullmq');

            seoQueue = new Queue('seo-analysis', { connection: redisConnection });

            new Worker('seo-analysis', async job => {
                console.log(`[Worker] Processing job ${job.id} for URL: ${job.data.url}`);
                try {
                    const report = await _createReport(job.data.url, job.data.userId, job.data.websiteId);
                    console.log(`[Worker] Finished job ${job.id}, report ${report._id}`);
                    return report._id;
                } catch (error) {
                    console.error(`[Worker] Failed job ${job.id}: ${error.message}`);
                    throw error;
                }
            }, { connection: redisConnection });
        }
    });
} else {
    console.log('[Redis] REDIS_URI not set – running without queue (direct mode).');
}

// Attempt connection (non-blocking)
if (redisConnection) {
    redisConnection.connect().catch(() => { });
}

// ── Shared report creation logic ─────────────────────────────────────────────
async function _createReport(url, userId, websiteId) {
    const r = await analyzeSEO(url);

    return await SEOReport.create({
        website: websiteId,
        user: userId,

        seoScore: r.seoScore,
        technicalScore: r.technicalScore,
        performanceScore: r.performanceScore,

        issues: r.issues,

        hasRobotsTxt: r.hasRobotsTxt,
        hasSitemap: r.hasSitemap,
        hasFavicon: r.hasFavicon,
        hasCustom404: r.hasCustom404,
        isWwwOptimized: r.isWwwOptimized,
        hasViewportMeta: r.hasViewportMeta,
        hasMediaQueries: r.hasMediaQueries,
        homepageReachable: r.homepageReachable,

        titleText: r.titleText,
        titleLength: r.titleLength,
        titleStatus: r.titleStatus,

        metaDescText: r.metaDescText,
        metaDescLength: r.metaDescLength,
        metaDescStatus: r.metaDescStatus,

        h1Count: r.h1Count,
        h1Texts: r.h1Texts,
        h2Count: r.h2Count,
        h2Texts: r.h2Texts,

        totalImages: r.totalImages,
        imageAltRatio: r.imageAltRatio,
        missingAltImages: r.missingAltImages,

        internalLinks: r.internalLinks,
        externalLinks: r.externalLinks,
        linkRatioWarning: r.linkRatioWarning,

        keywords: r.keywords,
        keywordsInTitle: r.keywordsInTitle,
        keywordsInDesc: r.keywordsInDesc,

        // advanced
        canonicalUrl: r.canonicalUrl,
        hasNoindex:   r.hasNoindex,
        ogTags:       r.ogTags,
        hasSchemaData: r.hasSchemaData,
        contentFreshness: r.contentFreshness,
        brokenLinks: r.brokenLinks,
        mobileSnapshotUrl: r.mobileSnapshotUrl,
        googleRanking: r.googleRanking,

        // advanced performance & technical
        performanceDetails: r.performanceDetails,
        resourcesBreakdown: r.resourcesBreakdown,
        hasAMP: r.hasAMP,
        jsErrors: r.jsErrors,
        hasHttp2: r.hasHttp2,
        optimizedImages: r.optimizedImages,
        minifiedAssets: r.minifiedAssets,
        deprecatedHtml: r.deprecatedHtml,
        inlineStyles: r.inlineStyles,
    });
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Add an SEO analysis job.
 * - If Redis is up  → enqueue via BullMQ (background worker processes it)
 * - If Redis is down → run analysis directly (synchronous fallback)
 */
const addAnalysisJob = async (url, userId, websiteId) => {
    if (redisReady && seoQueue) {
        return await seoQueue.add('analyze', { url, userId, websiteId });
    }

    // Fallback: run directly without a queue
    console.log('[Queue] Redis unavailable – running analysis directly for:', url);
    const report = await _createReport(url, userId, websiteId);
    
    if (!report || !report._id) {
        throw new Error('Analysis completed but failed to save report to database');
    }
    
    return { id: 'direct', returnvalue: report._id };
};

module.exports = { addAnalysisJob };

