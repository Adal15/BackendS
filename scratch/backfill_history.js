const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const UpgradeHistory = require('../models/UpgradeHistory');

async function backfillHistory() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const unknownRecords = await UpgradeHistory.find({
            $or: [
                { userName: 'Unknown' },
                { userEmail: 'Unknown' }
            ]
        });

        console.log(`Found ${unknownRecords.length} records with 'Unknown' data.`);

        let updatedCount = 0;
        for (const record of unknownRecords) {
            // Find user converting ObjectId to string to match the string _id in users collection
            const user = await User.findOne({ _id: record.userId.toString() });
            
            if (user) {
                record.userName = user.name;
                record.userEmail = user.email;
                await record.save();
                updatedCount++;
                console.log(`Updated record ${record._id} for user ${user.name}`);
            } else {
                console.log(`Could not find user for record ${record._id} (ID: ${record.userId})`);
            }
        }

        console.log(`Backfill complete. Updated ${updatedCount} records.`);
        await mongoose.connection.close();
    } catch (err) {
        console.error('Backfill failed:', err);
    }
}

backfillHistory();
