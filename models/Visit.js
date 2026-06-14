const mongoose = require('mongoose');

const RETENTION_DAYS = 30;

const visitSchema = new mongoose.Schema({
    ip: {
        type: String,
        required: true,
    },
    referer: {
        type: String,
        default: '',
    },
    userAgent: {
        type: String,
        default: '',
    },
    country: {
        type: String,
        default: '',
    },
    region: {
        type: String,
        default: '',
    },
    city: {
        type: String,
        default: '',
    },
    timezone: {
        type: String,
        default: '',
    },
    visitedAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000),
        index: { expireAfterSeconds: 0 },
    },
}, {
    collection: 'Visits',
});

visitSchema.index({ ip: 1, visitedAt: -1 });

module.exports = mongoose.model('Visit', visitSchema);
