const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const SEOReport = require('../models/Report');
const Website = require('../models/Website');
const { analyzeSEO } = require('./seoEngine');

const connection = new Redis(process.env.REDIS_URI || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null
});

const seoQueue = new Queue('seo-analysis', { connection });

const worker = new Worker('seo-analysis', async job => {
    console.log(`Processing job ${job.id} for URL: ${job.data.url}`);

    try {
        const r = await analyzeSEO(job.data.url);

        const report = await SEOReport.create({
            website: job.data.websiteId,
            user:    job.data.userId,

            // scores
            seoScore:         r.seoScore,
            technicalScore:   r.technicalScore,
            performanceScore: r.performanceScore,

            // issues
            issues: r.issues,

            // technical flags
            hasRobotsTxt:      r.hasRobotsTxt,
            hasSitemap:        r.hasSitemap,
            hasFavicon:        r.hasFavicon,
            hasCustom404:      r.hasCustom404,
            isWwwOptimized:    r.isWwwOptimized,
            hasViewportMeta:   r.hasViewportMeta,
            hasMediaQueries:   r.hasMediaQueries,
            homepageReachable: r.homepageReachable,

            // title
            titleText:   r.titleText,
            titleLength: r.titleLength,
            titleStatus: r.titleStatus,

            // meta description
            metaDescText:   r.metaDescText,
            metaDescLength: r.metaDescLength,
            metaDescStatus: r.metaDescStatus,

            // headings
            h1Count: r.h1Count,
            h1Texts: r.h1Texts,
            h2Count: r.h2Count,
            h2Texts: r.h2Texts,

            // images
            totalImages:      r.totalImages,
            imageAltRatio:    r.imageAltRatio,
            missingAltImages: r.missingAltImages,

            // links
            internalLinks:    r.internalLinks,
            externalLinks:    r.externalLinks,
            linkRatioWarning: r.linkRatioWarning,

            // keywords
            keywords:        r.keywords,
            keywordsInTitle: r.keywordsInTitle,
            keywordsInDesc:  r.keywordsInDesc,
        });

        console.log(`Finished job ${job.id}, produced report ${report._id}`);
        return report._id;
    } catch (error) {
        console.error(`Failed job ${job.id}: ${error.message}`);
        throw error;
    }
}, { connection });

const addAnalysisJob = async (url, userId, websiteId) => {
    return await seoQueue.add('analyze', { url, userId, websiteId });
};

module.exports = { addAnalysisJob };
