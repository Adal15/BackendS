const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    website: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true },
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    scanDate: { type: Date, default: Date.now },

    // ── Scores ───────────────────────────────────────────────────────────────
    seoScore:         { type: Number, default: 0 },
    technicalScore:   { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 },

    // ── Issues / suggestions ─────────────────────────────────────────────────
    issues: [{
        category:       String,
        issue:          String,
        impact:         String,
        recommendation: String
    }],
    suggestions: [String],
    status: { type: String, default: 'completed' },

    // ── Technical flags ──────────────────────────────────────────────────────
    hasRobotsTxt:    { type: Boolean, default: false },
    hasSitemap:      { type: Boolean, default: false },
    hasFavicon:      { type: Boolean, default: false },
    hasCustom404:    { type: Boolean, default: false },
    isWwwOptimized:  { type: Boolean, default: false },
    hasViewportMeta: { type: Boolean, default: false },
    hasMediaQueries: { type: Boolean, default: false },
    homepageReachable: { type: Boolean, default: true },

    // ── Title ────────────────────────────────────────────────────────────────
    titleText:   { type: String, default: '' },
    titleLength: { type: Number, default: 0 },
    titleStatus: { type: String, default: 'missing' }, // missing|short|ok|long

    // ── Meta description ─────────────────────────────────────────────────────
    metaDescText:   { type: String, default: '' },
    metaDescLength: { type: Number, default: 0 },
    metaDescStatus: { type: String, default: 'missing' }, // missing|short|ok|long

    // ── Headings ─────────────────────────────────────────────────────────────
    h1Count: { type: Number, default: 0 },
    h1Texts: [String],
    h2Count: { type: Number, default: 0 },
    h2Texts: [String],

    // ── Images ───────────────────────────────────────────────────────────────
    totalImages:    { type: Number, default: 0 },
    imageAltRatio:  { type: Number, default: 100 },
    missingAltImages: [{ src: String, snippet: String }],

    // ── Links ────────────────────────────────────────────────────────────────
    internalLinks:    { type: Number, default: 0 },
    externalLinks:    { type: Number, default: 0 },
    linkRatioWarning: { type: Boolean, default: false },

    // ── Keywords ─────────────────────────────────────────────────────────────
    keywords: [{ word: String, count: Number }],
    keywordsInTitle: { type: Boolean, default: false },
    keywordsInDesc:  { type: Boolean, default: false },
    
    // ── Advanced SEO ────────────────────────────────────────────────────────
    canonicalUrl: { type: String, default: '' },
    hasNoindex:   { type: Boolean, default: false },
    
    ogTags: {
        title:       String,
        description: String,
        image:       String,
        url:         String
    },
    
    hasSchemaData: { type: Boolean, default: false },
    
    contentFreshness: {
        lastModified:         Date,
        ogUpdatedTime:        Date,
        articlePublishedTime: Date
    },
    
    brokenLinks: [{
        url:    String,
        status: Number,
        text:   String
    }],
    
    mobileSnapshotUrl: { type: String, default: '' },
    googleRanking: {
        rank: { type: Number, default: 0 },
        keyword: { type: String, default: '' }
    }

}, { timestamps: true });

module.exports = mongoose.model('SEOReport', reportSchema);
