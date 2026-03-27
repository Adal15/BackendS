const UserPlan = require('../models/UserPlan');

// @desc    Select a plan
// @route   POST /api/plans/select
// @access  Private
const selectPlan = async (req, res) => {
    const { planType } = req.body;

    if (!['Basic Report', 'Advanced Report', 'Expert Report'].includes(planType)) {
        return res.status(400).json({ message: 'Invalid plan type' });
    }

    try {
        let userPlan = await UserPlan.findOne({ userId: req.user._id });

        if (userPlan) {
            userPlan.planType = planType;
            userPlan.selectedAt = Date.now();
            await userPlan.save();
        } else {
            userPlan = await UserPlan.create({
                userId: req.user._id,
                planType
            });
        }

        res.status(201).json({
            message: 'Plan selected successfully',
            plan: userPlan
        });
    } catch (error) {
        console.error('Plan selection error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user plan
// @route   GET /api/plans/current
// @access  Private
const getUserPlan = async (req, res) => {
    try {
        const userPlan = await UserPlan.findOne({ userId: req.user._id });
        if (userPlan) {
            res.json(userPlan);
        } else {
            res.status(404).json({ message: 'No plan found for this user' });
        }
    } catch (error) {
        console.error('Get plan error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { selectPlan, getUserPlan };
