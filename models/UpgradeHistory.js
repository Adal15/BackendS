const mongoose = require('mongoose');

const upgradeHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: String,
    userEmail: String,
    previousPlan: String,
    requestedPlan: String,
    status: {
        type: String,
        enum: ['approved', 'rejected'],
        required: true
    },
    receiptUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('UpgradeHistory', upgradeHistorySchema);
