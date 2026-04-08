const User = require('../models/User');
const Website = require('../models/Website');
const SEOReport = require('../models/Report');
const jwt = require('jsonwebtoken');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@jts.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        const token = jwt.sign({ isAdmin: true, email: ADMIN_EMAIL }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
        res.json({ token, isAdmin: true });
    } else {
        res.status(401).json({ message: 'Invalid admin credentials' });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalWebsites = await Website.countDocuments();
        const totalReports = await SEOReport.countDocuments();
        const recentReports = await SEOReport.find().populate('user', 'name email').populate('website', 'url').sort({ createdAt: -1 }).limit(10);

        res.json({ totalUsers, totalWebsites, totalReports, recentReports });
    } catch (error) {
        console.error('Admin Dashboard Stats Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const UserPlan = require('../models/UserPlan');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').lean();

        // Fetch plans for all users
        const usersWithPlans = await Promise.all(users.map(async (user) => {
            const userPlan = await UserPlan.findOne({ userId: user._id });
            const websiteCount = await Website.countDocuments({ user: user._id });
            return {
                ...user,
                plan: userPlan ? userPlan.planType : 'No Plan',
                pendingPlanType: userPlan ? userPlan.pendingPlanType : null,
                receiptUrl: userPlan ? userPlan.receiptUrl : null,
                planStatus: userPlan ? userPlan.status : 'active',
                websiteCount,
                scanLimitOverride: user.scanLimitOverride !== undefined ? user.scanLimitOverride : null
            };
        }));

        res.json(usersWithPlans);
    } catch (error) {
        console.error('Admin Get All Users Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const getAllReports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        console.log(`[Admin] Fetching reports - Page: ${page}, Search: "${search}"`);

        let query = {};
        if (search) {
            // Find users matching search
            const matchingUsers = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = matchingUsers.map(u => u._id);

            // Find websites matching search
            const matchingWebsites = await Website.find({
                url: { $regex: search, $options: 'i' }
            }).select('_id');
            const websiteIds = matchingWebsites.map(w => w._id);

            query.$or = [
                { user: { $in: userIds } },
                { website: { $in: websiteIds } },
                { titleText: { $regex: search, $options: 'i' } },
                { status: { $regex: search, $options: 'i' } }
            ];
            
            console.log(`[Admin] Search Query - Users: ${userIds.length}, Websites: ${websiteIds.length}`);
        }

        const totalReports = await SEOReport.countDocuments(query);
        const reports = await SEOReport.find(query)
            .populate('user', 'name email')
            .populate('website', 'url')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            reports,
            totalReports,
            totalPages: Math.ceil(totalReports / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Admin Get All Reports Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const updateUserLimit = async (req, res) => {
    try {
        const { userId } = req.params;
        const { scanLimitOverride } = req.body;

        let finalValue = null;
        if (scanLimitOverride !== null && scanLimitOverride !== undefined && scanLimitOverride !== '') {
            finalValue = Number(scanLimitOverride);
            if (isNaN(finalValue)) finalValue = null;
        }

        console.log(`[Admin] Updating limit for user ${userId} to: ${finalValue}`);

        // Use $set to ensure the field is saved even if not fully recognized by schema initial load
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { scanLimitOverride: finalValue } },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            console.error(`[Admin] User NOT found: ${userId}`);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`[Admin] Update Successful for ${updatedUser.email}. New limit: ${updatedUser.scanLimitOverride}`);
        res.json({ message: 'User scan limit updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Admin Update User Limit Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const approvePlan = async (req, res) => {
    try {
        const { userId } = req.params;
        const userPlan = await UserPlan.findOne({ userId });

        if (!userPlan || !userPlan.pendingPlanType) {
            return res.status(400).json({ message: 'No pending plan request found' });
        }

        const websiteCount = await Website.countDocuments({ user: userId });
        userPlan.planType = userPlan.pendingPlanType;
        userPlan.pendingPlanType = null;
        userPlan.receiptUrl = null;
        userPlan.status = 'active';
        userPlan.selectedAt = Date.now();
        userPlan.initialWebsiteCount = websiteCount;
        await userPlan.save();

        res.json({ message: 'Plan approved successfully', plan: userPlan });
    } catch (error) {
        console.error('Approve plan error:', error);
        res.status(500).json({ message: error.message });
    }
};

const rejectPlan = async (req, res) => {
    try {
        const { userId } = req.params;
        const userPlan = await UserPlan.findOne({ userId });

        if (!userPlan) {
            return res.status(400).json({ message: 'User plan not found' });
        }

        userPlan.pendingPlanType = null;
        userPlan.receiptUrl = null;
        userPlan.status = 'active';
        await userPlan.save();

        res.json({ message: 'Plan request rejected successfully', plan: userPlan });
    } catch (error) {
        console.error('Reject plan error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { adminLogin, getDashboardStats, getAllUsers, getAllReports, updateUserLimit, approvePlan, rejectPlan };
