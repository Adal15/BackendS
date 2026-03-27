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
    selectedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('UserPlan', userPlanSchema);
