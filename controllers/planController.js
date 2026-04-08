const UserPlan = require('../models/UserPlan');
const Website = require('../models/Website');
const User = require('../models/User');

// @desc    Select a plan
// @route   POST /api/plans/select
// @access  Private
const selectPlan = async (req, res) => {
    if (!req.body) {
        console.error('[PlanController] req.body is MISSING');
        return res.status(400).json({ message: 'Request body is missing. Ensure multipart/form-data is used correctly.' });
    }

    const { planType } = req.body || {};
    const file = req.file;
    console.log(`[PlanController] selectPlan called for type: ${planType}, file: ${file ? file.filename : 'MISSING'}. Body keys: ${Object.keys(req.body)}`);

    if (!['Basic Report', 'Advanced Report', 'Expert Report'].includes(planType)) {
        return res.status(400).json({ message: 'Invalid plan type' });
    }

    try {
        let userPlan = await UserPlan.findOne({ userId: req.user._id });

        if (planType === 'Basic Report') {
            const websiteCount = await Website.countDocuments({ user: req.user._id });
            // Free plan upgrades immediately
            if (userPlan) {
                userPlan.planType = planType;
                userPlan.pendingPlanType = null;
                userPlan.receiptUrl = null;
                userPlan.status = 'active';
                userPlan.selectedAt = Date.now();
                userPlan.initialWebsiteCount = websiteCount;
                await userPlan.save();
            } else {
                userPlan = await UserPlan.create({
                    userId: req.user._id,
                    planType,
                    status: 'active',
                    initialWebsiteCount: websiteCount
                });
            }
            return res.status(201).json({
                message: 'Plan selected successfully',
                plan: userPlan
            });
        }

        // Premium plans require admin approval if receipt is provided
        if (file) {
            const receiptUrl = `/uploads/${file.filename}`;
            if (userPlan) {
                userPlan.pendingPlanType = planType;
                userPlan.receiptUrl = receiptUrl;
                userPlan.status = 'pending';
                await userPlan.save();
            } else {
                userPlan = await UserPlan.create({
                    userId: req.user._id,
                    planType: 'Basic Report', // Default to basic until approved
                    pendingPlanType: planType,
                    receiptUrl: receiptUrl,
                    status: 'pending'
                });
            }
            return res.status(201).json({
                message: 'Receipt submitted successfully. Admin will approve your upgrade soon.',
                plan: userPlan
            });
        }

        // If no file and not Basic, original behavior (immediate upgrade or error)
        // For this specific requirement, we assume premium plans ALWAYS need a receipt now.
        return res.status(400).json({ message: 'Receipt is required for premium plans' });

    } catch (error) {
        console.error('Plan selection error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user plan and details
// @route   GET /api/plans/current
// @access  Private
const getUserPlan = async (req, res) => {
    try {
        // Fetch fresh user to ensure scanLimitOverride is up to date
        const freshUser = await User.findById(req.user._id);
        const limitOverride = freshUser ? freshUser.scanLimitOverride : null;

        const userPlan = await UserPlan.findOne({ userId: req.user._id });
        const websiteCount = await Website.countDocuments({ user: req.user._id });
        
        let planType = userPlan ? userPlan.planType : 'Basic Report';
        let initialCount = userPlan ? (userPlan.initialWebsiteCount || 0) : 0;
        let websiteUsed = Math.max(0, websiteCount - initialCount);
        
        let scansLeft;
        const pType = planType.toLowerCase();
        
        if (limitOverride !== null && limitOverride !== undefined) {
            totalLimit = limitOverride;
            scansLeft = Math.max(0, limitOverride - websiteUsed);
        } else if (pType.includes('basic')) {
            totalLimit = 1;
            scansLeft = Math.max(0, 1 - websiteUsed);
        } else if (pType.includes('advanced')) {
            totalLimit = 5;
            scansLeft = Math.max(0, 5 - websiteUsed);
        } else if (pType.includes('expert')) {
            totalLimit = 25;
            scansLeft = Math.max(0, 25 - websiteUsed);
        } else {
            // Default for any unknown plan type
            totalLimit = 1; 
            scansLeft = Math.max(0, 1 - websiteUsed);
        }

        let responseData = {
            user: {
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                joinDate: req.user.createdAt
            },
            planType: planType,
            websiteCount: websiteCount !== null ? websiteCount : 0,
            scansLeft: scansLeft !== null ? scansLeft : 0,
            totalLimit: totalLimit,
            scanLimitOverride: limitOverride
        };

        if (userPlan) {
            responseData.selectedAt = userPlan.selectedAt;
            responseData.userId = userPlan.userId;
            responseData.status = userPlan.status;
            responseData.pendingPlanType = userPlan.pendingPlanType;
            responseData.receiptUrl = userPlan.receiptUrl;
        }

        console.log(`[PlanController] DIAGNOSTIC: UserID: ${req.user._id} | Role: ${req.user.role} | Override: ${limitOverride} | Used: ${websiteCount} | Plan: ${planType}`);
        
        return res.json(responseData);
    } catch (error) {
        console.error('Get plan error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { selectPlan, getUserPlan };
