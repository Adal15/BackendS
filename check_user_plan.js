const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const UserPlan = require('./models/UserPlan');

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find().sort({ createdAt: -1 }).limit(5);
        for (const user of users) {
            const plan = await UserPlan.findOne({ userId: user._id });
            console.log(`User: ${user.email} | Role: ${user.role} | Plan: ${plan ? plan.planType : 'None'} | Pending: ${plan ? plan.pendingPlanType : 'None'} | Status: ${plan ? plan.status : 'None'}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
