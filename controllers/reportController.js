const SEOReport = require('../models/Report');
const Website = require('../models/Website');
const UserPlan = require('../models/UserPlan');
const User = require('../models/User');
const { addAnalysisJob } = require('../services/queueService');

const submitWebsite = async (req, res) => {
    const { url } = req.body;
    console.log(`[Reports] Request to analyze URL: ${url} from user: ${req.user ? req.user.email : 'NULL'}`);
    
    try {
        if (!req.user || !req.user._id) {
            console.error('[Reports] Unauthorized attempt or missing user object');
            return res.status(401).json({ message: 'Authentication required. Please log in again.' });
        }

        const freshUser = await User.findById(req.user._id);
        const userRole = freshUser ? freshUser.role : req.user.role;
        const limitOverride = freshUser ? freshUser.scanLimitOverride : null;

        // 1. Check for Admin bypass (case-insensitive)
        if (userRole && userRole.toLowerCase() === 'admin') {
            console.log(`[Reports] Admin user ${req.user.email} bypassing limit check.`);
            // Continue below to find/create website
        } else {
            let website = await Website.findOne({ url, user: req.user._id });
            if (!website) {
                const userPlan = await UserPlan.findOne({ userId: req.user._id });
                const planType = userPlan ? userPlan.planType : 'Basic Report';
                const websiteCount = await Website.countDocuments({ user: req.user._id });

                console.log(`[Reports] Limit Check - User: ${req.user.email} | Override: ${limitOverride} | Used: ${websiteCount} | Plan: ${planType}`);

                // 2. High priority: Check scanLimitOverride
                if (limitOverride !== null && limitOverride !== undefined) {
                    if (websiteCount >= limitOverride) {
                        return res.status(403).json({ 
                            message: 'PLAN_LIMIT_REACHED', 
                            error: `Your account has a custom scan limit of ${limitOverride} websites. Currently used: ${websiteCount}. Please contact the administrator.` 
                        });
                    }
                } 
                // 3. Regular Plan Logic
                else if (planType === 'Basic Report' && websiteCount >= 1) {
                    return res.status(403).json({ 
                        message: 'PLAN_LIMIT_REACHED', 
                        error: 'Your current Basic plan allows for only 1 website analysis. Please upgrade to search new websites.' 
                    });
                } else if (planType === 'Advanced Report' && websiteCount >= 5) {
                    return res.status(403).json({ 
                        message: 'PLAN_LIMIT_REACHED', 
                        error: 'Your current Advanced plan allows for up to 5 websites. Please upgrade to Expert Report to search more websites.' 
                    });
                } else if (planType === 'Expert Report' && websiteCount >= 25) {
                    return res.status(403).json({ 
                        message: 'PLAN_LIMIT_REACHED', 
                        error: 'Your current Expert plan allows for up to 25 websites. Please contact support to increase your limit.' 
                    });
                }
            }
        }

        let website = await Website.findOne({ url, user: req.user._id });
        if (!website) {
            console.log(`[Reports] Creating new website document for ${url}`);
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
        const isAdmin = req.admin && req.admin.isAdmin;
        const userId = req.user ? req.user._id : null;

        if (!isAdmin && !userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        let query = { _id: req.params.id };
        if (!isAdmin) {
            query.user = userId;
        }

        const report = await SEOReport.findOne(query).populate('website');
        if (report) {
            // Fetch the owner's plan so admin sees the same view as the user
            const userPlan = await UserPlan.findOne({ userId: report.user });
            const reportData = report.toObject();
            reportData.planType = userPlan ? userPlan.planType : 'Basic Report';
            
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
