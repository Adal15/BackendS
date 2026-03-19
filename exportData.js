const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

mongoose.connect('mongodb://localhost:27017/seoanalyzer')
    .then(async () => {
        console.log('Connected to MongoDB for export');
        const db = mongoose.connection.db;

        const collections = ['websites', 'seoreports', 'users'];

        for (const collName of collections) {
            const data = await db.collection(collName).find().toArray();
            fs.writeFileSync(path.join(__dirname, `${collName}_export.json`), JSON.stringify(data, null, 2));
            console.log(`Exported ${data.length} documents from ${collName} to ${collName}_export.json`);
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('Export failed:', err);
        process.exit(1);
    });
