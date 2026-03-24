require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        try {
            console.log("Looking up user by ID: 69b5b63ae5e1374241ed32d6");
            const userById = await User.findById('69b5b63ae5e1374241ed32d6');
            console.log("Lookup by ID:", userById);

            console.log("Listing all users:");
            const users = await User.find({}, '_id email');
            console.log(users);
        } catch (err) {
            console.error("DB Error:", err);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error("Connection Error:", err);
        process.exit(1);
    });
