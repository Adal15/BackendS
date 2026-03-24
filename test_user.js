require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        try {
            const user = await User.create({ name: 'TestUser', email: 'test_db_user@example.com', password: 'password123' });
            console.log("Success:", user);
        } catch (err) {
            console.error("DB Error:", err);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error("Connection Error:", err);
        process.exit(1);
    });
