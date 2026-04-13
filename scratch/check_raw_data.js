const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');

        const db = mongoose.connection.db;
        const users = await db.collection('users').find({}).limit(1).toArray();
        const userPlans = await db.collection('userplans').find({}).limit(5).toArray();
        const history = await db.collection('upgradehistories').find({}).limit(5).toArray();

        console.log('Sample User:', users[0] ? users[0]._id : 'None');
        console.log('Sample UserPlan UserIDs:', userPlans.map(up => up.userId));
        console.log('Sample History UserIDs:', history.map(h => h.userId));

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkData();
