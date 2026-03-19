const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/admin')
    .then(async () => {
        console.log('Connected to MongoDB admin');
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('Databases:', dbs.databases.map(db => db.name));

        for (let dbData of dbs.databases) {
            const dbName = dbData.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;

            console.log(`\nChecking database: ${dbName}`);
            const db = mongoose.connection.useDb(dbName);
            const collections = await db.db.listCollections().toArray();
            console.log(`Collections in ${dbName}:`, collections.map(c => c.name));

            for (let c of collections) {
                const count = await db.db.collection(c.name).countDocuments();
                console.log(`  Collection ${c.name} has ${count} documents.`);
            }
        }

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
