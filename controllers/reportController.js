const SEOReport = require('../models/Report');
const Website = require('../models/Website');
const UserPlan = require('../models/UserPlan');
const { addAnalysisJob } = require('../services/queueService');

const submitWebsite = async (req, res) => {
    const { url } = req.body;
    console.log(`[Reports] Request to analyze URL: ${url} from user: ${req.user ? req.user.email : 'NULL'}`);
    
    try {
        if (!req.user || !req.user._id) {
            console.error('[Reports] Unauthorized attempt or missing user object in request');
            return res.status(401).json({ message: 'Authentication required. Please log in again.' });
        }

        let website = await Website.findOne({ url, user: req.user._id });
        if (!website) {
            console.log(`[Reports] Creating new website entry for ${url}`);
            website = await Website.create({ url, user: req.user._id });
        }

        if (!website || !website._id) {
            throw new Error('Failed to create or find website record');
        }

        // Add to Queue
        console.log(`[Reports] Adding analysis job for ${url} (WebsiteID: ${website._id})`);
        const job = await addAnalysisJob(url, req.user._id, website._id);

        if (!job || !job.id) {
            throw new Error('Failed to create analysis job');
        }

        res.status(202).json({ message: 'Analysis started', jobId: job.id, websiteId: website._id });
    } catch (error) {
        console.error('[Reports] Error in submitWebsite:', error);
        res.status(500).json({ message: error.message });
    }
};

const getReport = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const report = await SEOReport.findOne({ _id: req.params.id, user: req.user._id }).populate('website');
        if (report) {
            // Fetch user plan
            const userPlan = await UserPlan.findOne({ userId: req.user._id });
            const reportData = report.toObject();
            reportData.planType = userPlan ? userPlan.planType : 'Basic Report'; // Default to Basic if not found
            
            res.json(reportData);
        } else {
            res.status(404).json({ message: 'Report not found' });
        }
    } catch (error) {
        console.error('[Reports] Error in getReport:', error);
        res.status(500).json({ message: error.message });
    }
};

const getUserReports = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const reports = await SEOReport.find({ user: req.user._id }).populate('website').sort({ createdAt: -1 });
        
        // Fetch user plan once for all reports
        const userPlan = await UserPlan.findOne({ userId: req.user._id });
        const planType = userPlan ? userPlan.planType : 'Basic Report';

        const reportsWithPlan = reports.map(r => {
            const obj = r.toObject();
            obj.planType = planType;
            return obj;
        });

        res.json(reportsWithPlan);
    } catch (error) {
        console.error('[Reports] Error in getUserReports:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { submitWebsite, getReport, getUserReports };
