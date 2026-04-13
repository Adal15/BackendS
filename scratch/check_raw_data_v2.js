const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkData() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');

        const db = mongoose.connection.db;
        const users = await db.collection('users').find({}).limit(1).toArray();
        const userPlans = await db.collection('userplans').find({}).limit(5).toArray();

        if (users.length > 0) {
            console.log('Sample User ID:', users[0]._id, typeof users[0]._id);
            console.log('Sample User Details:', { name: users[0].name, email: users[0].email });
        } else {
            console.log('NO USERS FOUND IN DATABASE');
        }

        if (userPlans.length > 0) {
            console.log('Sample UserPlan UserIDs:', userPlans.map(up => ({ id: up.userId, type: typeof up.userId })));
        } else {
            console.log('NO USERPLANS FOUND IN DATABASE');
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error('Connection failed:', err.message);
    }
}

checkData();
