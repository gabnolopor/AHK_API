const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['music', 'interior_design', 'paintings', 'written_work', 'photography']
    },
    description: {
        type: String,
        required: false
    },
    fileUrl: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Map,
        of: String,
        default: {}
    }
});

module.exports = mongoose.model('Content', contentSchema); 