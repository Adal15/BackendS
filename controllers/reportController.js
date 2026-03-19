const SEOReport = require('../models/Report');
const Website = require('../models/Website');
const { addAnalysisJob } = require('../services/queueService');

const submitWebsite = async (req, res) => {
    const { url } = req.body;
    try {
        let website = await Website.findOne({ url, user: req.user._id });
        if (!website) {
            website = await Website.create({ url, user: req.user._id });
        }

        // Add to Queue
        const job = await addAnalysisJob(url, req.user._id, website._id);

        res.status(202).json({ message: 'Analysis started', jobId: job.id, websiteId: website._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getReport = async (req, res) => {
    try {
        const report = await SEOReport.findOne({ _id: req.params.id, user: req.user._id }).populate('website');
        if (report) {
            res.json(report);
        } else {
            res.status(404).json({ message: 'Report not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserReports = async (req, res) => {
    try {
        const reports = await SEOReport.find({ user: req.user._id }).populate('website').sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { submitWebsite, getReport, getUserReports };
