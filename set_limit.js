const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = process.argv[2] || 'user123456@example.com';
    const limit = parseInt(process.argv[3]) || 10;
    
    console.log(`Setting scanLimitOverride to ${limit} for ${email}...`);
    const user = await User.findOneAndUpdate({ email }, { scanLimitOverride: limit }, { new: true });

    if (!user) {
      console.log(`User with email ${email} not found.`);
    } else {
      console.log('--- USER DATA UPDATED ---');
      console.log('Email:', user.email);
      console.log('Scan Limit Override:', user.scanLimitOverride);
      console.log('-----------------');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

run();
