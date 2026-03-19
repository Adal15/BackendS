const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true },
    lastScanDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Website', websiteSchema);
