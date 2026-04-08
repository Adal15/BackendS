const mongoose = require('mongoose');

const userPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    planType: {
        type: String,
        enum: ['Basic Report', 'Advanced Report', 'Expert Report'],
        required: true
    },
    pendingPlanType: {
        type: String,
        enum: ['Basic Report', 'Advanced Report', 'Expert Report'],
        default: null
    },
    receiptUrl: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'pending'],
        default: 'active'
    },
    selectedAt: {
        type: Date,
        default: Date.now
    },
    initialWebsiteCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('UserPlan', userPlanSchema);
