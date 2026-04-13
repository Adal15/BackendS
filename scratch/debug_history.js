const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const User = require('../models/User');
const UserPlan = require('../models/UserPlan');
const UpgradeHistory = require('../models/UpgradeHistory');

async function debugHistory() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const history = await UpgradeHistory.find().sort({ createdAt: -1 }).limit(5);
        console.log('--- Recent History Records ---');
        history.forEach(h => {
            console.log(`ID: ${h._id}, User: ${h.userName}, Email: ${h.userEmail}, Status: ${h.status}`);
        });

        if (history.length > 0) {
            const first = history[0];
            const user = await User.findById(first.userId);
            console.log('--- Manual User Lookup for Last Record ---');
            console.log(`User ID from history: ${first.userId}`);
            console.log(`Found User: ${user ? user.name : 'NOT FOUND'}`);
            
            const userPlan = await UserPlan.findOne({ userId: first.userId });
            console.log(`Found UserPlan: ${userPlan ? 'YES' : 'NO'}`);
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

debugHistory();
