const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = process.argv[2] || 'admin@jts.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User with email ${email} not found.`);
      const allUsers = await User.find({}, 'email role scanLimitOverride');
      console.log('All Users in DB:', allUsers);
    } else {
      console.log('--- USER DATA ---');
      console.log('Email:', user.email);
      console.log('ID:', user._id);
      console.log('Role:', user.role);
          console.log('Scan Limit Override:', user.scanLimitOverride);
      console.log('-----------------');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

run();
