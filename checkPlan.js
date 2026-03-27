require('dotenv').config();
const mongoose = require('mongoose');
const UserPlan = require('./models/UserPlan');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB ✅');

        const users = await User.find().select('name email');
        const plans = await UserPlan.find();

        console.log('--- User Plans ---');
        for (const plan of plans) {
            const user = users.find(u => u._id.toString() === plan.userId.toString());
            console.log(`User: ${user ? user.email : 'Unknown'} | Plan: ${plan.planType}`);
        }

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
