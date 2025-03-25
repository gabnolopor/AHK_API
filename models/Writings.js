const mongoose = require('mongoose');

const writingsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    cover: {
        type: String,
        required: false,
        default: ''
    },
    genre: {
        type: String,
        required: true,
        default: ''
    }
}, {
    timestamps: true,
    collection: 'Writings'  // Changed to match the actual collection name case
});

module.exports = mongoose.model('Writings', writingsSchema);