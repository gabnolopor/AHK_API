const mongoose = require('mongoose');

const photographySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    filename: {
        type: String,
        required: true
    },
    imageUrl: String,
}, {
    timestamps: true,
    collection: 'Photography'  // Changed to match the actual collection name case
});

module.exports = mongoose.model('Photography', photographySchema);