const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkMoreData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        
        const websiteSample = await db.collection('websites').findOne({});
        const reportSample = await db.collection('seoreports').findOne({});

        console.log('Website User Field:', websiteSample ? websiteSample.user : 'None', typeof (websiteSample ? websiteSample.user : ''));
        console.log('Report User Field:', reportSample ? reportSample.user : 'None', typeof (reportSample ? reportSample.user : ''));

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkMoreData();
